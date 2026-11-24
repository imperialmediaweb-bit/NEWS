import { NextRequest, NextResponse } from "next/server";
import { getSiteByDomain } from "@/config/sites";
import { searchBusinesses, bizHref } from "@/lib/directory";
import { DIR_CATEGORIES } from "@/lib/directory-categories";
import { llmJson } from "@/lib/llm-json";
import { readSite } from "@/lib/site-reader";

/**
 * AI help on the "add your business" form.
 *  - action "find": look the business up in the directory (to claim it) and,
 *    when a website is given, read that site and fill the fields from it.
 *  - action "write": turn the owner's notes into a listing description and a
 *    sponsored article. Only facts the owner gave or their site states.
 * Rate-limited per IP; the website fetch refuses private / internal addresses.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}
const CATS = DIR_CATEGORIES.map((c) => `${c.slug} (${c.name})`).join(", ");

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  const b = await req.json().catch(() => ({})) as Record<string, string>;
  const s = (k: string, n = 300) => String(b[k] || "").trim().slice(0, n);

  if (b.action === "find") {
    const name = s("name", 120), city = s("city", 60), website = s("website", 300);
    const matches = name.length >= 2 ? (await searchBusinesses(site.slug, name, city || undefined, 6)).map((x) => ({ name: x.name, city: x.city, address: x.address, phone: x.phone, href: bizHref(x), slug: x.slug, claimed: x.claimed })) : [];
    let fields: Record<string, string> | null = null;
    if (website) {
      const page = await readSite(website);
      if (page) {
        fields = await llmJson<Record<string, string>>(`You fill in a local business directory form from the business's own website.
Use ONLY information that appears in the text below. If something is not there, return an empty string. Never guess.
Return JSON with keys: name, phone, address (street only), city, zip, hours (short, e.g. "Mon-Fri 8am-5pm"), description (2-3 plain sentences, max 400 characters, in third person, no superlatives that the page does not state), category (one slug from: ${CATS}), facebook (URL), instagram (URL).
Business state: ${site.state}.
WEBSITE (${page.url}):
${page.text}`).catch(() => null);
        if (fields) fields.website = page.url;
      }
    }
    return NextResponse.json({ matches, fields, websiteRead: !!fields });
  }

  if (b.action === "write") {
    const name = s("name", 160), notes = s("notes", 2000), description = s("description", 800), city = s("city", 60), category = s("category", 60);
    if (!name || (notes.length + description.length) < 30) return NextResponse.json({ error: "Write a few lines about the business first." }, { status: 400 });
    const out = await llmJson<{ description: string; title: string; article: string }>(`You help a local business write its directory listing and a sponsored article for ${site.name}, a ${site.state} news site.
STRICT RULES: use ONLY the facts below. Do not add awards, prices, years, staff names, numbers, services or claims that are not written below. No "best" or "#1" unless the owner wrote it, and then attribute it ("the owners say..."). Plain, warm, factual American English. Third person.
Return JSON: {"description": "2-3 sentences, max 450 characters, for the directory listing", "title": "headline for the sponsored article, max 90 characters, include the business name and the city", "article": "the sponsored article, 3-5 short paragraphs separated by blank lines, 180-350 words"}.
FACTS FROM THE OWNER:
Business: ${name}
Category: ${category}
City: ${city}, ${site.state}
Address: ${s("address", 200)}
Phone: ${s("phone", 40)}
Website: ${s("website", 300)}
Hours: ${s("hours", 200)}
Current description: ${description}
Owner's notes: ${notes}`, 1800).catch(() => null);
    if (!out?.description) return NextResponse.json({ error: "The writing assistant is busy. Please try again in a minute." }, { status: 503 });
    return NextResponse.json(out);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
