import type { StateOutline } from "@/lib/local-data";

/**
 * A state's outline (us-atlas) with points on it — fires, quakes, gauges —
 * as a server-rendered SVG. Colours come from the caller, so the same map
 * fits a light or a dark page.
 */
export interface MapPoint { lon: number; lat: number; r: number; color: string; title: string; key: string }

export default function StateMap({ outline, points = [], cities = [], fill = "#f3ede1", stroke = "#b9a98a", label = "#333", font = "Georgia, serif" }: {
  outline: StateOutline;
  points?: MapPoint[];
  cities?: Array<[string, number, number]>;
  fill?: string;
  stroke?: string;
  label?: string;
  font?: string;
}) {
  const x = (lon: number) => (lon - outline.lon0) * outline.k * outline.c;
  const y = (lat: number) => (outline.lat0 - lat) * outline.k;
  const pad = 12;
  return (
    <svg viewBox={`${-pad} ${-pad} ${outline.w + pad * 2} ${outline.h + pad * 2}`} className="h-auto w-full" role="img" aria-label="Map of the state">
      <path d={outline.d} fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      {cities.map(([n, la, lo]) => (
        <g key={n}>
          <circle cx={x(lo)} cy={y(la)} r="3" fill={label} />
          <text x={x(lo) + 6} y={y(la) + 4} fontSize="13" fill={label} fontFamily={font}>{n}</text>
        </g>
      ))}
      {points.map((p) => (
        <circle key={p.key} cx={x(p.lon)} cy={y(p.lat)} r={p.r} fill={p.color} fillOpacity=".85" stroke="#fff" strokeWidth="1">
          <title>{p.title}</title>
        </circle>
      ))}
    </svg>
  );
}
