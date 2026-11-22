/**
 * Per-site designs, switched on one site at a time — the same mechanism as
 * the Romanian Expres network (`reteau-expres/src/lib/design-nou.ts`).
 *
 * A site gets its new design only when its slug is listed in the Railway
 * variable DESIGN_NOU (comma separated, e.g. "texas-express,florida-expres"),
 * so approving a design needs no deploy. Before that it is visible only with
 * `?design=nou` in the address; `?design=vechi` shows the old one even on an
 * approved site. The preview is a separate URL, so Cloudflare caches it apart
 * from the live page, and it carries noindex so Google never sees it.
 *
 * Only the look changes: the same addresses, articles and structured data.
 */
export type DesignFamily = "live" | "peach" | "tabloid" | "magazine" | "broadsheet" | "coastal" | "dark" | "western" | "gazette";

const DESIGNS: Record<string, DesignFamily> = {
  // 21.11.2026: pilot, built from the generated Texas mockup (live-news family).
  "texas-express": "live",
  // 21.11.2026: Georgia, from its generated mockup (peach family).
  "georgia-express": "peach",
  // 21.11.2026: Florida, from its generated mockup (tabloid family).
  "florida-express": "tabloid",
  // 21.11.2026: California, from its generated mockup (magazine family).
  "california-express": "magazine",
  // 21.11.2026: New York, from its generated mockup (broadsheet family).
  "new-york-express": "broadsheet",
  // 21.11.2026: Hawaii, from its generated mockup (coastal family).
  "hawaii-express": "coastal",
  // 21.11.2026: Arizona, from its generated mockup (dark premium family).
  "arizona-express": "dark",
  // 21.11.2026: Montana, from its generated mockup (western heritage family).
  "montana-express": "western",
  // 21.11.2026: Iowa, from its generated mockup (community gazette family).
  "iowa-express": "gazette",
  // 22.11.2026: the rest of the network, each in its mockup's family, colours and art.
  "alaska-express": "western",
  "alabama-express": "broadsheet",
  "colorado-express": "magazine",
  "illinois-express": "tabloid",
  "nevada-express": "tabloid",
  "new-jersey-express": "tabloid",
  "ohio-express": "tabloid",
  "oregon-express": "magazine",
  "utah-express": "magazine",
  "vermont-express": "magazine",
  "washington-express": "magazine",
  "connecticut-express": "broadsheet",
  "maryland-express": "broadsheet",
  "massachusetts-express": "broadsheet",
  "pennsylvania-express": "broadsheet",
  "virginia-express": "broadsheet",
  "delaware-express": "coastal",
  "maine-express": "coastal",
  "new-hampshire-express": "coastal",
  "rhode-island-express": "coastal",
  "south-carolina-express": "coastal",
  "idaho-express": "western",
  "oklahoma-express": "western",
  "wyoming-express": "western",
  "kentucky-express": "dark",
  "louisiana-express": "dark",
  "new-mexico-express": "dark",
  "tennessee-express": "dark",
  "arkansas-express": "gazette",
  "indiana-express": "gazette",
  "kansas-express": "gazette",
  "mississippi-express": "gazette",
  "nebraska-express": "gazette",
  "north-dakota-express": "gazette",
  "south-dakota-express": "gazette",
  "west-virginia-express": "gazette",
  "wisconsin-express": "gazette",
  "michigan-express": "live",
  "minnesota-express": "live",
  "missouri-express": "peach",
  "north-carolina-express": "peach",
};

export function designFor(slug: string): DesignFamily | null {
  return DESIGNS[slug] || null;
}

export function designState(
  slug: string,
  param: string | string[] | undefined
): { family: DesignFamily | null; preview: boolean } {
  const family = designFor(slug);
  if (!family) return { family: null, preview: false };
  const p = Array.isArray(param) ? param[0] : param;
  if (p === "vechi") return { family: null, preview: false };
  if (p === "nou") return { family, preview: true };
  const approved = (process.env.DESIGN_NOU || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return approved.includes(slug) ? { family, preview: false } : { family: null, preview: false };
}
