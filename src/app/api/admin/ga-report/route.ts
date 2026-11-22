import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Google Analytics 4, read with the service account (Viewer on the GA account):
 * every property it can see, and per property the last N days of users,
 * sessions and page views by channel (Organic Search, Direct, Social...).
 *   GET /api/admin/ga-report?key=CRON_SECRET&days=28
 * Needs the Analytics Admin API and the Analytics Data API enabled in the
 * service account's Google Cloud project.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Summary = { displayName: string; propertySummaries?: { property: string; displayName: string }[] };

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !privateKey) return NextResponse.json({ error: "No service account configured" }, { status: 500 });
  const days = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "28", 10) || 28));

  let token: string;
  try {
    token = await getGoogleAccessToken(email, privateKey, "https://www.googleapis.com/auth/analytics.readonly");
  } catch (e) {
    return NextResponse.json({ step: "token", error: String(e).slice(0, 300) }, { status: 500 });
  }
  const auth = { Authorization: `Bearer ${token}` };

  const sumRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", { headers: auth });
  if (!sumRes.ok) return NextResponse.json({ step: "accountSummaries", status: sumRes.status, error: (await sumRes.text()).slice(0, 400) });
  const sums = ((await sumRes.json()) as { accountSummaries?: Summary[] }).accountSummaries || [];
  const props = sums.flatMap((a) => (a.propertySummaries || []).map((p) => ({ account: a.displayName, id: p.property.replace("properties/", ""), name: p.displayName })));

  const out = [];
  for (const p of props) {
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${p.id}:runReport`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
      }),
    });
    if (!r.ok) {
      out.push({ ...p, error: `${r.status}: ${(await r.text()).slice(0, 200)}` });
      continue;
    }
    const data = (await r.json()) as { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };
    const channels: Record<string, { users: number; sessions: number; views: number }> = {};
    let users = 0, sessions = 0, views = 0;
    for (const row of data.rows || []) {
      const [u, s, v] = row.metricValues.map((m) => Number(m.value) || 0);
      channels[row.dimensionValues[0].value] = { users: u, sessions: s, views: v };
      users += u; sessions += s; views += v;
    }
    out.push({ ...p, users, sessions, views, channels });
  }
  return NextResponse.json({ days, properties: props.length, report: out });
}
