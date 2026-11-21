import counties from "@/config/counties/us-counties.json";

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
};

export interface CityWeather {
  city: string;
  temp: number;
  unit: string;
  short: string;
  high: number | null;
  low: number | null;
  isDay: boolean;
}

/** National Weather Service forecast for one point. */
async function nwsCity(city: string, lat: number, lon: number): Promise<CityWeather> {
  const pt = await getJson(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
  const fc = await getJson(pt.properties.forecast);
  const periods = fc.properties.periods as Array<{ temperature: number; temperatureUnit: string; shortForecast: string; isDaytime: boolean }>;
  const now = periods[0];
  const next = periods[1];
  const hi = now.isDaytime ? now.temperature : next?.temperature ?? null;
  const lo = now.isDaytime ? next?.temperature ?? null : now.temperature;
  return { city, temp: now.temperature, unit: now.temperatureUnit, short: now.shortForecast, high: hi, low: lo, isDay: now.isDaytime };
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
