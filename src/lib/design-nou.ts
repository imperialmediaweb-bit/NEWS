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
export type DesignFamily = "live" | "peach";

const DESIGNS: Record<string, DesignFamily> = {
  // 21.11.2026: pilot, built from the generated Texas mockup (live-news family).
  "texas-express": "live",
  // 21.11.2026: Georgia, from its generated mockup (peach family).
  "georgia-express": "peach",
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
