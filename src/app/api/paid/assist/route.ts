import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { llmJson } from "@/lib/llm-json";

/**
 * Writing help on the paid forms (sponsored story, press release, obituary).
 * Uses ONLY what the customer typed: no invented facts, names, numbers,
 * awards or quotes. The customer sees and edits the text before paying.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const hits = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  if (arr.length >= 15) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  arr.push(now); hits.set(ip, arr);
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const facts = Object.entries(b).filter(([k, v]) => k !== "product" && typeof v === "string" && v.trim()).map(([k, v]) => `${k}: ${String(v).slice(0, 2500)}`).join("\n");
  if (facts.length < 40) return NextResponse.json({ error: "Write a few details first." }, { status: 400 });
  const kind = b.product === "obituary" ? "an obituary" : b.product === "press_release" ? "a press release" : "a sponsored news-style story";
  const style = b.product === "obituary"
    ? `Warm, dignified, plain American English. Third person. Structure: who they were and when/where they died (only as given), their life (only as given), family (only as given), service details (only as given). No cause of death unless given. No religious language unless given.`
    : b.product === "press_release"
    ? `Standard press release: dateline "${(b.city || site.city || "").toUpperCase()}, ${site.stateAbbr}" then the news, then details, then "About ${b.business || "the company"}" and the media contact if given. Factual, no hype.`
    : `Local news style, third person, factual and friendly. Lead with what is new, then details, then how readers can visit or take part. No hype words like "best" unless the customer wrote them.`;
  const out = await llmJson<{ title: string; body: string }>(`You help a customer of ${site.name}, a ${site.state} news site, write ${kind}.
STRICT: use ONLY the facts below. Do not invent names, dates, numbers, prices, quotes, awards, relatives, places or achievements. If something is missing, leave it out. Never add a quote that is not in the facts.
${style}
Return JSON {"title": "headline, max 100 characters", "body": "the text, 3-6 short paragraphs separated by blank lines, 150-450 words"}.
FACTS FROM THE CUSTOMER:
${facts}`, 1800).catch(() => null);
  if (!out?.body) return NextResponse.json({ error: "The writing assistant is busy. Please try again in a minute." }, { status: 503 });
  return NextResponse.json({ title: String(out.title || "").slice(0, 160), body: String(out.body).slice(0, 6000) });
}
