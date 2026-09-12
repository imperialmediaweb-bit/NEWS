import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { getSiteId } from "@/lib/site-id";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Advertorial campaigns — a paid placement ordered through MediaChief, spread
 * across the network over several days instead of appearing on fifty sites at
 * once.
 *
 *   POST /api/admin/campaign?key=CRON_SECRET
 *     { title, content, summary?, category?, author?, images?: [url],
 *       sitesPerDay?, sponsorName?, sponsorUrl? }
 *
 *   GET  /api/admin/campaign?key=CRON_SECRET&status=true   list campaigns
 *   GET  /api/admin/campaign?key=CRON_SECRET               publish what is due
 *                                                          (the cron calls this)
 *
 * Two things differ from the Romanian version this is based on, both because
 * fifty English-language sites are judged as one network:
 *
 * 1. The same article on fifty domains under the same slug is duplicate
 *    content at network scale — the pattern Google calls scaled content abuse,
 *    and the fastest way to lose AdSense across all fifty at once. Each site
 *    gets its own slug and a localised opening line, and `sitesPerDay` is
 *    capped so a campaign is a trickle rather than a broadcast.
 *
 * 2. Paid placements must be disclosed, and paid links must not pass PageRank.
 *    Every campaign article carries a sponsored-content notice, and sponsor
 *    links are rendered rel="sponsored nofollow noopener". This is not
 *    optional and is not configurable.
 */

const MAX_SITES_PER_DAY = 10;

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await pool.query(
    `CREATE TABLE IF NOT EXISTS campaigns (
       id              SERIAL PRIMARY KEY,
       created_at      TIMESTAMPTZ DEFAULT NOW(),
       title           TEXT NOT NULL,
       content         TEXT NOT NULL,
       summary         TEXT DEFAULT '',
       category        TEXT DEFAULT 'business',
       author          TEXT DEFAULT 'Sponsored Content',
       images          TEXT DEFAULT '[]',
       sponsor_name    TEXT DEFAULT '',
       sponsor_url     TEXT DEFAULT '',
       sites_per_day   INT  DEFAULT 5,
       remaining_sites TEXT DEFAULT '[]',
       published_sites TEXT DEFAULT '[]',
       status          TEXT DEFAULT 'active',
       next_publish_at TIMESTAMPTZ DEFAULT NOW()
     )`
  );
  schemaReady = true;
}

function authorised(req: NextRequest, bodyKey?: string): boolean {
  const key =
    bodyKey ||
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.CRON_SECRET) && key === process.env.CRON_SECRET;
}

/** Create a campaign. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!authorised(req, body.key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The cron dispatcher can only POST, so it asks for a publish run this way
  // rather than needing a second endpoint.
  if (body.publish === true) {
    await ensureSchema();
    return NextResponse.json(await publishDue());
  }

  const { title, content } = body;
  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  await ensureSchema();

  const perDay = Math.min(MAX_SITES_PER_DAY, Math.max(1, Number(body.sitesPerDay) || 5));
  // Shuffled so campaigns don't all march through the network in the same
  // order, which would make the pattern obvious to anyone watching one site.
  const order = Object.values(sites)
    .map((s) => s.slug)
    .sort(() => Math.random() - 0.5);

  const { rows } = await pool.query(
    `INSERT INTO campaigns
       (title, content, summary, category, author, images, sponsor_name, sponsor_url,
        sites_per_day, remaining_sites, published_sites)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'[]')
     RETURNING id`,
    [
      title,
      content,
      body.summary || "",
      body.category || "business",
      body.author || "Sponsored Content",
      JSON.stringify(body.images || []),
      body.sponsorName || "",
      body.sponsorUrl || "",
      perDay,
      JSON.stringify(order),
    ]
  );

  return NextResponse.json({
    ok: true,
    campaignId: rows[0].id,
    totalSites: order.length,
    sitesPerDay: perDay,
    estimatedDays: Math.ceil(order.length / perDay),
  });
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureSchema();

  if (req.nextUrl.searchParams.get("status") === "true") {
    const { rows } = await pool.query(
      `SELECT id, title, status, sites_per_day, remaining_sites, published_sites,
              created_at, next_publish_at
         FROM campaigns ORDER BY created_at DESC LIMIT 25`
    );
    return NextResponse.json({
      campaigns: rows.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        sitesPerDay: c.sites_per_day,
        remaining: safeList(c.remaining_sites).length,
        published: safeList(c.published_sites).length,
        createdAt: c.created_at,
        nextPublishAt: c.next_publish_at,
      })),
    });
  }

  return NextResponse.json(await publishDue());
}

/** Publish the day's batch for every campaign that is due. */
async function publishDue(): Promise<Record<string, unknown>> {
  const { rows: due } = await pool.query(
    `SELECT * FROM campaigns
      WHERE status = 'active' AND next_publish_at <= NOW()
      ORDER BY id ASC`
  );

  if (due.length === 0) {
    return { message: "No campaigns due", published: 0 };
  }

  const report: Record<string, unknown>[] = [];

  for (const campaign of due) {
    const remaining = safeList(campaign.remaining_sites);
    const published = safeList(campaign.published_sites);
    const images = safeList(campaign.images);
    const perDay = Number(campaign.sites_per_day) || 5;

    if (remaining.length === 0) {
      await pool.query("UPDATE campaigns SET status = 'completed' WHERE id = $1", [campaign.id]);
      report.push({ campaignId: campaign.id, title: campaign.title, status: "completed" });
      continue;
    }

    const batch = remaining.slice(0, perDay);
    const links: { site: string; url: string }[] = [];
    const failures: { site: string; error: string }[] = [];

    for (let i = 0; i < batch.length; i++) {
      const site = sites[batch[i]];
      if (!site) continue;

      try {
        const siteId = await getSiteId(site.slug);
        if (siteId === null) {
          failures.push({ site: batch[i], error: "No site row" });
          continue;
        }

        const slug = buildSlug(campaign.title as string, site.stateAbbr || site.slug);
        const category = ((campaign.category as string) || "business")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        const html = renderCampaignBody(
          campaign.content as string,
          site.city,
          site.state,
          campaign.sponsor_name as string,
          campaign.sponsor_url as string
        );

        await pool.query(
          `INSERT INTO articles
             (site_id, title, slug, content, summary, category, author, featured_image, published_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
           ON CONFLICT DO NOTHING`,
          [
            siteId,
            campaign.title,
            slug,
            html,
            campaign.summary || "",
            category,
            campaign.author || "Sponsored Content",
            images.length > 0 ? images[i % images.length] : null,
          ]
        );

        links.push({ site: site.slug, url: `https://${site.domain}/${category}/${slug}` });
      } catch (e) {
        failures.push({ site: batch[i], error: e instanceof Error ? e.message : String(e) });
      }
    }

    const newRemaining = remaining.slice(perDay);
    await pool.query(
      `UPDATE campaigns
          SET remaining_sites = $2,
              published_sites = $3,
              next_publish_at = NOW() + INTERVAL '1 day',
              status = CASE WHEN $4::int = 0 THEN 'completed' ELSE 'active' END
        WHERE id = $1`,
      [
        campaign.id,
        JSON.stringify(newRemaining),
        JSON.stringify([...published, ...links.map((l) => l.site)]),
        newRemaining.length,
      ]
    );

    report.push({
      campaignId: campaign.id,
      title: campaign.title,
      publishedNow: links.length,
      remaining: newRemaining.length,
      links,
      ...(failures.length > 0 && { failures }),
    });
  }

  return { campaigns: report };
}

/**
 * A distinct slug per site. Publishing fifty copies under one slug makes the
 * duplication trivially visible; this at least keeps each site's URL its own.
 */
function buildSlug(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 180);
  return `${base}-${suffix.toLowerCase()}`;
}

/**
 * Wrap the supplied copy with the disclosure Google requires on paid
 * placements, and a localised opening so the fifty copies are not byte
 * identical. Sponsor links are rel="sponsored nofollow" — a paid link that
 * passes PageRank is a link-scheme violation.
 */
function renderCampaignBody(
  content: string,
  city: string,
  state: string,
  sponsorName: string,
  sponsorUrl: string
): string {
  const disclosure = `<p><em>This is sponsored content${
    sponsorName ? ` paid for by ${escapeHtml(sponsorName)}` : ""
  }. It was not produced by our newsroom.</em></p>`;

  const intro = `<p>The following is a sponsored message for readers in ${escapeHtml(city)}, ${escapeHtml(state)}.</p>`;

  const footer = sponsorUrl
    ? `<p><a href="${escapeHtml(sponsorUrl)}" rel="sponsored nofollow noopener" target="_blank">Learn more${
        sponsorName ? ` about ${escapeHtml(sponsorName)}` : ""
      }</a></p>`
    : "";

  return `${disclosure}${intro}${content}${footer}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeList(value: unknown): string[] {
  try {
    const parsed = JSON.parse((value as string) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
