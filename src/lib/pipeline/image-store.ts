import { createHash } from "crypto";
import sharp from "sharp";
import { r2Ready, r2Put, r2Exists, r2Url } from "@/lib/r2";

/**
 * Copy a free-licence photo (Pexels, Pixabay) into our R2 bucket as WebP in
 * five widths, so pages load it from our own CDN in the size each screen
 * needs. Unsplash is left alone: its API guidelines require hotlinking.
 * Photos from any other site are never copied.
 *
 * Keys: p/<words from the headline>-<sha1 of the source>-<width>.webp, so
 * the file name itself describes the picture for image search. The stored
 * URL is the 1200-wide file; srcSetOf() derives the other widths from it.
 */
export const R2_WIDTHS = [400, 600, 900, 1200, 1600];

export function canStore(url: string | null | undefined): boolean {
  return !!url && /images\.pexels\.com|pixabay\.com\/get\/|cdn\.pixabay\.com|upload\.wikimedia\.org|staticflickr\.com/.test(url);
}

/** The original, as large as the library offers, for the best WebP. */
function originalOf(url: string): string {
  if (/images\.pexels\.com/.test(url)) return url.split("?")[0] + "?auto=compress&cs=tinysrgb&w=1600";
  return url.replace(/_(640|960)(\.\w+)$/, "_1280$2");
}

export async function storeImage(url: string, name = ""): Promise<string | null> {
  if (!r2Ready() || !canStore(url)) return null;
  const hash = createHash("sha1").update(url.split("?")[0]).digest("hex").slice(0, 12);
  const words = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 8).join("-");
  const id = words ? `${words}-${hash}` : hash;
  const mainKey = `p/${id}-1200.webp`;
  if (await r2Exists(mainKey).catch(() => false)) return r2Url(mainKey);
  const res = await fetch(originalOf(url), { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 StateExpressNetwork" } });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const srcW = meta.width || 1600;
  // Smaller widths first; the 1200 file (the stored URL) is written last, so
  // its presence means all widths exist.
  for (const w of R2_WIDTHS.filter((x) => x !== 1200).concat(1200)) {
    const out = await sharp(buf)
      .rotate()
      .resize({ width: Math.min(w, srcW), withoutEnlargement: true })
      .webp({ quality: w <= 600 ? 70 : 74, effort: 4, smartSubsample: true })
      .toBuffer();
    await r2Put(`p/${id}-${w}.webp`, out, "image/webp");
  }
  return r2Url(mainKey);
}
