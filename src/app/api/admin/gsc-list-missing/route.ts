import { NextRequest, NextResponse } from "next/server";
import { sites } from "@/config/sites";
import { getGoogleAccessToken } from "@/lib/google-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Compare the 50 configured sites against the Search Console properties the
 * service account can actually see, and report which ones are missing.
 *
 *   GET /api/admin/gsc-list-missing?key=CRON_SECRET
 *   GET /api/admin/gsc-list-missing?key=CRON_SECRET&coverage=1
 *
 * With coverage=1 it also pulls the last 28 days of clicks/impressions per
 * property, which is the quickest way to see which sites Google is actually
 * surfacing versus which are merely verified.
 *
 * The service account must be added as a user on each property — verification
 * itself still has to be done by hand in Search Console.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !privateKey) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY must both be set",
      },
      { status: 400 }
    );
  }

  let token: string;
  try {
    token = await getGoogleAccessToken(
      email,
      privateKey,
      "https://www.googleapis.com/auth/webmasters.readonly"
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Google auth failed",
        hint: "Enable the Search Console API in Google Cloud and confirm the private key is intact.",
      },
      { status: 500 }
    );
  }

  const listRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) {
    return NextResponse.json(
      { error: `Search Console list failed (${listRes.status})`, body: await listRes.text() },
      { status: 502 }
    );
  }

  const data = (await listRes.json()) as {
    siteEntry?: { siteUrl?: string; permissionLevel?: string }[];
  };
  const entries = data.siteEntry || [];

  // Map every property back to a bare hostname so sc-domain:, https://www.
  // and https:// forms all match one site.
  const byDomain = new Map<string, { siteUrl: string; permissionLevel: string }>();
  for (const entry of entries) {
    const siteUrl = entry.siteUrl || "";
    const domain = normaliseProperty(siteUrl);
    if (domain) {
      byDomain.set(domain, {
        siteUrl,
        permissionLevel: entry.permissionLevel || "unknown",
      });
    }
  }

  const all = Object.values(sites);
  const added: Record<string, unknown>[] = [];
  const missing: { site: string; domain: string; addUrl: string }[] = [];

  for (const site of all) {
    const domain = site.domain.toLowerCase();
    const match = byDomain.get(domain);
    if (match) {
      // A property being listed is not the same as it being usable.
      // `siteUnverifiedUser` means the account was added but never verified —
      // it can see the property exists and nothing else. And a URL-prefix
      // property on the www host collects nothing here, because middleware
      // 301s every www request to the bare domain.
      const usable =
        match.permissionLevel === "siteOwner" ||
        match.permissionLevel === "siteFullUser" ||
        match.permissionLevel === "siteRestrictedUser";
      const isDomainProperty = match.siteUrl.startsWith("sc-domain:");
      const isWwwPrefix = !isDomainProperty && /^https?:\/\/www\./i.test(match.siteUrl);

      added.push({
        site: site.slug,
        domain: site.domain,
        ...match,
        usable,
        propertyType: isDomainProperty ? "domain" : "url-prefix",
        ...(isWwwPrefix && {
          warning:
            "URL-prefix property on the www host, which 301s to the bare domain — this property sees only redirects. Replace it with a sc-domain property.",
        }),
        ...(!usable && {
          warning2:
            "permissionLevel is not an owner/full user: the property is listed but its data cannot be read.",
        }),
      });
    } else {
      missing.push({
        site: site.slug,
        domain: site.domain,
        addUrl: `https://search.google.com/search-console/welcome?resource_id=sc-domain%3A${encodeURIComponent(domain)}`,
      });
    }
  }

  // Optional: last-28-day performance for each verified property.
  if (req.nextUrl.searchParams.get("coverage") === "1") {
    const end = new Date();
    const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);
    const range = { startDate: isoDate(start), endDate: isoDate(end) };

    for (const row of added) {
      const siteUrl = row.siteUrl as string;
      row.last28Days = await fetchPerformance(token, siteUrl, range);
    }
    added.sort(
      (a, b) =>
        ((b.last28Days as Perf)?.impressions ?? -1) -
        ((a.last28Days as Perf)?.impressions ?? -1)
    );
  }

  const usableCount = added.filter((a) => a.usable).length;

  return NextResponse.json({
    serviceAccount: email,
    totalSites: all.length,
    // "listed" is what the API can see; "usable" is what it can actually read.
    // Reporting only the first number makes a broken setup look half-working.
    listed: added.length,
    usable: usableCount,
    missing: missing.length,
    gscPropertiesVisible: entries.length,
    added,
    missingSites: missing,
    hint:
      missing.length > 0
        ? `POST /api/admin/gsc-setup to create and verify sc-domain properties automatically via Cloudflare DNS, or add them by hand and grant ${email} access to each.`
        : "All configured sites are present.",
  });
}

interface Perf {
  clicks: number;
  impressions: number;
  error?: string;
}

async function fetchPerformance(
  token: string,
  siteUrl: string,
  range: { startDate: string; endDate: string }
): Promise<Perf> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...range, dimensions: [], rowLimit: 1 }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return { clicks: 0, impressions: 0, error: `HTTP ${res.status}` };
    const json = (await res.json()) as {
      rows?: { clicks?: number; impressions?: number }[];
    };
    const row = json.rows?.[0];
    return { clicks: row?.clicks ?? 0, impressions: row?.impressions ?? 0 };
  } catch (e) {
    return { clicks: 0, impressions: 0, error: e instanceof Error ? e.message : "failed" };
  }
}

/** Reduce any Search Console property identifier to a bare hostname. */
function normaliseProperty(siteUrl: string): string | null {
  if (siteUrl.startsWith("sc-domain:")) {
    return siteUrl.slice("sc-domain:".length).toLowerCase();
  }
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
