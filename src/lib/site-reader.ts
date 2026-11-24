import { lookup } from "dns/promises";
import { extractArticleText } from "@/lib/pipeline/source-fetch";

/** Read a business's own website as plain text (title, meta, phone links, structured data, body). Refuses private / internal addresses. */
function privateIp(ip: string) {
  return /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) || ip === "::1" || /^f[cd]|^fe80/i.test(ip) || ip.startsWith("::ffff:127.") || ip.startsWith("::ffff:10.") || ip.startsWith("::ffff:192.168.");
}
export async function readSite(raw: string): Promise<{ text: string; url: string } | null> {
  let url: URL;
  try { url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  if (!/^https?:$/.test(url.protocol) || !/\./.test(url.hostname)) return null;
  for (let hop = 0; hop < 3; hop++) {
    const addrs = await lookup(url.hostname, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
    const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (compatible; ExpressDirectory/1.0)" }, signal: AbortSignal.timeout(10000) }).catch(() => null);
    if (!r) return null;
    if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = new URL(r.headers.get("location")!, url); continue; }
    if (!r.ok || !/text\/html/.test(r.headers.get("content-type") || "")) return null;
    const html = (await r.text()).slice(0, 600000);
    const meta = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,400})/i) || [])[1] || "";
    const ld = (html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]{0,6000}?)<\/script>/gi) || []).join("\n").replace(/<[^>]+>/g, " ").slice(0, 6000);
    const tels = Array.from(new Set((html.match(/tel:[+\d().\s-]{7,20}/gi) || []).map((t) => t.slice(4)))).slice(0, 3).join(", ");
    const title = (html.match(/<title[^>]*>([^<]{0,200})/i) || [])[1] || "";
    const body = extractArticleText(html).slice(0, 6000) || html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 6000);
    return { url: url.toString(), text: `TITLE: ${title}\nMETA: ${meta}\nPHONE LINKS: ${tels}\nSTRUCTURED DATA: ${ld}\nPAGE TEXT: ${body}` };
  }
  return null;
}
