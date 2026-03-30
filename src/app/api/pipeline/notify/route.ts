import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

/**
 * Submit recently published auto-generated articles to IndexNow
 * for faster search engine indexing.
 */
export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPipelineEnabled())) {
    return NextResponse.json({ message: "Pipeline disabled" });
  }

  const startTime = Date.now();
  const runId = await logRunStart("indexnow");

  try {
    // Get articles published in the last 3 hours that haven't been notified
    const { rows: articles } = await pool.query(
      `SELECT a.slug, a.category, s.domain
       FROM articles a
       JOIN sites s ON a.site_id = s.id
       WHERE a.auto_generated = true
       AND a.published_at > NOW() - INTERVAL '3 hours'
       LIMIT 500`
    );

    if (articles.length === 0) {
      await logRunEnd(runId, 0, 0, Date.now() - startTime);
      return NextResponse.json({ message: "No new articles to notify", count: 0 });
    }

    // Build URLs grouped by domain
    const urlsByDomain = new Map<string, string[]>();
    for (const article of articles) {
      const domain = article.domain;
      const url = `https://${domain}/${article.category}/${article.slug}`;
      if (!urlsByDomain.has(domain)) {
        urlsByDomain.set(domain, []);
      }
      urlsByDomain.get(domain)!.push(url);
    }

    let totalNotified = 0;
    let totalFailed = 0;

    // Submit to IndexNow for each domain (batch up to 10000 URLs per request)
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      const entries = Array.from(urlsByDomain.entries());
      for (const [domain, urls] of entries) {
        try {
          const res = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: domain,
              key: indexNowKey,
              urlList: urls.slice(0, 10000),
            }),
          });
          if (res.ok || res.status === 202) {
            totalNotified += urls.length;
          } else {
            totalFailed += urls.length;
          }
        } catch {
          totalFailed += urls.length;
        }
      }
    }

    await logRunEnd(runId, totalNotified, totalFailed, Date.now() - startTime);

    return NextResponse.json({
      notified: totalNotified,
      failed: totalFailed,
      domains: urlsByDomain.size,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime, String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
