import { NextRequest, NextResponse } from "next/server";
import { ensurePaidTable } from "@/lib/paid";
import { autoPublishSpotlights } from "@/lib/paid-publish";
import { writeMonthlyArticles } from "@/lib/monthly-article";
import { sendMonthlyReports } from "@/lib/monthly-report";
import { sendOwnerDrip } from "@/lib/owner-drip";
import { sendInvites } from "@/lib/invite";
import { autoReviewClaims } from "@/lib/auto-approve";

/** Cron: write the monthly articles of live websites; publish Spotlight profiles and monthly articles when due (unless declined in /admin/paid). */
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensurePaidTable();
  // listings and claims that check out are approved; repeats are dropped
  const review = await autoReviewClaims().catch((e) => ({ error: String(e) }));
  // monthly articles for live websites are written first, then everything due goes live
  const written = await writeMonthlyArticles().catch(() => 0);
  const published = await autoPublishSpotlights();
  const reports = await sendMonthlyReports().catch(() => 0);
  // follow-ups to free owners: off until NEWSLETTER_POSTAL_ADDRESS is set
  const followups = await sendOwnerDrip().catch(() => 0);
  // invitations to imported businesses: INVITES_PER_DAY a day (default 5)
  const invites = await sendInvites().catch((e) => ({ error: String(e) }));
  return NextResponse.json({ review, written, published, reports, followups, invites });
}
