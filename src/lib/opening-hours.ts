/**
 * OpenStreetMap opening_hours, the common forms: "Mo-Fr 08:00-17:00; Sa 09:00-13:00",
 * "Mo,We 10:00-14:00,16:00-20:00", "24/7", "Su off". Anything it can't read
 * returns null and the page just shows the raw text.
 */
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export type Week = Array<Array<[number, number]>>; // per day (Mo..Su), minutes from midnight

export function parseHours(raw: string | null | undefined): Week | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^24\/7$/.test(s)) return DAYS.map(() => [[0, 1440]]);
  const week: Week = DAYS.map(() => []);
  let any = false;
  for (const rule of s.split(/\s*;\s*/)) {
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)\s+(.+)$/);
    if (!m) { if (rule && !/^PH\b/.test(rule)) return any ? week : null; continue; }
    const days: number[] = [];
    for (const part of m[1].split(",").filter(Boolean)) {
      const [a, b] = part.split("-").map((d) => DAYS.indexOf(d));
      if (a < 0) return null;
      if (b === undefined || b < 0) days.push(a);
      else for (let i = a; ; i = (i + 1) % 7) { days.push(i); if (i === b) break; }
    }
    const times = m[2].trim();
    if (/^off|closed$/i.test(times)) { for (const d of days) week[d] = []; any = true; continue; }
    const ranges: Array<[number, number]> = [];
    for (const t of times.split(",")) {
      const r = t.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
      if (!r) return any ? week : null;
      const start = +r[1] * 60 + +r[2]; let end = +r[3] * 60 + +r[4];
      if (end <= start) end += 1440;
      ranges.push([start, end]);
    }
    for (const d of days) week[d] = ranges;
    any = true;
  }
  return any ? week : null;
}

const fmt = (m: number) => { const h = Math.floor((m % 1440) / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12; return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : ""} ${ap}`; };
export const rangeText = (r: Array<[number, number]>) => (r.length ? r.map(([a, b]) => (a === 0 && b === 1440 ? "Open 24 hours" : `${fmt(a)} – ${fmt(b)}`)).join(", ") : "Closed");

/** Open right now in the given time zone, with the next change. */
export function openNow(week: Week, tz: string): { open: boolean; label: string; today: number } {
  const parts = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "numeric", hour12: false, timeZone: tz }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value || "Mon";
  const today = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd);
  const now = (+(parts.find((p) => p.type === "hour")?.value || 0) % 24) * 60 + +(parts.find((p) => p.type === "minute")?.value || 0);
  // also yesterday's ranges that run past midnight
  const y = (today + 6) % 7;
  for (const [, b] of week[y]) if (b > 1440 && now < b - 1440) return { open: true, label: `Open now · closes ${fmt(b)}`, today };
  for (const [a, b] of week[today]) {
    if (a === 0 && b === 1440) return { open: true, label: "Open 24 hours", today };
    if (now >= a && now < b) return { open: true, label: `Open now · closes ${fmt(b)}`, today };
  }
  const later = week[today].find(([a]) => a > now);
  if (later) return { open: false, label: `Closed · opens ${fmt(later[0])}`, today };
  for (let i = 1; i <= 7; i++) {
    const d = (today + i) % 7;
    if (week[d].length) return { open: false, label: `Closed · opens ${i === 1 ? "tomorrow" : DAY_NAMES[d]} ${fmt(week[d][0][0])}`, today };
  }
  return { open: false, label: "Closed", today };
}
