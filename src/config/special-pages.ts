/** Pages only some states have: path → state abbreviations. */
export const SPECIAL_PAGES: Record<string, string[]> = {
  "hurricane-tracker": [
    "FL",
    "LA",
    "TX",
    "NC",
    "SC",
    "GA",
    "AL",
    "MS",
    "HI"
  ],
  "earthquakes": [
    "CA",
    "AK",
    "NV",
    "WA",
    "OR",
    "UT",
    "HI",
    "ID",
    "MT",
    "WY",
    "OK",
    "TX",
    "NM",
    "AZ"
  ],
  "wildfires": [
    "CA",
    "OR",
    "WA",
    "AZ",
    "CO",
    "ID",
    "MT",
    "NM",
    "NV",
    "UT",
    "WY",
    "TX",
    "OK",
    "AK"
  ],
  "surf-report": [
    "HI"
  ],
  "subway-status": [
    "NY"
  ],
  "tornado-reports": [
    "OK",
    "KS",
    "NE",
    "TX",
    "IA",
    "MO",
    "AR",
    "AL",
    "MS",
    "TN",
    "KY",
    "IL",
    "IN",
    "MN",
    "SD",
    "ND",
    "LA",
    "GA"
  ],
  "high-school-football": [
    "TX",
    "GA",
    "FL",
    "OH",
    "PA",
    "AL",
    "LA",
    "CA",
    "MS",
    "OK"
  ],
  "kentucky-derby": [
    "KY"
  ],
  "nashville-concerts": [
    "TN"
  ],
  "fall-foliage": [
    "VT",
    "ME",
    "NH",
    "NY",
    "MA",
    "CT"
  ],
  "ice-fishing": [
    "MN",
    "WI",
    "MI",
    "ND",
    "ME",
    "VT",
    "NH",
    "NY"
  ],
  "crop-report": [
    "IA",
    "NE",
    "KS",
    "IL",
    "IN",
    "MN",
    "ND",
    "SD",
    "MO",
    "OH"
  ],
  "national-park-roads": [
    "MT",
    "WY",
    "UT",
    "AZ",
    "CO",
    "CA",
    "WA"
  ],
  "heat-index": [
    "AZ",
    "NV",
    "TX",
    "CA",
    "NM",
    "FL"
  ],
  "snow-report": [
    "AK",
    "AZ",
    "CA",
    "CO",
    "ID",
    "MT",
    "NV",
    "NM",
    "OR",
    "UT",
    "WA",
    "WY",
    "SD"
  ],
  "aurora-forecast": [
    "AK",
    "ND",
    "MN",
    "ME",
    "MT",
    "WA",
    "ID",
    "WI",
    "MI",
    "VT",
    "NH",
    "SD",
    "NY",
    "OR",
    "WY",
    "IA",
    "MA"
  ],
  "las-vegas-shows": [
    "NV"
  ],
  "mardi-gras": [
    "LA"
  ]
};

export function specialPagesFor(abbr: string): string[] {
  return Object.entries(SPECIAL_PAGES).filter(([, s]) => s.includes(abbr)).map(([p]) => `/${p}`);
}
