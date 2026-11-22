import mockups from "./mockup-design.json";

/**
 * What each state's generated mockup set (21.11.2026): its style family, main
 * and accent colours, the metal of its details, its slogan and the city in its
 * weather bar. The designs read their colours and words from here, so a new
 * state looks like its own mockup without any per-state code.
 */
export interface MockupDesign { family: string; ink: string; acc: string; detail: string; slogan: string; capital: string; module?: string }

const METAL: Record<string, string> = { gold: "#c9a227", silver: "#9aa5b1", copper: "#b87333" };

export function mockupOf(slug: string): (MockupDesign & { metal: string }) | null {
  const m = (mockups as Record<string, MockupDesign>)[slug];
  return m ? { ...m, metal: METAL[m.detail] || "#c9a227" } : null;
}

/** A tint of a colour toward white (0..1), for papers and panels. */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}
/** A shade of a colour toward black (0..1). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}
