import { NextRequest, NextResponse } from "next/server";
import PostalMime from "postal-mime";
import { getSiteByDomain } from "@/config/sites";
import { insertFeedItem, duplicateReason, loadDedupContext } from "@/lib/pipeline/dedup";
import { extractArticleText } from "@/lib/pipeline/source-fetch";

/**
 * Press releases that arrive by email (agencies' GovDelivery and "subscribe
 * to news releases" lists), the way local papers get them. Cloudflare Email
 * Routing hands releases@{site domain} to a small Email Worker, which POSTs
 * the raw message here; the site the address belongs to decides the state.
 *
 *   POST /api/pipeline/inbound-email   (Authorization: Bearer CRON_SECRET)
 *   body: the raw RFC 822 message; header X-Envelope-To: releases@texasexpres.com
 *
 * The release then goes through the same queue, relevance check and strict
 * rewrite rules as every other source, credited to the sending agency.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// newsletters, confirmations and digests are not releases
const NOT_A_RELEASE = /confirm your|verify your|subscription|unsubscribe confirmation|welcome to|you have been subscribed|password|digest of|weekly roundup/i;

export async function POST(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const to = (req.headers.get("x-envelope-to") || "").toLowerCase();
  const domain = to.split("@")[1] || "";
  const site = getSiteByDomain(domain);
  if (!site) return NextResponse.json({ skipped: `no site for ${to}` });

  const raw = await req.arrayBuffer();
  const mail = await PostalMime.parse(raw);
  const subject = (mail.subject || "").replace(/\s+/g, " ").trim();
  const fromName = (mail.from?.name || mail.from?.address || "official release").replace(/"/g, "").trim();
  if (subject.length < 15 || NOT_A_RELEASE.test(subject)) return NextResponse.json({ skipped: "not a release", subject });

  const text = mail.html ? extractArticleText(mail.html) : (mail.text || "");
  const body = text.length >= 300 ? text : (mail.text || text);
  if (body.replace(/\s+/g, " ").length < 300) return NextResponse.json({ skipped: "too short", subject });

  // the first real photo in the message, credited to the agency (logos and tracking pixels skipped)
  const img = (mail.html || "").match(/<img[^>]+src=["'](https:[^"']+\.(?:jpe?g|png|webp)[^"']*)["'][^>]*>/gi)
    ?.map((t) => t.match(/src=["']([^"']+)["']/i)?.[1] || "")
    .find((u) => u && !/logo|seal|banner|header|footer|icon|pixel|spacer|social|facebook|twitter|instagram|youtube|linkedin/i.test(u));
  // the release's own web copy when the message links to it, else the message id
  const link =
    (mail.html || mail.text || "").match(/https:\/\/(?:content\.govdelivery\.com\/accounts\/[A-Z0-9_]+\/bulletins\/[a-z0-9]+|[^\s"'<>]+\/(?:news|press|release|newsroom)[^\s"'<>]*)/i)?.[0] ||
    `mailto:${mail.messageId || subject}`;

  const item = {
    guid: mail.messageId || link,
    title: subject,
    link,
    description: `${img ? `<!--img:${img}-->` : ""}${body.slice(0, 20000)}`,
    pubDate: new Date(mail.date || Date.now()).toISOString(),
    source: fromName,
  };
  const ctx = await loadDedupContext();
  if (await duplicateReason(item, ctx)) return NextResponse.json({ skipped: "duplicate", subject });
  const id = await insertFeedItem(item, `email:${fromName}`.slice(0, 120), "local-news", site.state);
  return NextResponse.json({ queued: !!id, state: site.state, subject, from: fromName });
}
