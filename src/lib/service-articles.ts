import pool from "@/lib/db";
import { sites } from "@/config/sites";
import type { SiteConfig } from "@/config/site-config";
import { llmJson } from "@/lib/llm-json";
import { findImage } from "@/lib/pipeline/images";
import { storeImage } from "@/lib/pipeline/image-store";
import { citiesOf } from "@/lib/local-data";
import { PRODUCTS } from "@/lib/paid";

/**
 * "Guides" section on every paper: one article a day about what people search
 * when they need our services: obituaries, press releases, advertising and the
 * business directory ("how to publish an obituary in Montana", "where to
 * publish a press release in Texas"). Each article answers the question
 * honestly, uses that state's towns, links to the paper's own order pages
 * with search-style anchors, and carries a credited free photo.
 * Facts about our services come only from the list below; the model may give
 * general how-to advice but no statistics, laws, other papers' prices or
 * quotes. Stored as articles in category "guides".
 */

type Topic = { key: string; product: "obituary" | "release" | "advertise" | "directory"; title: (s: SiteConfig, town: string) => string; angle: string; image: string };
const T = (key: string, product: Topic["product"], title: Topic["title"], angle: string, image: string): Topic => ({ key, product, title, angle, image });

export const TOPICS: Topic[] = [
  T("obit-how-publish", "obituary", (s) => `How to Publish an Obituary in ${s.state}: Cost, Steps and Examples`, "step-by-step: gather details, write, add a photo, publish online, share with family", "candles memorial"),
  T("obit-how-write", "obituary", (s) => `How to Write an Obituary: A Simple Guide for ${s.state} Families`, "structure of an obituary, what to include, tone, a fill-in template", "writing letter"),
  T("obit-father", "obituary", (s) => `How to Write an Obituary for Your Father (${s.state} Guide With Template)`, "how to write about a father's life, work, family; template", "old family photos"),
  T("obit-mother", "obituary", () => `How to Write an Obituary for Your Mother: Examples and Template`, "how to write about a mother's life, family, values; template", "flowers memorial"),
  T("obit-cost", "obituary", (s) => `How Much Does an Obituary Cost in ${s.state}?`, "what affects the price of an obituary, online vs print, how to keep it affordable", "calculator notebook"),
  T("obit-online", "obituary", (s, t) => `Online Obituaries in ${t}, ${s.stateAbbr}: How to Post One Today`, "why online obituaries, how fast they go live, sharing with relatives far away", "laptop flowers"),
  T("obit-what-include", "obituary", (s) => `What to Include in an Obituary: A Checklist for ${s.state} Families`, "checklist: full name, dates, places, family, service details, memorial donations, photo", "checklist pen"),
  T("obit-service-details", "obituary", (s) => `How to Announce Funeral Service Details in ${s.state}`, "how to write service date, time, place, visitation, memorial donations clearly", "church flowers"),
  T("pr-where", "release", (s) => `Where to Publish a Press Release in ${s.state} (${new Date().getFullYear()})`, "options for publishing a press release in the state, what to look for, why local news sites", "newspaper press"),
  T("pr-cost", "release", (s) => `How Much Does Press Release Distribution Cost in ${s.state}?`, "what press release distribution costs depend on, local vs national, one-time vs subscription", "business desk"),
  T("pr-local-news", "release", (s, t) => `How to Get Your Press Release in ${t} News`, "local angle, timing, contact, why local editors pick some releases", "city newspaper"),
  T("pr-small-business", "release", (s) => `Press Releases for Small Businesses in ${s.state}: When and How`, "good reasons for a release: opening, hiring, expansion, award, event; how to write it", "small business owner shop"),
  T("pr-nonprofit", "release", (s) => `How ${s.state} Nonprofits Can Get Press Coverage`, "fundraisers, volunteers, grants, events; writing a release; publishing it", "volunteers community"),
  T("pr-event", "release", (s, t) => `How to Promote an Event in ${t}, ${s.stateAbbr} With a Press Release`, "event releases: what, when, where, tickets, contact; when to send", "event crowd stage"),
  T("pr-template", "release", (s) => `Press Release Template for ${s.state} Businesses (Copy and Paste)`, "a copy-paste template with dateline in the state, explained line by line", "typewriter"),
  T("pr-new-hire", "release", (s) => `How to Announce a New Hire or Promotion in ${s.state}`, "personnel announcements: what to include, photo, quote, where to publish", "office handshake"),
  T("ad-cost", "advertise", (s) => `How Much Does It Cost to Advertise in a ${s.state} Newspaper?`, "types of local news advertising and what affects price; affordable options", "newspaper advertising"),
  T("ad-cheap", "advertise", (s, t) => `Cheap Ways to Advertise a Small Business in ${t}, ${s.stateAbbr}`, "free and low-cost options, then paid local news options", "small shop storefront"),
  T("ad-restaurant", "advertise", (s) => `How to Advertise a Restaurant in ${s.state}`, "openings, menus, events, local news stories, directory listing", "restaurant interior"),
  T("ad-sponsored", "advertise", (s) => `What Is Sponsored Content? A Guide for ${s.state} Businesses`, "sponsored stories explained, labelling rules, when they work", "reading news tablet"),
  T("ad-grand-opening", "advertise", (s, t) => `How to Promote a Grand Opening in ${t}`, "announcing an opening: timing, story, photo, local news, directory", "ribbon cutting"),
  T("ad-contractor", "advertise", (s) => `Marketing for Contractors and Home Services in ${s.state}`, "being found by local customers: directory, reviews, local stories", "contractor tools"),
  T("dir-get-found", "directory", (s, t) => `How to Get Your Business Found Online in ${t}, ${s.stateAbbr}`, "free listings, directory profiles, reviews, keeping hours and phone correct", "smartphone map"),
  T("dir-reviews", "directory", (s) => `How to Get More Customer Reviews in ${s.state} (Without Breaking the Rules)`, "asking for honest reviews, why fake reviews are illegal (FTC), replying to reviews", "five stars rating"),
  T("dir-free-listing", "directory", (s) => `Free Business Listings in ${s.state}: Where to Add Yours`, "why free listings matter, what to fill in, keeping them correct", "open sign shop"),
  T("dir-new-business", "directory", (s) => `Just Opened a Business in ${s.state}? 7 Ways to Tell Your Town`, "listing, opening story, press release, social media, local events", "new shop opening"),
];

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

let ready = false;
async function schema() {
  if (ready) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS service_articles_log (
    id SERIAL PRIMARY KEY, site_slug VARCHAR(100) NOT NULL, topic TEXT NOT NULL, town TEXT, article_slug TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (site_slug, topic, town))`);
  ready = true;
}

function links(site: SiteConfig) {
  const s = esc(site.state);
  return {
    obituary: `<a href="/obituaries/submit">place an obituary in ${s}</a>`,
    release: `<a href="/press-release">publish a press release in ${s}</a>`,
    advertise: `<a href="/advertise">advertise your business in ${s}</a>`,
    directory: `<a href="/directory/join">add your business to the ${s} directory</a>`,
  };
}

/** Write and publish one service article for one paper. */
export async function serviceArticleFor(siteSlug: string): Promise<string | null> {
  await schema();
  const site = sites[siteSlug];
  if (!site) return null;
  const towns = citiesOf(site.state).map(([n]) => n);
  const { rows: done } = await pool.query(`SELECT topic, town FROM service_articles_log WHERE site_slug = $1`, [site.slug]);
  const used = new Set(done.map((d: { topic: string; town: string | null }) => `${d.topic}|${d.town || ""}`));
  // first every topic once (with the biggest town), then the town-based topics again for other towns
  let topic: Topic | null = null, town = towns[0] || site.city;
  const offset = site.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % TOPICS.length; // papers start at different topics
  for (let i = 0; i < TOPICS.length && !topic; i++) {
    const t = TOPICS[(offset + i) % TOPICS.length];
    if (!used.has(`${t.key}|${town}`) && !used.has(`${t.key}|`)) topic = t;
  }
  if (!topic) {
    outer: for (const tw of towns.slice(1)) for (const t of TOPICS) if (t.title(site, "X").includes("X") && !used.has(`${t.key}|${tw}`)) { topic = t; town = tw; break outer; }
  }
  if (!topic) return null;
  const townBased = topic.title(site, "X").includes("X");
  const title = topic.title(site, town);
  const price = { obituary: `$${(PRODUCTS.obituary.cents / 100).toFixed(0)}`, release: `$${(PRODUCTS.press_release.cents / 100).toFixed(0)}`, sponsored: `$${(PRODUCTS.sponsored.cents / 100).toFixed(0)}`, spotlight: `$${(PRODUCTS.spotlight.cents / 100).toFixed(0)}` };
  const facts = `FACTS ABOUT ${site.name.toUpperCase()} (the only facts you may state about this paper and its services):
- ${site.name} is a ${site.state} news site at ${site.domain}.
- Obituary with photo: ${price.obituary}, written by the family (a writing assistant can help), published online within one business day, stays online permanently, can be shared with family. Order page: [[obituary]].
- Press release: ${price.release}, published as written and labelled "Press release", live within one business day, permanent, with a link to the company website. Order page: [[release]]. All 50 state papers of the network at once: $149.
- Sponsored story: ${price.sponsored}, labelled "Sponsored", live within one business day; +$100 to feature it on the homepage for 7 days. Advertising page: [[advertise]].
- Business directory: free listing; Business Spotlight ${price.spotlight} once for 12 months at the top of the town's list plus a profile article. Page: [[directory]].
- Every paid order is reviewed; full refund if declined. Payment by card. No subscriptions.
- ${site.state} towns you may mention: ${towns.slice(0, 8).join(", ")}.`;
  const out = await llmJson<{ title: string; summary: string; sections: Array<{ heading: string; text: string }>; faqs: Array<{ q: string; a: string }> }>(
    `You write a helpful, practical article for the "Guides" section of ${site.name}. Title (keep it exactly): "${title}". Topic angle: ${topic.angle}.
Rules:
- Answer the reader's question honestly and usefully, in plain American English, 700-1,100 words.
- General how-to advice is fine. Do NOT state statistics, studies, laws, legal deadlines, other companies' or newspapers' prices, or quotes. Do not invent anything about ${site.name}: use only the FACTS below for it.
- Mention ${townBased ? town : site.state} naturally; do not claim anything specific about a town beyond its name.
- Put internal links in the text using these exact placeholders where they fit naturally (use 2 or 3 of them, each once): [[obituary]] = "place an obituary in ${site.state}", [[release]] = "publish a press release in ${site.state}", [[advertise]] = "advertise your business in ${site.state}", [[directory]] = "add your business to the ${site.state} directory". Write the placeholder alone, the anchor text is added for you.
- Return JSON: {"title": "${title}", "summary": "one sentence, max 160 characters", "sections": [{"heading": "question-style subheading", "text": "1-3 paragraphs separated by blank lines"}] (5-7 sections; for template topics include the template in one section as plain lines), "faqs": [{"q": "...", "a": "..."}] (3 questions people search, short answers)}.
${facts}`, 4000).catch(() => null);
  if (!out?.sections?.length) return null;
  const L = links(site);
  const fill = (t: string) => esc(t).replace(/\[\[(obituary|release|advertise|directory)\]\]/g, (_, k: keyof typeof L) => L[k]);
  const product = topic.product;
  const cta = {
    obituary: `<aside class="guide-cta"><b>Ready to share your loved one's story?</b> ${L.obituary.replace(">place an", ">Place an")}: ${price.obituary}, with photo, online within one business day.</aside>`,
    release: `<aside class="guide-cta"><b>Have news to announce?</b> ${L.release.replace(">publish a", ">Publish a")}: ${price.release}, live within one business day. All 50 states: $149.</aside>`,
    advertise: `<aside class="guide-cta"><b>Want ${esc(site.state)} customers to know you?</b> ${L.advertise.replace(">advertise", ">Advertise")}: sponsored stories from ${price.sponsored}.</aside>`,
    directory: `<aside class="guide-cta"><b>Is your business listed?</b> ${L.directory.replace(">add", ">Add")}: free, or Business Spotlight for ${price.spotlight}.</aside>`,
  }[product];
  const html = out.sections.map((x) => `<h2>${esc(x.heading)}</h2>\n${String(x.text).split(/\n\s*\n/).map((p) => `<p>${fill(p.trim()).replace(/\n/g, "<br>")}</p>`).join("\n")}`).join("\n")
    + `\n${cta}`
    + (out.faqs?.length ? `\n<h2>Frequently asked questions</h2>\n${out.faqs.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${fill(f.a)}</p>`).join("\n")}` : "");
  const { rows: s } = await pool.query("SELECT id FROM sites WHERE slug = $1", [site.slug]);
  if (!s[0]) return null;
  const img = await findImage(topic.image, "guides", { title, state: site.state }).catch(() => null);
  const stored = img?.url ? await storeImage(img.url, title).catch(() => null) : null;
  const slug = slugify(title);
  const ins = await pool.query(
    `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, source_url, auto_generated, image_credit)
     VALUES ($1,$2,$3,$4,$5,'guides',$6,$7,now(),NULL,true,$8) ON CONFLICT (site_id, slug) DO NOTHING RETURNING id`,
    [s[0].id, title, slug, html, String(out.summary || "").slice(0, 300), `${site.name} Guides`, stored || img?.url || null, img?.credit || null]
  );
  await pool.query(`INSERT INTO service_articles_log (site_slug, topic, town, article_slug) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`, [site.slug, topic.key, townBased ? town : "", ins.rows[0] ? `guides/${slug}` : null]);
  return ins.rows[0] ? `guides/${slug}` : null;
}

/** Cron: up to `max` papers whose last guide is 22+ hours old get the next one. */
export async function serviceArticlesTick(max = 3) {
  await schema();
  const { rows } = await pool.query(`SELECT site_slug, MAX(created_at) last FROM service_articles_log GROUP BY site_slug`);
  const last = new Map(rows.map((r: { site_slug: string; last: string }) => [r.site_slug, new Date(r.last).getTime()]));
  const due = Object.keys(sites).filter((s) => Date.now() - (last.get(s) || 0) > 22 * 3600000)
    .sort((a, b) => (last.get(a) || 0) - (last.get(b) || 0)).slice(0, max);
  const out: Array<{ site: string; article: string | null }> = [];
  for (const s of due) out.push({ site: s, article: await serviceArticleFor(s).catch((e) => { console.error("service article", s, e); return null; }) });
  return out;
}
