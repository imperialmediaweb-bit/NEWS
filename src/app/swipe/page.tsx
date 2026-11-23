import type { Metadata } from "next";
import pool from "@/lib/db";
import { siteFromHeaders } from "@/lib/topic-page";
import { mockupOf } from "@/config/design-cfg";
import InBrief, { type BriefItem } from "@/components/design/InBrief";

/** "In Brief": the day's stories full screen, one at a time, swipe up for the next (like the Expres "Pe scurt"). */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteFromHeaders();
  return {
    title: `${site.state} Express Swipe: Today's News`,
    description: `Today's ${site.state} stories, one screen at a time. Swipe up for the next one.`,
    alternates: { canonical: `https://${site.domain}/swipe` },
    robots: { index: false, follow: true },
  };
}

export default async function InBriefPage() {
  const site = siteFromHeaders();
  const { rows } = await pool.query(
    `SELECT a.title, a.slug, a.category, a.summary, a.featured_image, a.published_at
       FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE s.slug = $1 AND a.published_at > now() - interval '72 hours'
        AND a.featured_image IS NOT NULL AND a.featured_image <> ''
      ORDER BY a.published_at DESC LIMIT 40`,
    [site.slug]
  ).catch(() => ({ rows: [] as Record<string, unknown>[] }));
  const items: BriefItem[] = rows.map((r) => ({
    title: String(r.title),
    href: `/${r.category}/${r.slug}`,
    section: String(r.category).replace(/-/g, " "),
    summary: String(r.summary || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260),
    image: String(r.featured_image),
    when: new Date(r.published_at as string).toISOString(),
  }));
  const m = mockupOf(site.slug);
  return <InBrief items={items} siteName={site.name} state={site.state} domain={site.domain} ink={m?.ink || "#14213d"} acc={m?.acc || site.accent || "#b91c1c"} />;
}
