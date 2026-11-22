import counties from "@/config/counties/us-counties.json";
import outlines from "@/config/state-outlines.json";
import { STATE_FACTS } from "@/config/state-data";

/**
 * Real local data for the per-state designs. Every source is official and
 * free; nothing here is invented. When a source does not answer in time the
 * module that uses it is left out rather than filled with placeholders.
 */

const UA = "StateExpressNetwork/1.0 (news site; https://texasexpres.com)";
const TTL = 30 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  try {
    const value = await load();
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    // A stale value is better than none when the source is briefly down.
    return hit ? (hit.value as T) : null;
  }
}

async function getJson(url: string, ms = 5000) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/geo+json, application/json" },
    signal: AbortSignal.timeout(ms),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

// ── cities shown in the weather strip, per state ──
export const WEATHER_CITIES: Record<string, Array<[string, number, number]>> = {
  Texas: [
    ["Austin", 30.2672, -97.7431],
    ["Houston", 29.7604, -95.3698],
    ["Dallas", 32.7767, -96.797],
    ["San Antonio", 29.4241, -98.4936],
    ["El Paso", 31.7619, -106.485],
    ["Lubbock", 33.5779, -101.8552],
    ["Corpus Christi", 27.8006, -97.3964],
    ["Brownsville", 25.9017, -97.4975],
  ],
  Florida: [
    ["Miami", 25.7617, -80.1918],
    ["Orlando", 28.5383, -81.3792],
    ["Tampa", 27.9506, -82.4572],
    ["Jacksonville", 30.3322, -81.6557],
    ["Tallahassee", 30.4383, -84.2807],
    ["Pensacola", 30.4213, -87.2169],
    ["Fort Myers", 26.6406, -81.8723],
    ["Key West", 24.5551, -81.78],
  ],
  Iowa: [
    ["Des Moines", 41.5868, -93.625],
    ["Cedar Rapids", 41.9779, -91.6656],
    ["Davenport", 41.5236, -90.5776],
    ["Sioux City", 42.4999, -96.4003],
    ["Waterloo", 42.4928, -92.3426],
    ["Ames", 42.0308, -93.6319],
    ["Iowa City", 41.6611, -91.5302],
    ["Council Bluffs", 41.2619, -95.8608],
  ],
  Montana: [
    ["Billings", 45.7833, -108.5007],
    ["Missoula", 46.8721, -113.994],
    ["Bozeman", 45.677, -111.0429],
    ["Great Falls", 47.5053, -111.3008],
    ["Helena", 46.5891, -112.0391],
    ["Kalispell", 48.1958, -114.3129],
    ["Butte", 46.0038, -112.5348],
    ["West Yellowstone", 44.662, -111.1041],
  ],
  Arizona: [
    ["Phoenix", 33.4484, -112.074],
    ["Tucson", 32.2226, -110.9747],
    ["Flagstaff", 35.1983, -111.6513],
    ["Prescott", 34.54, -112.4685],
    ["Yuma", 32.6927, -114.6277],
    ["Lake Havasu City", 34.4839, -114.3225],
    ["Sedona", 34.8697, -111.761],
    ["Page", 36.9147, -111.4558],
  ],
  Hawaii: [
    ["Honolulu", 21.3069, -157.8583],
    ["Hilo", 19.7241, -155.0868],
    ["Kahului", 20.8893, -156.4729],
    ["Lihue", 21.9811, -159.3711],
    ["Kailua-Kona", 19.6399, -155.9969],
    ["Lahaina", 20.8783, -156.6825],
    ["Kaneohe", 21.4181, -157.8036],
    ["Volcano", 19.4296, -155.2343],
  ],
  "New York": [
    ["New York City", 40.7128, -74.006],
    ["Buffalo", 42.8864, -78.8784],
    ["Rochester", 43.1566, -77.6088],
    ["Syracuse", 43.0481, -76.1474],
    ["Albany", 42.6526, -73.7562],
    ["Binghamton", 42.0987, -75.918],
    ["Long Island", 40.7891, -73.135],
    ["Plattsburgh", 44.6995, -73.4529],
  ],
  California: [
    ["Los Angeles", 34.0522, -118.2437],
    ["San Francisco", 37.7749, -122.4194],
    ["San Diego", 32.7157, -117.1611],
    ["Sacramento", 38.5816, -121.4944],
    ["Fresno", 36.7378, -119.7871],
    ["San Jose", 37.3382, -121.8863],
    ["Redding", 40.5865, -122.3917],
    ["Palm Springs", 33.8303, -116.5453],
  ],
  Georgia: [
    ["Atlanta", 33.749, -84.388],
    ["Augusta", 33.4735, -82.0105],
    ["Savannah", 32.0809, -81.0912],
    ["Macon", 32.8407, -83.6324],
    ["Columbus", 32.461, -84.9877],
    ["Athens", 33.9519, -83.3576],
    ["Valdosta", 30.8327, -83.2785],
    ["Brunswick", 31.1499, -81.4915],
  ],
};

export interface CityWeather {
  city: string;
  temp: number;
  unit: string;
  short: string;
  high: number | null;
  low: number | null;
  isDay: boolean;
  /** The next period: tonight when it is day, tomorrow when it is night. */
  nextName?: string;
  nextShort?: string;
  nextTemp?: number;
  nextIsDay?: boolean;
}

/** National Weather Service forecast for one point. */
async function nwsCity(city: string, lat: number, lon: number): Promise<CityWeather> {
  const pt = await getJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
  const fc = await getJson(pt.properties.forecast);
  const periods = fc.properties.periods as Array<{ name: string; temperature: number; temperatureUnit: string; shortForecast: string; isDaytime: boolean }>;
  const now = periods[0];
  const next = periods[1];
  const hi = now.isDaytime ? now.temperature : next?.temperature ?? null;
  const lo = now.isDaytime ? next?.temperature ?? null : now.temperature;
  return {
    city, temp: now.temperature, unit: now.temperatureUnit, short: now.shortForecast, high: hi, low: lo, isDay: now.isDaytime,
    nextName: next?.name, nextShort: next?.shortForecast, nextTemp: next?.temperature, nextIsDay: next?.isDaytime,
  };
}

export async function getStateWeather(state: string): Promise<CityWeather[]> {
  const list = citiesOf(state);
  const res = await Promise.all(list.map(([c, la, lo]) => cached(`nws:${c}`, () => nwsCity(c, la, lo))));
  return res.filter((x): x is CityWeather => !!x);
}

// ── National Hurricane Center ──
export interface Storm {
  name: string;
  classification: string;
  intensity: string;
  movement: string;
}

export async function getActiveStorms(): Promise<{ storms: Storm[] } | null> {
  return cached("nhc", async () => {
    const j = await getJson("https://www.nhc.noaa.gov/CurrentStorms.json");
    const storms = ((j.activeStorms || []) as Array<Record<string, string>>)
      // Atlantic and eastern Pacific basins only reach the Gulf states.
      .filter((s) => /^(al|ep)/i.test(String(s.id || "")))
      .map((s) => ({
        name: s.name,
        classification: ({ HU: "Hurricane", TS: "Tropical Storm", TD: "Tropical Depression", PTC: "Potential Tropical Cyclone", STS: "Subtropical Storm" } as Record<string, string>)[s.classification] || s.classification,
        intensity: s.intensity ? `${s.intensity} kt` : "",
        movement: s.movementDir && s.movementSpeed ? `${s.movementDir}° at ${s.movementSpeed} mph` : "",
      }));
    return { storms };
  });
}

export function countiesOf(state: string): string[] {
  return (counties as Record<string, string[]>)[state] || [];
}

// ── multi-day forecast for the state's first city (article sidebar) ──
export interface DayForecast {
  name: string;
  short: string;
  high: number | null;
  low: number | null;
}

export async function getCityForecast(state: string): Promise<{ city: string; now: CityWeather; days: DayForecast[] } | null> {
  const first = citiesOf(state)[0];
  if (!first) return null;
  const [city, lat, lon] = first;
  return cached(`nwsfc:${city}`, async () => {
    const pt = await getJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
    const fc = await getJson(pt.properties.forecast);
    const periods = fc.properties.periods as Array<{ name: string; temperature: number; temperatureUnit: string; shortForecast: string; isDaytime: boolean }>;
    const p0 = periods[0];
    const now: CityWeather = {
      city,
      temp: p0.temperature,
      unit: p0.temperatureUnit,
      short: p0.shortForecast,
      high: p0.isDaytime ? p0.temperature : periods[1]?.temperature ?? null,
      low: p0.isDaytime ? periods[1]?.temperature ?? null : p0.temperature,
      isDay: p0.isDaytime,
    };
    // The next days: each daytime period with the night that follows it.
    const days: DayForecast[] = [];
    for (let i = 1; i < periods.length && days.length < 4; i++) {
      const p = periods[i];
      if (!p.isDaytime) continue;
      const night = periods[i + 1];
      days.push({ name: p.name.slice(0, 3), short: p.shortForecast, high: p.temperature, low: night && !night.isDaytime ? night.temperature : null });
    }
    return { city, now, days };
  });
}

// ── active National Weather Service alerts for a state ──
export interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
  area: string;
  url: string;
}

const SEVERITY = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];

export async function getStateAlerts(abbr: string): Promise<WeatherAlert[] | null> {
  return cached(`nwsalerts:${abbr}`, async () => {
    const j = await getJson(`https://api.weather.gov/alerts/active?area=${abbr}`);
    const list = ((j.features || []) as Array<{ properties: Record<string, string> }>).map((f) => ({
      event: f.properties.event,
      headline: f.properties.headline || f.properties.event,
      severity: f.properties.severity || "Unknown",
      area: (f.properties.areaDesc || "").split(";").slice(0, 3).join(", "),
      url: `https://alerts.weather.gov/search?area=${abbr}`,
    }));
    // One line per kind of alert, the most severe first.
    const seen = new Set<string>();
    return list
      .sort((a, b) => SEVERITY.indexOf(a.severity) - SEVERITY.indexOf(b.severity))
      .filter((a) => (seen.has(a.event) ? false : (seen.add(a.event), true)))
      .slice(0, 4);
  });
}

// ── weekly retail gasoline prices, U.S. Energy Information Administration ──
// EIA publishes nine states on their own; the rest are shown as their region,
// and labelled as such.
const EIA_STATE: Record<string, string> = { Texas: "stx", California: "sca", Colorado: "sco", Florida: "sfl", Massachusetts: "sma", Minnesota: "smn", "New York": "sny", Ohio: "soh", Washington: "swa" };
const EIA_REGION: Array<[string, string, string[]]> = [
  ["r1x", "New England", ["Connecticut", "Maine", "New Hampshire", "Rhode Island", "Vermont"]],
  ["r1y", "Central Atlantic", ["Delaware", "Maryland", "New Jersey", "Pennsylvania"]],
  ["r1z", "Lower Atlantic", ["Georgia", "North Carolina", "South Carolina", "Virginia", "West Virginia"]],
  ["r20", "Midwest", ["Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Michigan", "Missouri", "Nebraska", "North Dakota", "Oklahoma", "South Dakota", "Tennessee", "Wisconsin"]],
  ["r30", "Gulf Coast", ["Alabama", "Arkansas", "Louisiana", "Mississippi", "New Mexico"]],
  ["r40", "Rocky Mountain", ["Idaho", "Montana", "Utah", "Wyoming"]],
  ["r50", "West Coast", ["Alaska", "Arizona", "Hawaii", "Nevada", "Oregon"]],
];

export interface GasPrices {
  area: string;
  isRegion: boolean;
  week: string;
  grades: Array<{ grade: string; price: number; change: number }>;
}

export async function getGasPrices(state: string): Promise<GasPrices | null> {
  let code = EIA_STATE[state];
  let area = state;
  let isRegion = false;
  if (!code) {
    const r = EIA_REGION.find(([, , list]) => list.includes(state));
    if (!r) return null;
    [code, area] = [r[0], `${r[1]} region`];
    isRegion = true;
  }
  return cached(`eia:${code}`, async () => {
    const res = await fetch(`https://www.eia.gov/dnav/pet/pet_pri_gnd_dcus_${code}_w.htm`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) throw new Error(`eia ${res.status}`);
    const h = await res.text();
    const grades: GasPrices["grades"] = [];
    for (const row of h.split(/<tr class="DataRow">/).slice(1)) {
      const name = (row.match(/class="DataStub1">([\s\S]*?)<\/td>/)?.[1] || "").replace(/<[^>]+>/g, "").trim();
      if (!["Regular", "Midgrade", "Premium"].includes(name)) continue;
      const vals = Array.from(row.matchAll(/class="(?:Current2|DataB)"[^>]*>([\d.]+)</g)).map((m) => parseFloat(m[1]));
      if (vals.length < 2) continue;
      const [prev, cur] = vals.slice(-2);
      grades.push({ grade: name, price: cur, change: Math.round((cur - prev) * 1000) / 1000 });
    }
    const weeks = Array.from(h.matchAll(/class="Series5"[^>]*>([^<]+)</g)).map((m) => m[1].trim());
    if (grades.length === 0) throw new Error("eia: no rows");
    return { area, isRegion, week: weeks[weeks.length - 1] || "", grades };
  });
}

// ── lottery: latest Powerball and Mega Millions draws (New York State open data) ──
export interface LotteryDraw {
  game: string;
  date: string;
  numbers: string[];
  bonus: string;
}

export async function getLottery(): Promise<LotteryDraw[] | null> {
  return cached("lottery", async () => {
    const [pb, mm] = await Promise.all([
      getJson("https://data.ny.gov/resource/d6yy-54nr.json?$limit=1&$order=draw_date%20DESC"),
      getJson("https://data.ny.gov/resource/5xaw-6ayf.json?$limit=1&$order=draw_date%20DESC"),
    ]);
    const out: LotteryDraw[] = [];
    if (pb?.[0]) {
      const n = String(pb[0].winning_numbers).trim().split(/\s+/);
      out.push({ game: "Powerball", date: pb[0].draw_date, numbers: n.slice(0, 5), bonus: n[5] || "" });
    }
    if (mm?.[0]) out.push({ game: "Mega Millions", date: mm[0].draw_date, numbers: String(mm[0].winning_numbers).trim().split(/\s+/), bonus: mm[0].mega_ball || "" });
    return out;
  });
}

// ── FAA: delays and ground stops at an airport (National Airspace System status) ──
export interface AirportStatus {
  code: string;
  name: string;
  /** Empty when the FAA lists nothing for the airport: flights on schedule. */
  delays: Array<{ kind: string; reason: string; detail: string }>;
  updated: string;
}

/** FAA reasons are codes ("TM Initiatives:MIT:WX", "ZDV / WX:Wind"); say them in words. */
function faaReason(r: string) {
  const wx = r.match(/WX:?\s*([A-Za-z ]+)?/i);
  if (wx) return wx[1] ? `weather (${wx[1].trim().toLowerCase()})` : "weather";
  if (/VOL/i.test(r)) return "heavy traffic";
  if (/RWY|runway/i.test(r)) return r.toLowerCase().includes("construction") ? "runway construction" : "runway work";
  if (/EQ|equipment/i.test(r)) return "equipment";
  return r.replace(/[_:]/g, " ").toLowerCase();
}

export async function getAirportStatus(airports: Array<[string, string]>): Promise<AirportStatus[] | null> {
  const xml = await cached("faa-nas", async () => {
    const r = await fetch("https://nasstatus.faa.gov/api/airport-status-information", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!r.ok) throw new Error(`faa ${r.status}`);
    return r.text();
  });
  if (!xml) return null;
  const tag = (s: string, t: string) => (s.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) || [])[1]?.trim() || "";
  const updated = tag(xml, "Update_Time");
  return airports.map(([code, name]) => {
    const delays: AirportStatus["delays"] = [];
    for (const m of Array.from(xml.matchAll(/<Ground_Delay>([\s\S]*?)<\/Ground_Delay>/g))) {
      if (tag(m[1], "ARPT") === code) delays.push({ kind: "Ground delay", reason: tag(m[1], "Reason"), detail: `average ${tag(m[1], "Avg")}, up to ${tag(m[1], "Max")}` });
    }
    for (const m of Array.from(xml.matchAll(/<Program>([\s\S]*?)<\/Program>/g))) {
      if (tag(m[1], "ARPT") === code) delays.push({ kind: "Ground stop", reason: tag(m[1], "Reason"), detail: tag(m[1], "End_Time") ? `until ${tag(m[1], "End_Time")}` : "" });
    }
    for (const m of Array.from(xml.matchAll(/<Delay>([\s\S]*?)<\/Delay>/g))) {
      if (tag(m[1], "ARPT") !== code) continue;
      for (const ad of Array.from(m[1].matchAll(/<Arrival_Departure Type="([^"]+)">([\s\S]*?)<\/Arrival_Departure>/g))) {
        delays.push({ kind: `${ad[1]} delays`, reason: tag(m[1], "Reason"), detail: `${tag(ad[2], "Min")} to ${tag(ad[2], "Max")}${tag(ad[2], "Trend") ? `, ${tag(ad[2], "Trend").toLowerCase()}` : ""}` });
      }
    }
    for (const m of Array.from(xml.matchAll(/<Airport>([\s\S]*?)<\/Airport>/g))) {
      // Closure notices are mostly limits on small private planes ("CLSD TO
      // NON SKED TRANSIENT GA ACFT", "EXC SKED"); only a full closure matters
      // to passengers.
      const why = tag(m[1], "Reason");
      if (tag(m[1], "ARPT") === code && !/\bEXC\b|\bTO NON\b|NON SKED|\bGA\b|\bRWY\b|\bTWY\b/i.test(why)) delays.push({ kind: "Closure", reason: "airport closed", detail: tag(m[1], "Reopen") ? `reopens ${tag(m[1], "Reopen")}` : "" });
    }
    return { code, name, delays: delays.map((d) => ({ ...d, reason: faaReason(d.reason) })), updated };
  });
}

// ── upcoming rocket launches from Florida's Space Coast (The Space Devs, Launch Library 2) ──
export interface Launch {
  name: string;
  provider: string;
  pad: string;
  net: string;
  status: string;
  confirmed: boolean;
  image: string;
}

export async function getSpaceCoastLaunches(): Promise<Launch[] | null> {
  // Free tier allows 15 calls an hour; the 30-minute cache keeps each server under it.
  return cached("ll2-fl", async () => {
    const j = await getJson("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=6&location__ids=12,27&mode=list", 8000);
    return ((j.results || []) as Array<Record<string, unknown>>).map((x) => {
      const st = (x.status || {}) as Record<string, string>;
      return {
        name: String(x.name || ""),
        provider: String(x.lsp_name || ""),
        pad: `${x.pad || ""}, ${String(x.location || "").replace(/, USA$/, "")}`,
        net: String(x.net || ""),
        status: st.name || "",
        confirmed: st.abbrev === "Go",
        image: String(x.image || ""),
      };
    });
  });
}

/** Airports shown in each state's airport module (FAA codes). */
export const STATE_AIRPORTS: Record<string, Array<[string, string]>> = {
  Georgia: [["ATL", "Atlanta Hartsfield-Jackson"], ["SAV", "Savannah/Hilton Head"]],
  Iowa: [["DSM", "Des Moines"], ["CID", "Cedar Rapids"], ["SUX", "Sioux City"]],
  Montana: [["BIL", "Billings"], ["BZN", "Bozeman"], ["MSO", "Missoula"], ["FCA", "Glacier Park"]],
  Arizona: [["PHX", "Phoenix Sky Harbor"], ["TUS", "Tucson"], ["FLG", "Flagstaff"]],
  Hawaii: [["HNL", "Honolulu"], ["OGG", "Kahului, Maui"], ["KOA", "Kona"], ["ITO", "Hilo"], ["LIH", "Lihue, Kauai"]],
  "New York": [["JFK", "Kennedy"], ["LGA", "LaGuardia"], ["BUF", "Buffalo"], ["ALB", "Albany"]],
  California: [["LAX", "Los Angeles"], ["SFO", "San Francisco"], ["SAN", "San Diego"], ["SJC", "San Jose"], ["SMF", "Sacramento"]],
  Florida: [["MIA", "Miami"], ["MCO", "Orlando"], ["TPA", "Tampa"], ["FLL", "Fort Lauderdale"], ["JAX", "Jacksonville"]],
};

// ── earthquakes in a state's box, past 7 days, magnitude 2.5+ (USGS) ──

export interface StateOutline { d: string; w: number; h: number; lon0: number; lat0: number; k: number; c: number }
export function outlineOf(state: string): StateOutline | null {
  return (outlines as Record<string, StateOutline>)[state] || null;
}

export interface Quake { mag: number; place: string; time: number; url: string; lon: number; lat: number }

export async function getStateQuakes(state: string): Promise<Quake[] | null> {
  const o = outlineOf(state);
  if (!o) return null;
  const minLat = o.lat0 - o.h / o.k;
  const maxLon = o.lon0 + o.w / (o.k * o.c);
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return cached(`usgs:${state}`, async () => {
    const j = await getJson(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${since}&minmagnitude=2.5&minlatitude=${minLat.toFixed(2)}&maxlatitude=${o.lat0.toFixed(2)}&minlongitude=${o.lon0.toFixed(2)}&maxlongitude=${maxLon.toFixed(2)}&orderby=time&limit=200`, 8000);
    const abbr = /,\s*([A-Z]{2}|[A-Za-z ]+)$/;
    return ((j.features || []) as Array<{ properties: Record<string, unknown>; geometry: { coordinates: number[] } }>)
      .map((f) => ({ mag: Number(f.properties.mag), place: String(f.properties.place || ""), time: Number(f.properties.time), url: String(f.properties.url || ""), lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }))
      // the box also holds neighbours and the sea; keep quakes USGS places in the state or just off its coast
      .filter((q) => {
        const tail = (q.place.match(abbr) || [])[1] || "";
        return tail === state || tail === STATE_ABBR[state] || /offshore|coast/i.test(q.place) && q.place.includes(state);
      });
  });
}

const STATE_ABBR: Record<string, string> = { California: "CA", Alaska: "Alaska", Hawaii: "Hawaii", Oregon: "Oregon", Washington: "Washington", Nevada: "Nevada", Utah: "Utah", Idaho: "Idaho", Montana: "Montana", Wyoming: "Wyoming", Oklahoma: "Oklahoma", Texas: "Texas", "New Mexico": "New Mexico", Arizona: "Arizona" };

// ── active wildfires in a state (NIFC, Wildland Fire Interagency Geospatial Services) ──
export interface Fire { name: string; acres: number; contained: number | null; county: string; discovered: number; lon: number | null; lat: number | null }

export async function getStateFires(abbr: string): Promise<Fire[] | null> {
  return cached(`nifc:${abbr}`, async () => {
    const where = encodeURIComponent(`POOState='US-${abbr}' AND IncidentTypeCategory='WF' AND IncidentSize>=10 AND (PercentContained IS NULL OR PercentContained<100)`);
    const j = await getJson(`https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=${where}&outFields=IncidentName,IncidentSize,PercentContained,POOCounty,FireDiscoveryDateTime&orderByFields=IncidentSize%20DESC&resultRecordCount=12&returnGeometry=true&outSR=4326&f=json`, 8000);
    return ((j.features || []) as Array<{ attributes: Record<string, unknown>; geometry?: { x: number; y: number } }>).map((f) => ({
      name: String(f.attributes.IncidentName || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      acres: Math.round(Number(f.attributes.IncidentSize || 0)),
      contained: f.attributes.PercentContained == null ? null : Number(f.attributes.PercentContained),
      county: String(f.attributes.POOCounty || ""),
      discovered: Number(f.attributes.FireDiscoveryDateTime || 0),
      lon: f.geometry ? f.geometry.x : null,
      lat: f.geometry ? f.geometry.y : null,
    }));
  });
}

// ── New York City subway service status (MTA GTFS-realtime alerts, public JSON) ──
export interface SubwayLine { route: string; status: string; text: string }

export const SUBWAY_ROUTES = ["1", "2", "3", "4", "5", "6", "7", "A", "C", "E", "B", "D", "F", "M", "G", "J", "Z", "L", "N", "Q", "R", "W", "S", "SIR"];

export async function getSubwayStatus(): Promise<SubwayLine[] | null> {
  return cached("mta-subway", async () => {
    const j = await getJson("https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json", 8000);
    const now = Date.now() / 1000;
    const by = new Map<string, SubwayLine>();
    // the worse the status, the earlier it wins for a line
    const rank = (s: string) => (/suspend/i.test(s) ? 0 : /delay/i.test(s) ? 1 : /reroute|express|local|skip|reduced|slow/i.test(s) ? 2 : 3);
    for (const e of (j.entity || []) as Array<{ alert?: Record<string, unknown> }>) {
      const a = e.alert;
      if (!a) continue;
      const periods = (a.active_period || []) as Array<{ start?: number; end?: number }>;
      if (periods.length && !periods.some((p) => (p.start || 0) <= now && (!p.end || p.end >= now))) continue;
      const meta = (a["transit_realtime.mercury_alert"] || {}) as Record<string, string>;
      const status = String(meta.alert_type || "Service change");
      const tr = (((a.header_text || {}) as { translation?: Array<{ text: string; language: string }> }).translation || []).find((t) => t.language === "en");
      const text = (tr?.text || "").replace(/\s+/g, " ").trim();
      for (const ie of (a.informed_entity || []) as Array<{ route_id?: string }>) {
        const r = ie.route_id === "SI" ? "SIR" : ie.route_id === "GS" || ie.route_id === "FS" || ie.route_id === "H" ? "S" : ie.route_id;
        if (!r || !SUBWAY_ROUTES.includes(r)) continue;
        const cur = by.get(r);
        if (!cur || rank(status) < rank(cur.status)) by.set(r, { route: r, status, text });
      }
    }
    return SUBWAY_ROUTES.map((r) => by.get(r) || { route: r, status: "Good service", text: "" });
  });
}

// ── volcano status from the USGS Hazard Notification System ──
export interface VolcanoStatus { name: string; level: string; color: string; summary: string; date: string; url: string }

export async function getVolcanoStatus(vnum: string): Promise<VolcanoStatus | null> {
  return cached(`hans:${vnum}`, async () => {
    const [v, n] = await Promise.all([
      getJson(`https://volcanoes.usgs.gov/hans-public/api/volcano/getVolcano/${vnum}`, 8000),
      getJson(`https://volcanoes.usgs.gov/hans-public/api/volcano/newestForVolcano/${vnum}`, 8000),
    ]);
    const text = String(n.noticeHtml || "").replace(/<[^>]+>/g, " ").replace(/&#?\w+;/g, (e: string) => ({ "&amp;": "&", "&#39;": "'", "&quot;": '"', "&nbsp;": " " } as Record<string, string>)[e] || " ").replace(/\s+/g, " ");
    const summary = (text.match(/Summary:\s*(.*?)(?:\s(?:Overview|Summit Observations|Rift Zone Observations|Hazards?|Background):|$)/) || [])[1] || "";
    return {
      name: String(v.volcano_name || ""),
      level: String(n.noticeHighestAlertLevel || "NORMAL"),
      color: String(n.noticeHighestColorCode || "GREEN"),
      // up to about 420 characters, ending on a full sentence
      summary: summary.length > 420 ? summary.slice(0, 420).replace(/[^.]*$/, "").trim() || summary.slice(0, 420) : summary,
      date: String(n.sentUtc || ""),
      url: String(v.volcano_url || ""),
    };
  });
}

// ── ocean conditions from NOAA National Data Buoy Center buoys ──
export interface Buoy { name: string; waveFt: number | null; periodS: number | null; waterF: number | null; time: string }

export async function getBuoys(list: Array<[string, string]>): Promise<Buoy[] | null> {
  const res = await Promise.all(
    list.map(([id, name]) =>
      cached(`ndbc:${id}`, async () => {
        const r = await fetch(`https://www.ndbc.noaa.gov/data/realtime2/${id}.txt`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000), cache: "no-store" });
        if (!r.ok) throw new Error(`ndbc ${r.status}`);
        const rows = (await r.text()).split("\n").filter((l) => l && !l.startsWith("#"));
        // the newest row that reports waves
        const row = rows.map((l) => l.trim().split(/\s+/)).find((c) => c[8] !== "MM") || rows[0]?.trim().split(/\s+/);
        if (!row) throw new Error("ndbc empty");
        const num = (v: string) => (v === "MM" || v === undefined ? null : parseFloat(v));
        const wv = num(row[8]);
        const wt = num(row[14]);
        return { name, waveFt: wv == null ? null : Math.round(wv * 3.281 * 10) / 10, periodS: num(row[9]), waterF: wt == null ? null : Math.round(wt * 9 / 5 + 32), time: `${row[0]}-${row[1]}-${row[2]}T${row[3]}:${row[4]}:00Z` };
      })
    )
  );
  // a buoy that stopped reporting days ago is left out
  const ok = res.filter((x): x is Buoy => !!x && Date.now() - new Date(x.time).getTime() < 3 * 86400000);
  return ok.length ? ok : null;
}

// ── hourly UV index forecast for a city (EPA Envirofacts) ──
export interface UvHour { hour: string; uv: number }

export async function getUvHourly(city: string, st: string): Promise<UvHour[] | null> {
  return cached(`uv:${city}`, async () => {
    const j = (await getJson(`https://data.epa.gov/efservice/getEnvirofactsUVHOURLY/CITY/${encodeURIComponent(city)}/STATE/${st}/JSON`, 8000)) as Array<{ DATE_TIME: string; UV_VALUE: number }>;
    return j.map((x) => ({ hour: x.DATE_TIME.split(" ").slice(1).join(" ").replace(/^0/, ""), uv: Number(x.UV_VALUE) }));
  });
}

// ── snow depth at mountain stations (NRCS SNOTEL) ──
export interface SnowStation { name: string; depthIn: number | null; change3d: number | null; sweIn: number | null; date: string }

export async function getSnow(stations: Array<[string, string]>): Promise<SnowStation[] | null> {
  const begin = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);
  const j = await cached(`snotel:${stations.map((s) => s[0]).join(",")}`, () =>
    getJson(`https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data?stationTriplets=${stations.map((s) => s[0]).join(",")}&elements=SNWD,WTEQ&duration=DAILY&beginDate=${begin}`, 9000)
  );
  if (!j) return null;
  const out: SnowStation[] = [];
  for (const [id, name] of stations) {
    const st = (j as Array<{ stationTriplet: string; data: Array<{ stationElement: { elementCode: string }; values: Array<{ date: string; value: number }> }> }>).find((x) => x.stationTriplet === id);
    if (!st) continue;
    const series = (code: string) => (st.data.find((d) => d.stationElement.elementCode === code)?.values || []).filter((v) => v.value != null);
    const sd = series("SNWD");
    const swe = series("WTEQ");
    const last = sd[sd.length - 1];
    if (!last) continue;
    out.push({ name, depthIn: last.value, change3d: sd.length > 1 ? last.value - sd[0].value : null, sweIn: swe.length ? swe[swe.length - 1].value : null, date: last.date });
  }
  return out.length ? out : null;
}

// ── drought across a state, by intensity (U.S. Drought Monitor) ──
export interface Drought { date: string; none: number; d0: number; d1: number; d2: number; d3: number; d4: number; prev?: { d1: number } }

export async function getDrought(fips: string): Promise<Drought | null> {
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  return cached(`usdm:${fips}`, async () => {
    const r = await fetch(`https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=${fips}&startdate=${fmt(new Date(Date.now() - 35 * 86400000))}&enddate=${fmt(new Date())}&statisticsType=1`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!r.ok) throw new Error(`usdm ${r.status}`);
    const j = (await r.json()) as Array<Record<string, string | number>>;
    if (!j.length) throw new Error("usdm empty");
    const n = (v: unknown) => Number(v) || 0;
    const [a, , , , b] = j;
    // the numbers are cumulative (D1 includes D2-D4), as the Monitor reports them
    return { date: String(a.mapDate).slice(0, 10), none: n(a.none), d0: n(a.d0), d1: n(a.d1), d2: n(a.d2), d3: n(a.d3), d4: n(a.d4), prev: b ? { d1: n(b.d1) } : undefined };
  });
}

/** The weather-strip cities of a state: the hand-tuned list, else the state's facts. */
export function citiesOf(state: string): Array<[string, number, number]> {
  return WEATHER_CITIES[state] || STATE_FACTS[state]?.cities || [];
}
export function airportsOf(state: string): Array<[string, string]> | undefined {
  return STATE_AIRPORTS[state] || STATE_FACTS[state]?.airports;
}

// ── a state's signature figures: snow, storm reports, Lake Mead ──
export interface Signature { kicker: string; title: string; items: Array<{ label: string; value: string; sub?: string }>; note?: string; source: string; link?: string }

/** The five highest active SNOTEL stations of a state, with their snow. */
export async function getStateSnow(abbr: string): Promise<SnowStation[] | null> {
  const list = await cached(`snotel-st:${abbr}`, async () => {
    const j = (await getJson(`https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations?stationTriplets=*:${abbr}:SNTL&activeOnly=true`, 9000)) as Array<{ stationTriplet: string; name: string; elevation?: number }>;
    return j.sort((a, b) => (b.elevation || 0) - (a.elevation || 0)).slice(0, 5).map((x) => [x.stationTriplet, x.name] as [string, string]);
  });
  return list && list.length ? getSnow(list) : null;
}

/** Tornado, wind and hail reports in a state, today and yesterday (NOAA Storm Prediction Center). */
export async function getStormReports(abbr: string): Promise<{ tornado: number; wind: number; hail: number; latest?: string } | null> {
  return cached(`spc:${abbr}`, async () => {
    const counts = { tornado: 0, wind: 0, hail: 0 } as { tornado: number; wind: number; hail: number; latest?: string };
    for (const day of ["today", "yesterday"]) {
      const r = await fetch(`https://www.spc.noaa.gov/climo/reports/${day}_filtered.csv`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!r.ok) continue;
      let kind: "tornado" | "wind" | "hail" = "tornado";
      for (const line of (await r.text()).split("\n")) {
        if (line.startsWith("Time,F_Scale")) kind = "tornado";
        else if (line.startsWith("Time,Speed")) kind = "wind";
        else if (line.startsWith("Time,Size")) kind = "hail";
        else {
          const c = line.split(",");
          if (c[4] === abbr) {
            counts[kind]++;
            if (!counts.latest) counts.latest = `${c[2]}, ${c[3]} County`;
          }
        }
      }
    }
    return counts;
  });
}

/** Lake Mead's elevation from Reclamation's daily Lower Colorado table. */
export async function getLakeMead(): Promise<{ elev: number; change: number; day: number } | null> {
  return cached("lake-mead", async () => {
    const r = await fetch("https://www.usbr.gov/lc/region/g4000/hourly/levels.html", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!r.ok) throw new Error(`usbr ${r.status}`);
    const rows = (await r.text()).replace(/<[^>]+>/g, "").split("\n").map((l) => l.trim().split(/\s+/)).filter((c) => /^\d{1,2}$/.test(c[0]) && /^\d{3,4}\.\d{2}$/.test(c[3] || ""));
    if (!rows.length) throw new Error("usbr: no rows");
    const first = parseFloat(rows[0][3]);
    const last = rows[rows.length - 1];
    return { elev: parseFloat(last[3]), change: Math.round((parseFloat(last[3]) - first) * 100) / 100, day: Number(last[0]) };
  });
}

const SNOW_STATES: Record<string, string> = { Colorado: "CO", Utah: "UT", Idaho: "ID", Wyoming: "WY", Oregon: "OR", Washington: "WA", "New Mexico": "NM", Alaska: "AK" };
const STORM_STATES = ["Kansas", "Oklahoma", "Nebraska", "Missouri", "Arkansas", "Mississippi", "Alabama", "Tennessee", "Kentucky", "Illinois", "Indiana", "South Dakota", "North Dakota", "Minnesota", "Wisconsin"];

/** The figures that make a state's homepage its own, when they exist. */
export async function getSignature(state: string, abbr: string): Promise<Signature | null> {
  if (state === "Nevada") {
    const m = await getLakeMead();
    if (!m) return null;
    return {
      kicker: "Water", title: "Lake Mead today",
      items: [
        { label: "Elevation", value: `${m.elev.toFixed(2)} ft`, sub: "above sea level" },
        { label: "This month", value: `${m.change >= 0 ? "+" : ""}${m.change.toFixed(2)} ft`, sub: m.change >= 0 ? "rising" : "falling" },
        { label: "Tier 1 shortage line", value: `${Math.abs(m.elev - 1075).toFixed(1)} ft ${m.elev >= 1075 ? "above" : "below"}`, sub: "the line is 1,075 ft" },
      ],
      source: "U.S. Bureau of Reclamation, Lower Colorado daily operations", link: "https://www.usbr.gov/lc/region/g4000/hourly/levels.html",
    };
  }
  if (SNOW_STATES[state]) {
    const s = await getStateSnow(SNOW_STATES[state]);
    if (!s) return null;
    return {
      kicker: "High country", title: "Snow on the mountains",
      items: s.map((x) => ({ label: x.name, value: x.depthIn != null ? `${x.depthIn}″` : "–", sub: x.change3d ? `${x.change3d > 0 ? "+" : ""}${x.change3d}″ in 3 days` : x.sweIn != null ? `${x.sweIn}″ of water` : "snow depth" })),
      source: "NRCS SNOTEL, the state's highest mountain stations", link: "https://www.nrcs.usda.gov/resources/data-and-reports/snow-and-water-interactive-map",
    };
  }
  if (STORM_STATES.includes(state)) {
    const r = await getStormReports(abbr);
    if (!r) return null;
    return {
      kicker: "Storm watch", title: "Severe weather reports, last 48 hours",
      items: [
        { label: "Tornadoes", value: String(r.tornado), sub: "reported" },
        { label: "Damaging wind", value: String(r.wind), sub: "reports" },
        { label: "Large hail", value: String(r.hail), sub: "reports" },
      ],
      note: r.latest ? `Latest report: ${r.latest}` : `No severe weather reported in ${state} today or yesterday.`,
      source: "NOAA Storm Prediction Center, preliminary local storm reports", link: "https://www.spc.noaa.gov/climo/reports/today.html",
    };
  }
  return null;
}

export interface FullAlert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  area: string;
  effective: string;
  expires: string;
  instruction: string;
}

/** Every active NWS alert for the state, most severe first (the /alerts page). */
export async function getAllStateAlerts(abbr: string): Promise<FullAlert[] | null> {
  return cached(`nwsalerts-all:${abbr}`, async () => {
    const j = await getJson(`https://api.weather.gov/alerts/active?area=${abbr}`);
    return ((j.features || []) as Array<{ id: string; properties: Record<string, string> }>)
      .map((f) => ({
        id: f.id,
        event: f.properties.event,
        headline: f.properties.headline || f.properties.event,
        severity: f.properties.severity || "Unknown",
        area: (f.properties.areaDesc || "").replace(/;\s*/g, ", "),
        effective: f.properties.effective || f.properties.onset || "",
        expires: f.properties.ends || f.properties.expires || "",
        instruction: (f.properties.instruction || "").replace(/\s+/g, " ").trim().slice(0, 600),
      }))
      .sort((a, b) => SEVERITY.indexOf(a.severity) - SEVERITY.indexOf(b.severity));
  });
}
