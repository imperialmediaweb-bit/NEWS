import { postLinkToPage } from "./facebook";
import {
  getActiveFbSites,
  findNextArticleToPost,
  recordFbPost,
  setSiteFbPosted,
  FbSiteRow,
} from "./fb-queries";

export interface PostResult {
  site_id: number;
  site_name: string;
  status: "posted" | "skipped_rate_limit" | "no_articles" | "error" | "disabled";
  article_id?: number;
  fb_post_id?: string;
  error?: string;
}

// Facebook ban threshold ~ too many posts. We enforce >= 60 min between posts per page.
const MIN_MINUTES_BETWEEN_POSTS = 60;

function minutesSince(iso: string | null): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

function buildArticleUrl(site: FbSiteRow, slug: string): string {
  const base = site.domain.startsWith("http") ? site.domain : `https://${site.domain}`;
  return `${base.replace(/\/$/, "")}/${slug}`;
}

export async function postNextArticleForSite(site: FbSiteRow): Promise<PostResult> {
  if (!site.fb_posting_enabled || !site.fb_page_id || !site.fb_access_token) {
    return { site_id: site.id, site_name: site.name, status: "disabled" };
  }

  const sinceLast = minutesSince(site.fb_last_posted_at);
  if (sinceLast < MIN_MINUTES_BETWEEN_POSTS) {
    return { site_id: site.id, site_name: site.name, status: "skipped_rate_limit" };
  }

  const article = await findNextArticleToPost(site.id);
  if (!article) {
    return { site_id: site.id, site_name: site.name, status: "no_articles" };
  }

  const url = buildArticleUrl(site, article.slug);
  const message = article.summary
    ? `${article.title}\n\n${article.summary}`
    : article.title;

  try {
    const result = await postLinkToPage(site.fb_page_id, site.fb_access_token, url, message);
    await recordFbPost(site.id, article.id, result.id, "success", null);
    await setSiteFbPosted(site.id, new Date());
    return {
      site_id: site.id,
      site_name: site.name,
      status: "posted",
      article_id: article.id,
      fb_post_id: result.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await recordFbPost(site.id, article.id, null, "error", msg);
    return { site_id: site.id, site_name: site.name, status: "error", article_id: article.id, error: msg };
  }
}

export async function runAllSites(): Promise<PostResult[]> {
  const sites = await getActiveFbSites();
  const results: PostResult[] = [];
  // Serial to avoid hammering FB API; 100 sites still fits easily in a cron window.
  for (const site of sites) {
    // eslint-disable-next-line no-await-in-loop
    const r = await postNextArticleForSite(site);
    results.push(r);
  }
  return results;
}
