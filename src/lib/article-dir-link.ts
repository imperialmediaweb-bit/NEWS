import pool from "@/lib/db";
import { catBySlug } from "@/lib/directory-categories";

/**
 * A story about a town gets one useful link into that town's business guide:
 * the field the story is about ("water main break" -> plumbers) when we rank
 * at least 5 of them there, otherwise the town's whole guide. Cheap: one
 * grouped count per article view.
 */
const TOPICS: [string, RegExp][] = [
  ["plumbers", /\b(water main|pipes?|flood(?:ing|ed)?|leak|sewer|boil[- ]water)\b/i],
  ["roofers", /\b(hail|tornado|roofs?|storm damage|high winds?)\b/i],
  ["hvac", /\b(heat wave|freez(?:e|ing)|heating|air[- ]condition\w*|cold snap)\b/i],
  ["electricians", /\b(power outage|outages?|electrical|blackout)\b/i],
  ["auto-repair", /\b(crash|collision|vehicles?|traffic|highway|pileup|car)\b/i],
  ["lawyers", /\b(court|lawsuit|sued|attorney|charged|indicted|sentenc\w+|trial)\b/i],
  ["doctors", /\b(hospital|health|clinic|flu|virus|medical|patients?)\b/i],
  ["dentists", /\b(dental|dentist|teeth)\b/i],
  ["veterinarians", /\b(pets?|dogs?|cats?|animal shelter|veterinar\w+)\b/i],
  ["real-estate-agents", /\b(home sales|housing market|real estate|mortgage|home prices)\b/i],
  ["insurance-agents", /\b(insurance|premiums?)\b/i],
  ["accountants", /\b(tax(?:es)?|irs|refunds?)\b/i],
  ["restaurants", /\b(restaurants?|dining|chef|menu|food truck|eatery)\b/i],
  ["coffee-shops", /\b(coffee|caf[eé])\b/i],
  ["bars", /\b(bar|pub|beer|brewer\w*|nightlife)\b/i],
  ["event-venues", /\b(wedding|festival|concert|gala|event venue)\b/i],
  ["hotels", /\b(tourism|tourists?|visitors|hotels?)\b/i],
  ["clothing-stores", /\b(black friday|holiday shopping|retail\w*|shoppers?)\b/i],
  ["gyms", /\b(fitness|gym|marathon|workout)\b/i],
  ["landscapers", /\b(trees?|lawns?|yard|landscap\w+|drought)\b/i],
  ["contractors", /\b(construction|renovat\w+|remodel\w*|builders?)\b/i],
];

export async function directoryLinkBox(siteSlug: string, place: string | null, title: string, content: string, cityLabel: string): Promise<string> {
  if (!place || / (county|parish)$/i.test(place)) return "";
  const citySlug = place.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { rows } = await pool.query(`SELECT category, COUNT(*)::int n FROM businesses WHERE site_slug = $1 AND city_slug = $2 AND status = 'active' GROUP BY category`, [siteSlug, citySlug]).catch(() => ({ rows: [] }));
  if (!rows.length) return "";
  const counts = Object.fromEntries(rows.map((r: { category: string; n: number }) => [r.category, r.n]));
  const total = rows.reduce((a: number, r: { n: number }) => a + r.n, 0);
  if (total < 5) return "";
  const text = `${title} ${content.replace(/<[^>]+>/g, " ").slice(0, 2500)}`;
  let best: string | null = null, hits = 0;
  for (const [cat, re] of TOPICS) {
    if ((counts[cat] || 0) < 5) continue;
    const n = (text.match(new RegExp(re.source, "gi")) || []).length + (re.test(title) ? 2 : 0);
    if (n > hits) { best = cat; hits = n; }
  }
  const e = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (best) {
    const c = catBySlug(best)!;
    return `\n<aside class="pr-offer"><b>Need ${e(c.one.startsWith("a") || c.one.startsWith("e") || c.one.startsWith("i") || c.one.startsWith("o") || c.one.startsWith("u") ? "an" : "a")} ${e(c.one)} in ${e(cityLabel)}?</b> See the <a href="/directory/best/${citySlug}/${best}">top ${e(c.name.toLowerCase())} in ${e(cityLabel)}</a>, ranked by reader reviews, or <a href="/directory/${citySlug}/${best}">get free quotes</a>.</aside>`;
  }
  return `\n<aside class="pr-offer"><b>Living in ${e(cityLabel)}?</b> The <a href="/directory/${citySlug}">${e(cityLabel)} Business Guide</a> ranks ${total.toLocaleString("en-US")} local businesses by reader reviews.</aside>`;
}
