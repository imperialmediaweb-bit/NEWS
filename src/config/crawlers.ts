/**
 * Crawlers this network turns away, named once so robots.txt and the
 * middleware cannot disagree.
 *
 * They disagreed. robots.txt said `User-agent: * / Allow: /` — permission to
 * crawl everything — while the middleware answered 403 to seventeen named
 * agents. A crawler that reads robots.txt, is granted access, and is then
 * refused does not conclude it is unwelcome; it concludes the site is broken,
 * and an unstable site is a worse signal than a disallowed one. Google's own
 * guidance is explicit about not serving 403 to agents robots.txt allows.
 *
 * So the refusal is declared. A well-behaved crawler reads it and stops
 * asking, which costs us nothing to serve; the 403 stays for the ones that
 * ignore it.
 *
 * Only crawlers that read robots.txt belong here. sqlmap and nikto do not
 * read it, and listing them would publish our blocklist to no benefit — those
 * stay in the middleware alone.
 */

/** Commercial SEO crawlers: they mine the archive and send no readers. */
export const BLOCKED_SEO_CRAWLERS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "PetalBot",
];

/**
 * AI crawlers that collect training data.
 *
 * Note which ones are NOT here: OAI-SearchBot, ChatGPT-User and
 * PerplexityBot fetch pages to answer a question someone is asking right now,
 * and they cite the source. That sends readers. Blocking the training
 * crawlers while leaving the answering ones alone is deliberate.
 */
export const BLOCKED_AI_CRAWLERS = [
  "GPTBot",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Bytespider",
  "Omgilibot",
  "cohere-ai",
];

/**
 * Search engines we decline.
 *
 * Worth knowing: IndexNow is a single submission shared by Bing, Yandex,
 * Seznam and Naver, so every article published here is announced to Yandex
 * and Seznam whether or not their crawlers are welcome. Announcing a URL to a
 * crawler you then refuse achieves nothing — not harm, just nothing. These
 * two stay blocked because this is a US local-news network and neither sends
 * American readers; drop a name from this list if that changes, and both
 * robots.txt and the middleware follow.
 */
export const BLOCKED_SEARCH_CRAWLERS = ["YandexBot", "SeznamBot"];

export const DECLARED_BLOCKED_CRAWLERS = [
  ...BLOCKED_SEO_CRAWLERS,
  ...BLOCKED_AI_CRAWLERS,
  ...BLOCKED_SEARCH_CRAWLERS,
];
