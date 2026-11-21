import type { Quake, StateOutline } from "@/lib/local-data";

/**
 * The state's outline with the past week's earthquakes (USGS), each dot sized
 * and coloured by magnitude. Server-rendered SVG, no map library or tiles.
 */
export function quakeColor(m: number) {
  return m >= 4 ? "#c62828" : m >= 3 ? "#ef6c00" : "#f9a825";
}

export default function QuakeMap({ outline, quakes, cities }: { outline: StateOutline; quakes: Quake[]; cities?: Array<[string, number, number]> }) {
  const x = (lon: number) => (lon - outline.lon0) * outline.k * outline.c;
  const y = (lat: number) => (outline.lat0 - lat) * outline.k;
  const pad = 10;
  return (
    <svg viewBox={`${-pad} ${-pad} ${outline.w + pad * 2} ${outline.h + pad * 2}`} className="h-auto w-full" role="img" aria-label={`Map of earthquakes of magnitude 2.5 or more in the past seven days`}>
      <path d={outline.d} fill="#f3ede1" stroke="#b9a98a" strokeWidth="1.2" strokeLinejoin="round" />
      {(cities || []).map(([n, la, lo]) => (
        <g key={n}>
          <circle cx={x(lo)} cy={y(la)} r="2.2" fill="#333" />
          <text x={x(lo) + 5} y={y(la) + 3.5} fontSize="10" fill="#333" fontFamily="var(--mg-serif), Georgia, serif">{n}</text>
        </g>
      ))}
      {[...quakes].sort((a, b) => a.mag - b.mag).map((q) => (
        <circle key={q.url} cx={x(q.lon)} cy={y(q.lat)} r={2 + (q.mag - 2.5) * 3.2} fill={quakeColor(q.mag)} fillOpacity=".78" stroke="#fff" strokeWidth=".8">
          <title>{`M${q.mag.toFixed(1)} · ${q.place}`}</title>
        </circle>
      ))}
    </svg>
  );
}
