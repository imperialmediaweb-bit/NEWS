import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { getBusiness, reviewsOf } from "@/lib/directory";
import { catBySlug } from "@/lib/directory-categories";
import { parseHours, rangeText, DAY_NAMES, openNow } from "@/lib/opening-hours";
import { TZ } from "@/config/timezones";
import { llmJson } from "@/lib/llm-json";

/**
 * "Ask AI about this business": answers a reader's question from the listing
 * itself (hours, address, phone, website, description, category) and its
 * verified reviews. Never guesses: when the data doesn't say, it says so and
 * points to the phone number or website. Rate-limited per IP.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const hits = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (arr.length >= 30) return NextResponse.json({ error: "Too many questions. Try again later." }, { status: 429 });
  arr.push(now); hits.set(ip, arr);
  const b0 = (await req.json().catch(() => ({}))) as { slug?: string; q?: string };
  const q = String(b0.q || "").trim().slice(0, 300);
  if (q.length < 3) return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  const b = await getBusiness(site.slug, String(b0.slug || ""));
  if (!b) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const reviews = await reviewsOf(b.id);
  const week = parseHours(b.hours);
  const tz = TZ[site.state] || "America/New_York";
  const status = week ? openNow(week, tz) : null;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz });
  const facts = [
    `Name: ${b.name}`,
    `Type: ${catBySlug(b.category)?.name || b.category}`,
    `Address: ${[b.address, b.city, site.stateAbbr, b.zip].filter(Boolean).join(", ")}`,
    b.phone && `Phone: ${b.phone}`,
    b.website && `Website: ${b.website}`,
    week ? `Opening hours: ${DAY_NAMES.map((d, i) => `${d} ${rangeText(week[i])}`).join("; ")}` : b.hours ? `Opening hours (as listed): ${b.hours}` : "Opening hours: not listed",
    status && `Right now (${today}, local time): ${status.label}`,
    b.description && `Description from the business: ${b.description}`,
    b.facebook && `Facebook: ${b.facebook}`,
    reviews.length ? `Verified reader reviews (${reviews.length}): ${reviews.slice(0, 12).map((r) => `${r.rating}/5 "${r.body.slice(0, 300)}"`).join(" | ")}` : "Reviews: none yet",
  ].filter(Boolean).join("\n");
  const out = await llmJson<{ answer: string }>(
    `You answer a reader's question about one local business on ${site.name}.
Use ONLY the FACTS. If the facts don't answer it (prices, services not listed, parking, menus, appointments...), say plainly that the listing doesn't say and suggest calling${b.phone ? ` ${b.phone}` : ""}${b.website ? " or checking their website" : ""}. Never guess, never invent services, prices or policies. Reviews are opinions: say "readers say" when you use them.
Answer in 1-3 short sentences, friendly, American English. Return JSON {"answer": "..."}.
FACTS:
${facts}
QUESTION: ${q}`, 400).catch(() => null);
  if (!out?.answer) return NextResponse.json({ error: "The assistant is busy. Please try again." }, { status: 503 });
  return NextResponse.json({ answer: String(out.answer).slice(0, 700) });
}
