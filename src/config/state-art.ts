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
  "alaska-express": { masthead: "/design/alaska/ridge.webp", landscape: "/design/alaska/landscape.webp" },
  "arizona-express": { sky: "/design/arizona/dusk.webp" },
  "iowa-express": { county: "/design/iowa/farm.webp" },
  "idaho-express": { masthead: "/design/idaho/ridge.webp", landscape: "/design/idaho/landscape.webp" },
  "oklahoma-express": { masthead: "/design/oklahoma/ridge.webp", landscape: "/design/oklahoma/landscape.webp" },
  "wyoming-express": { masthead: "/design/wyoming/ridge.webp", landscape: "/design/wyoming/landscape.webp" },
  "kentucky-express": { sky: "/design/kentucky/dusk.webp" },
  "louisiana-express": { sky: "/design/louisiana/dusk.webp" },
  "new-mexico-express": { sky: "/design/new-mexico/dusk.webp" },
  "tennessee-express": { sky: "/design/tennessee/dusk.webp" },
  "arkansas-express": { county: "/design/arkansas/county.webp" },
  "indiana-express": { county: "/design/indiana/county.webp" },
  "kansas-express": { county: "/design/kansas/county.webp" },
  "mississippi-express": { county: "/design/mississippi/county.webp" },
  "nebraska-express": { county: "/design/nebraska/county.webp" },
  "north-dakota-express": { county: "/design/north-dakota/county.webp" },
  "south-dakota-express": { county: "/design/south-dakota/county.webp" },
  "west-virginia-express": { county: "/design/west-virginia/county.webp" },
  "wisconsin-express": { county: "/design/wisconsin/county.webp" },
};

export const artOf = (slug: string): StateArt => STATE_ART[slug] || {};
