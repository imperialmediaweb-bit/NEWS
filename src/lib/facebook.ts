import { query } from "./db";
import crypto from "crypto";

export const FB_API_VERSION = "v21.0";
export const FB_GRAPH = `https://graph.facebook.com/${FB_API_VERSION}`;
export const FB_OAUTH = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`;

/**
 * What this app needs, and why every one of them is here.
 *
 * pages_manage_engagement was removed once, to get past an authorization
 * dialog that refused the request with "Invalid Scopes:
 * pages_read_user_content" — a retired permission that appears nowhere in
 * this codebase or in the request URL, which Meta appears to pair with it.
 * Removing it did clear the dialog, and broke the thing the posting exists
 * for: every article went up as a photo with no link, because the link goes
 * in the first comment and commenting needs this permission. Eleven posts
 * went out that way before it was noticed.
 *
 * The Romanian network requests the same permission and has been commenting
 * for months, so it is not broken in general — whatever Meta objects to is
 * specific to this app's configuration. If the dialog refuses again, the
 * place to look is the use case's permission list at
 * developers.facebook.com, not this array.
 */
export const FB_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  // Required to put the article link in the first comment.
  "pages_manage_engagement",
  // Required for Pages owned by a Business Manager, which most of these are.
  "business_management",
];

// business_management was removed once, because requesting it adds a consent
// screen listing every Business on the account and the owner could not tell
// which of the six held the newspapers. The note here said that if a Page
// turned out to be Business-owned it would simply be missing after
// connecting, and to add this back then.
//
// That is exactly what happened, and the numbers say so plainly: the old app,
// which asked for this, returned 33 Pages. The new one, without it, returned
// 12 — and the account has Pages for all fifty papers. Nothing else about the
// request changed.
//
// So most of these Pages are Business-owned and do not appear in
// /me/accounts without it. The consent screen is the price, and the answer to
// it is "all Businesses" — not because that is tidy, but because the Pages
// are spread across them and nobody knows which.

/**
 * The address a browser can actually reach, for redirects.
 *
 * Behind Railway's proxy the request's own URL is http://localhost:8080/… —
 * the port the container binds, not the domain the reader typed. Redirecting
 * to `new URL(path, req.url)` therefore sent people to localhost:8080, which
 * refuses the connection on their machine. The public host only survives in
 * the forwarded headers.
 */
export function publicBase(req: { headers: { get(name: string): string | null } }): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  return `${proto}://${host}`;
}

export function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://news-production-dd80.up.railway.app";
  return `${base.replace(/\/$/, "")}/api/auth/facebook/callback`;
}

export function signState(payload: string): string {
  const secret = process.env.CRON_SECRET || "admin123";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function makeState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const payload = `${nonce}.${ts}`;
  return `${payload}.${signState(payload)}`;
}

export function verifyState(state: string, maxAgeMs = 10 * 60 * 1000): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, ts, sig] = parts;
  if (signState(`${nonce}.${ts}`) !== sig) return false;
  const age = Date.now() - parseInt(ts, 10);
  return age >= 0 && age <= maxAgeMs;
}

export interface FbPageRow {
  id: number;
  page_id: string;
  page_name: string;
  site_slug: string | null;
  access_token: string;
  category: string | null;
  connected_at: string;
}

// The cron hits this every 5 minutes and the admin routes on every call,
// re-issuing 6 DDL statements (each taking catalog locks) for tables that
// already exist. Run it at most once per process.
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = createSchema().catch((e) => {
      schemaReady = null; // allow a retry if it genuinely failed
      throw e;
    });
  }
  return schemaReady;
}

async function createSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS facebook_pages (
      id SERIAL PRIMARY KEY,
      page_id VARCHAR(64) NOT NULL UNIQUE,
      page_name VARCHAR(255) NOT NULL,
      site_slug VARCHAR(100),
      access_token TEXT NOT NULL,
      category VARCHAR(100),
      connected_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_fb_pages_site ON facebook_pages(site_slug)`);

  await query(`
    CREATE TABLE IF NOT EXISTS facebook_posts (
      id SERIAL PRIMARY KEY,
      article_id INTEGER,
      site_slug VARCHAR(100) NOT NULL,
      page_id VARCHAR(64) NOT NULL,
      fb_post_id VARCHAR(128),
      status VARCHAR(20) NOT NULL,
      error TEXT,
      posted_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_fb_posts_article ON facebook_posts(article_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_fb_posts_site ON facebook_posts(site_slug)`);
}

export async function exchangeCodeForUserToken(code: string): Promise<string> {
  const url = new URL(`${FB_GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID || "");
  url.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET || "");
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`FB token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${FB_GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID || "");
  url.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET || "");
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`FB long-lived token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

export interface FbPageData {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export async function fetchUserPages(userToken: string): Promise<FbPageData[]> {
  const out: FbPageData[] = [];
  let nextUrl: string | null = `${FB_GRAPH}/me/accounts?fields=id,name,access_token,category&limit=100&access_token=${encodeURIComponent(userToken)}`;
  while (nextUrl) {
    const res: Response = await fetch(nextUrl, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(`FB pages fetch failed: ${JSON.stringify(data)}`);
    if (Array.isArray(data.data)) out.push(...data.data);
    nextUrl = data.paging?.next || null;
  }
  return out;
}

export async function savePages(pages: FbPageData[]): Promise<number> {
  let count = 0;
  for (const p of pages) {
    await query(
      `INSERT INTO facebook_pages (page_id, page_name, access_token, category, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (page_id) DO UPDATE
       SET page_name = EXCLUDED.page_name,
           access_token = EXCLUDED.access_token,
           category = EXCLUDED.category,
           updated_at = NOW()`,
      [p.id, p.name, p.access_token, p.category || null]
    );
    count++;
  }
  return count;
}

export async function postToPage(pageId: string, accessToken: string, message: string, link?: string): Promise<{ id: string }> {
  const url = `${FB_GRAPH}/${pageId}/feed`;
  const body = new URLSearchParams();
  body.set("message", message);
  if (link) body.set("link", link);
  body.set("access_token", accessToken);

  const res = await fetch(url, { method: "POST", body, cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`FB post failed: ${JSON.stringify(data)}`);
  }
  return { id: data.id };
}

export async function postPhotoToPage(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  message: string
): Promise<{ id: string; post_id: string }> {
  const url = `${FB_GRAPH}/${pageId}/photos`;
  const body = new URLSearchParams();
  body.set("url", imageUrl);
  body.set("caption", message);
  body.set("access_token", accessToken);

  const res = await fetch(url, { method: "POST", body, cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`FB photo post failed: ${JSON.stringify(data)}`);
  }
  return { id: data.id, post_id: data.post_id || data.id };
}

export async function commentOnPost(
  postId: string,
  accessToken: string,
  message: string
): Promise<{ id: string }> {
  const url = `${FB_GRAPH}/${postId}/comments`;
  const body = new URLSearchParams();
  body.set("message", message);
  body.set("access_token", accessToken);

  const res = await fetch(url, { method: "POST", body, cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`FB comment failed: ${JSON.stringify(data)}`);
  }
  return { id: data.id };
}

export interface ArticleForFb {
  id: number;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  slug: string;
  category_slug: string | null;
  site_slug: string;
}

export function buildArticleUrl(siteDomain: string, article: ArticleForFb): string {
  const cat = article.category_slug || "local-news";
  return `https://${siteDomain}/${cat}/${article.slug}`;
}

const ENGAGING_QUESTIONS_BY_CATEGORY: Record<string, string[]> = {
  sport: [
    "Do you think the outcome will be different next time?",
    "How would you rate this performance?",
    "Who deserved the win in your opinion?",
  ],
  politic: [
    "What decision would you have made in their place?",
    "Do you think this changes anything for regular people?",
    "What do you want to see happen next?",
  ],
  business: [
    "How does this affect your wallet directly?",
    "Have you thought about how this changes your plans?",
    "How are you preparing for the months ahead?",
  ],
  crime: [
    "Does this seem like a fair outcome to you?",
    "What punishment would have been truly just?",
    "Do you think this case will go all the way?",
  ],
  health: [
    "Have you or someone you know dealt with something similar?",
    "What should be done to prevent this from happening again?",
    "Do you know anyone affected by this?",
  ],
  default: [
    "What's your take on this?",
    "How do you see this situation?",
    "Do you agree with what happened?",
    "Have you seen similar cases?",
    "How do you think this story will develop?",
    "What would you do in their place?",
  ],
};

function pickQuestion(category: string | null, seed: number): string {
  const c = (category || "").toLowerCase();
  for (const key of Object.keys(ENGAGING_QUESTIONS_BY_CATEGORY)) {
    if (key !== "default" && c.includes(key)) {
      const arr = ENGAGING_QUESTIONS_BY_CATEGORY[key];
      return arr[seed % arr.length];
    }
  }
  const def = ENGAGING_QUESTIONS_BY_CATEGORY.default;
  return def[seed % def.length];
}

function categoryEmoji(category: string | null): string {
  const c = (category || "").toLowerCase();
  if (c.includes("sport")) return "⚽";
  if (c.includes("politic")) return "🏛️";
  if (c.includes("econom") || c.includes("business")) return "💰";
  if (c.includes("justit") || c.includes("crime")) return "⚖️";
  if (c.includes("health") || c.includes("sanat")) return "🏥";
  if (c.includes("educat")) return "🎓";
  if (c.includes("tech")) return "💻";
  if (c.includes("world") || c.includes("internat")) return "🌍";
  if (c.includes("entertainment")) return "🎬";
  if (c.includes("opinion")) return "💬";
  return "📰";
}

function makeHashtags(siteSlug: string, city?: string, state?: string): string {
  const tags: string[] = [];
  if (state) tags.push(`#${state.replace(/\s+/g, "")}`);
  const brand = siteSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  tags.push(`#${brand}`);
  tags.push(state ? `#${state.replace(/\s+/g, "")}News` : "#LocalNews");
  return tags.slice(0, 3).join(" ");
}

const SAVE_SHARE_CTAS = [
  "📌 Save this post so you don't miss it",
  "👥 Share this with a friend from",
  "💾 Save this article for later",
  "📲 Send this to someone interested from",
  "🔖 Bookmark this article",
  "👀 Anyone here from",
  "🔁 Share if you found this interesting",
];

function pickSaveShareCta(seed: number, city?: string): string {
  const t = SAVE_SHARE_CTAS[seed % SAVE_SHARE_CTAS.length];
  if (t.endsWith("din") && city) return `${t} ${city}`;
  return t;
}

const HOOK_TEMPLATES = [
  (title: string, emoji: string) => `${emoji} ${title}`,
  (title: string, emoji: string) => `${title} ${emoji}`,
  (title: string) => title,
  (title: string, emoji: string) => `${emoji}\n\n${title}`,
];

const STRUCTURE_VARIANTS: Array<"classic" | "question_first" | "cta_middle" | "minimal"> = [
  "classic",
  "question_first",
  "cta_middle",
  "minimal",
];

export function buildFbCaption(
  article: ArticleForFb,
  siteCtx?: { city?: string; state?: string }
): string {
  const emoji = categoryEmoji(article.category_slug);
  const title = article.title.trim();
  const excerptRaw = (article.excerpt || "").trim().replace(/\s+/g, " ");
  const excerpt = excerptRaw.length > 220 ? excerptRaw.slice(0, 217) + "..." : excerptRaw;
  const question = pickQuestion(article.category_slug, article.id);
  const tags = makeHashtags(article.site_slug, siteCtx?.city, siteCtx?.state);
  const saveShare = pickSaveShareCta(article.id + 3, siteCtx?.city);
  const seed = article.id;
  const hookFn = HOOK_TEMPLATES[seed % HOOK_TEMPLATES.length];
  const structure = STRUCTURE_VARIANTS[seed % STRUCTURE_VARIANTS.length];
  const hook = hookFn(title, emoji);

  const parts: string[] = [];
  switch (structure) {
    case "question_first":
      parts.push(`💬 ${question}`);
      parts.push(hook);
      if (excerpt) parts.push(excerpt);
      parts.push(saveShare);
      parts.push(tags);
      break;
    case "cta_middle":
      parts.push(hook);
      if (excerpt) parts.push(excerpt);
      parts.push(saveShare);
      parts.push(`💬 ${question}`);
      parts.push(tags);
      break;
    case "minimal":
      parts.push(hook);
      if (excerpt) parts.push(excerpt);
      parts.push(`💬 ${question}`);
      parts.push(tags);
      break;
    case "classic":
    default:
      parts.push(hook);
      if (excerpt) parts.push(excerpt);
      parts.push(`💬 ${question}`);
      parts.push(saveShare);
      parts.push(tags);
      break;
  }
  return parts.join("\n\n");
}

export async function postArticleToFacebookPage(opts: {
  pageId: string;
  accessToken: string;
  article: ArticleForFb;
  siteDomain: string;
  siteCity?: string;
  siteState?: string;
}): Promise<{
  post_id: string;
  comment_id: string | null;
  comment_error: string | null;
  link: string;
  caption_source: "ai" | "template";
}> {
  const { pageId, accessToken, article, siteDomain } = opts;
  const link = buildArticleUrl(siteDomain, article);

  // The headline. Nothing else.
  //
  // What was here before: an AI call to write a "social" caption, falling
  // back to a template of hooks, questions and share prompts. Both were bad.
  //
  // The AI call asked for gemini-2.0-flash, a model Google has retired — it
  // returned 404 every time, so the template ran on every post and nobody
  // noticed the generator was dead.
  //
  // The template produced engagement bait: "Have you seen similar cases?" on
  // a football score, and "Share this with a friend from" — cut off
  // mid-sentence, because the city it meant to name was missing. Meta names
  // that pattern in its policy and demotes it, and one of these Pages is now
  // temporarily blocked from posting. Whatever the cause there, inviting
  // shares on fifty automated pages is not a risk worth carrying for a
  // sentence nobody reads.
  //
  // A headline and a link is what a newspaper posts.
  let caption = article.title.trim();
  let captionSource: "ai" | "template" = "template";
  try {
    const { shortenHeadline } = await import("./fb-caption");
    const short = await shortenHeadline(caption);
    if (short) {
      caption = short;
      captionSource = "ai";
    }
  } catch {
    // Cosmetic only — the original headline is already a good post.
  }

  // Say the picture is not of the event. Every image here comes from a stock
  // library, picked by a search query; the first post out of this system put
  // the Parc des Princes above a match played at the Stade de France.
  const { PHOTO_DISCLAIMER } = await import("./fb-caption");

  if (!article.featured_image) {
    const r = await postToPage(pageId, accessToken, caption, link);
    return { post_id: r.id, comment_id: null, comment_error: "no_featured_image", link, caption_source: captionSource };
  }

  // Where the link goes.
  //
  // The first comment is better: Facebook cuts the reach of posts carrying an
  // external link, and a link in the comment avoids that. But commenting
  // needs pages_manage_engagement, and a page token only ever carries the
  // permissions granted when it was issued — a token cannot gain one later.
  // Every page currently connected was authorised without it, so the comment
  // fails and the post goes up with no link at all: a photo and a headline
  // and nothing to click. Eleven went out like that.
  //
  // So the link is attached before posting unless the caller is confident the
  // tokens can comment. Reconnecting the pages is what changes that, and
  // nothing here can do it on their behalf.
  const linkInComment = process.env.FB_LINK_IN_COMMENT === "1";
  const photoCaption = [caption, PHOTO_DISCLAIMER, linkInComment ? null : link]
    .filter(Boolean)
    .join("\n\n");

  const photo = await postPhotoToPage(pageId, accessToken, article.featured_image, photoCaption);
  let comment_id: string | null = null;
  let comment_error: string | null = linkInComment ? null : "link_in_caption";
  try {
    if (!linkInComment) throw new Error("skipped: link is in the caption");
    const c = await commentOnPost(photo.post_id, accessToken, `📰 Full article 👉 ${link}`);
    comment_id = c.id;
  } catch (e) {
    if (linkInComment) comment_error = e instanceof Error ? e.message : String(e);
  }
  return { post_id: photo.post_id, comment_id, comment_error, link, caption_source: captionSource };
}
