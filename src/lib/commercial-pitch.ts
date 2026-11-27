/**
 * Spots a "news tip" that is really a business promoting itself: a link to a
 * commercial website, or the sender saying they run / work for the company.
 * Government, school and news links don't count (they are sources).
 */
const SOURCE_HOST = /(\.gov|\.edu|\.mil|\.us|wikipedia\.org|apnews\.com|reuters\.com|nytimes\.com|washingtonpost\.com|npr\.org|bbc\.|cnn\.com|youtube\.com|youtu\.be|facebook\.com|x\.com|twitter\.com|instagram\.com)$/i;
const SELF = /\b(i run|i own|i founded|i'?m with|i work (?:for|at)|our (?:company|firm|agency|platform|directory|service|startup|product|app|team)|my (?:company|firm|agency|business|startup|platform))\b/i;

export function commercialLinks(text: string, ownDomains: string[] = []): string[] {
  const out: string[] = [];
  for (const m of text.match(/https?:\/\/[^\s<>"')]+/gi) || []) {
    let host = "";
    try { host = new URL(m).hostname.replace(/^www\./, "").toLowerCase(); } catch { continue; }
    if (SOURCE_HOST.test(host) || ownDomains.some((d) => host.endsWith(d))) continue;
    out.push(host);
  }
  return Array.from(new Set(out));
}

/** A link to a business website AND the sender is that business: says so, or writes from that domain. */
export function looksCommercial(text: string, ownDomains: string[] = [], senderEmail = ""): boolean {
  const hosts = commercialLinks(text, ownDomains);
  if (!hosts.length) return false;
  const senderHost = senderEmail.split("@")[1]?.toLowerCase() || "";
  return SELF.test(text) || (!!senderHost && hosts.some((h) => h === senderHost || h.endsWith("." + senderHost)));
}
