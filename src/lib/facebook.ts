// Facebook Graph API client
// Docs: https://developers.facebook.com/docs/graph-api

const GRAPH = "https://graph.facebook.com/v21.0";

export interface FbPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

export interface FbPostResult {
  id: string; // format: "{page_id}_{post_id}"
}

export function getOAuthUrl(appId: string, redirectUri: string, state: string): string {
  const scope = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "public_profile",
  ].join(",");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope,
    response_type: "code",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`FB exchange failed: ${await res.text()}`);
  return res.json();
}

export async function exchangeForLongLivedUserToken(
  shortToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  if (!res.ok) throw new Error(`FB long-lived exchange failed: ${await res.text()}`);
  return res.json();
}

export async function listUserPages(userAccessToken: string): Promise<FbPage[]> {
  const pages: FbPage[] = [];
  let url: string | null = `${GRAPH}/me/accounts?access_token=${encodeURIComponent(userAccessToken)}&limit=100&fields=id,name,access_token,category,tasks`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FB listUserPages failed: ${await res.text()}`);
    const data = (await res.json()) as { data: FbPage[]; paging?: { next?: string } };
    pages.push(...data.data);
    url = data.paging?.next ?? null;
  }
  return pages;
}

export async function postLinkToPage(
  pageId: string,
  pageAccessToken: string,
  link: string,
  message: string
): Promise<FbPostResult> {
  // Modern approach: use /feed with link attachment. FB will scrape OG tags for preview.
  const body = new URLSearchParams({
    message,
    link,
    access_token: pageAccessToken,
  });
  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = json?.error?.message || JSON.stringify(json);
    throw new Error(`FB post failed: ${err}`);
  }
  return json as FbPostResult;
}

export async function debugToken(
  token: string,
  appToken: string
): Promise<{ expires_at: number; is_valid: boolean; scopes: string[] }> {
  const params = new URLSearchParams({
    input_token: token,
    access_token: appToken,
  });
  const res = await fetch(`${GRAPH}/debug_token?${params}`);
  if (!res.ok) throw new Error(`FB debugToken failed: ${await res.text()}`);
  const { data } = await res.json();
  return data;
}
