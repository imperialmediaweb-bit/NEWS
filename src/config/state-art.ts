/**
 * Artwork taken from each state's generated mockup and redrawn at high
 * resolution with the same image model (gpt-image), so every page carries
 * its mockup's own pictures: the masthead illustration, the landscape above
 * the footer, decorative photos. A state without art keeps the drawn
 * fallbacks.
 */
export interface StateArt { masthead?: string; landscape?: string; sky?: string; county?: string }

export const STATE_ART: Record<string, StateArt> = {
  "montana-express": { masthead: "/design/montana/ridge.webp", landscape: "/design/montana/landscape.webp" },
  "arizona-express": { sky: "/design/arizona/dusk.webp" },
  "iowa-express": { county: "/design/iowa/farm.webp" },
};

export const artOf = (slug: string): StateArt => STATE_ART[slug] || {};
