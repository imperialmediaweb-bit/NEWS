/**
 * Fetch the original article an entry was built from.
 *
 * Every article row keeps its source_url, which is what makes an honest repair
 * possible: with the original in hand a rewrite can quote real people and name
 * real institutions, because those quotes and names are in the text rather
 * than invented to fill a word count.
 *
 * Plenty of sources will be gone — expired, paywalled, moved. A failed fetch
 * has to stay a failure. Falling back to rewriting the fabricated version
 * would reproduce the original problem while reporting success.
 */

export interface SourceText {
  ok: boolean;
  text?: string;
  publisher?: string;
  finalUrl?: string;
  error?: string;
}

const MAX_CHARS = 12000;

export async function fetchSourceText(url: string): Promise<SourceText> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        // Sites serve a consent wall or a bot page to anything that looks
        // automated, which yields a page of boilerplate instead of an article.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html")) {
      return { ok: false, error: `Not HTML (${contentType})` };
    }

    const html = await res.text();
    const text = extractArticleText(html);

    // Too little text means a paywall, a consent interstitial or a redirect
    // page — not something to rewrite from.
    if (text.length < 400) {
      return { ok: false, error: `Only ${text.length} chars extracted (paywall or block page?)` };
    }

    return {
      ok: true,
      text: text.slice(0, MAX_CHARS),
      publisher: publisherFromUrl(res.url || url),
      finalUrl: res.url || url,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Pull the readable body out of a page. Deliberately crude: strip the things
 * that are definitely not prose, then take what is left. A parser that tried
 * to be clever about article containers would fail differently on every site.
 */
function extractArticleText(html: string): string {
  let s = html;

  // Anything inside these is never article text.
  for (const tag of ["script", "style", "noscript", "svg", "nav", "header", "footer", "aside", "form"]) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  s = s.replace(/<!--[\s\S]*?-->/g, " ");

  // Keep paragraph boundaries so sentences don't run together.
  s = s.replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");

  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Drop navigation debris: lines too short to be sentences.
  const lines = s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 60);

  return lines.join("\n\n").trim();
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
