import counties from "@/config/counties/us-counties.json";
import outlines from "@/config/state-outlines.json";

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
  const list = WEATHER_CITIES[state] || [];
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
  const first = (WEATHER_CITIES[state] || [])[0];
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
      if (tag(m[1], "ARPT") === code) delays.push({ kind: "Closure", reason: tag(m[1], "Reason"), detail: tag(m[1], "Reopen") ? `reopens ${tag(m[1], "Reopen")}` : "" });
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
export interface Fire { name: string; acres: number; contained: number | null; county: string; discovered: number }

export async function getStateFires(abbr: string): Promise<Fire[] | null> {
  return cached(`nifc:${abbr}`, async () => {
    const where = encodeURIComponent(`POOState='US-${abbr}' AND IncidentTypeCategory='WF' AND IncidentSize>=10 AND (PercentContained IS NULL OR PercentContained<100)`);
    const j = await getJson(`https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=${where}&outFields=IncidentName,IncidentSize,PercentContained,POOCounty,FireDiscoveryDateTime&orderByFields=IncidentSize%20DESC&resultRecordCount=8&f=json`, 8000);
    return ((j.features || []) as Array<{ attributes: Record<string, unknown> }>).map((f) => ({
      name: String(f.attributes.IncidentName || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      acres: Math.round(Number(f.attributes.IncidentSize || 0)),
      contained: f.attributes.PercentContained == null ? null : Number(f.attributes.PercentContained),
      county: String(f.attributes.POOCounty || ""),
      discovered: Number(f.attributes.FireDiscoveryDateTime || 0),
    }));
  });
}
