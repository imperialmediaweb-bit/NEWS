/**
 * Real photos under free licences, found through Openverse (it indexes
 * Wikimedia Commons, Flickr Creative Commons, museums and government
 * collections). Only licences that allow commercial use are asked for, and
 * every result carries its credit line, which the article prints under the
 * story as the licence requires.
 *
 * Never Google/Bing/DuckDuckGo image search, and never another outlet's
 * photos: those are copyrighted.
 */

export interface FreeImage {
  url: string;
  alt: string;
  credit: string;
}

const LICENSE_NAMES: Record<string, string> = {
  by: "CC BY",
  "by-sa": "CC BY-SA",
  cc0: "CC0",
  pdm: "Public domain",
};

const SOURCE_NAMES: Record<string, string> = {
  wikimedia: "Wikimedia Commons",
  flickr: "Flickr",
  nasa: "NASA",
  nypl: "NYPL",
  smithsonian: "Smithsonian",
};

type OvResult = {
  url: string;
  tags?: Array<{ name?: string }>;
  title?: string;
  creator?: string;
  license: string;
  license_version?: string;
  source?: string;
  width?: number;
  height?: number;
  mature?: boolean;
};

let pausedUntil = 0;

/**
 * Best landscape photo of at least 1000px for a query, or null.
 * `sources` narrows the search (e.g. "wikimedia" for places).
 */
/**
 * Photos that must never illustrate a news story: historical archive pictures
 * (a 1910s child-labour photo once ended up on a 2026 football story), photos
 * of identifiable people (they would look like the people in the story),
 * documents, maps, logos and scans.
 */
const BAD_PHOTO = /\b(1[0-8]\d\d|19[0-7]\d)s?\b|child labou?r|lewis hine|vintage|antique|histor(ic|ical|y)|archive|postcard|engraving|lithograph|daguerreotype|tintype|sepia|black and white|b&w|portrait|headshot|selfie|\b(boys?|girls?|child(ren)?|kids?|baby|man|woman|men|women|people|person|family|couple|wedding|funeral|grave|cemetery|nude|crowd)\b|\bmap\b|diagram|chart|logo|flag of|coat of arms|seal of|document|letter|newspaper|scan|screenshot|poster|drawing|painting|illustration/i;
const BAD_CREATOR = /library of congress|national archives|lewis (wickes )?hine|smithsonian|internet archive|nypl|new york public library|gage skidmore|the white house/i;
const okPhoto = (r: OvResult) => !BAD_PHOTO.test(`${r.title || ""} ${(r.tags || []).map((t) => t.name || "").join(" ")}`) && !BAD_CREATOR.test(r.creator || "");

export async function searchOpenverse(query: string, sources?: string): Promise<FreeImage | null> {
  if (!query.trim() || Date.now() < pausedUntil) return null;
  const params = new URLSearchParams({
    q: query,
    // no "pdm": public-domain-mark photos are mostly old archive pictures
    license: "by,by-sa,cc0",
    // "size" and "aspect_ratio" make the API time out (504); filtered here instead
    mature: "false",
    page_size: "20",
  });
  if (sources) params.set("source", sources);
  try {
    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { "User-Agent": "StateExpressNetwork/1.0 (local news; images with attribution)" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 429) {
      pausedUntil = Date.now() + 15 * 60 * 1000;
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: OvResult[] };
    const pick = (data.results || []).find(
      (r) => !r.mature && okPhoto(r) && (r.width || 0) >= 1000 && (r.width || 0) >= (r.height || 0) * 1.25 && LICENSE_NAMES[r.license] && /^https:\/\//.test(r.url)
    );
    if (!pick) return null;
    const lic = `${LICENSE_NAMES[pick.license]}${pick.license_version && pick.license !== "pdm" && pick.license !== "cc0" ? ` ${pick.license_version}` : ""}`;
    const who = (pick.creator || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const where = SOURCE_NAMES[pick.source || ""] || pick.source || "Openverse";
    return {
      url: pick.url,
      alt: (pick.title || query).slice(0, 140),
      credit: `Photo: ${who ? `${who} / ` : ""}${where}, ${lic}`,
    };
  } catch {
    return null;
  }
}

/** Subjects where a real news photo beats a stock picture. */
export const REAL_PHOTO_SUBJECT =
  /\b(tornado|hurricane|tropical storm|flood|flooding|wildfire|fire danger|earthquake|volcano|eruption|blizzard|snowstorm|ice storm|drought|launch|rocket|capitol|courthouse|stadium|bridge|dam)\b/i;
