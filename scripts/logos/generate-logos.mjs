// v2: 50 American-style newspaper logos. One font per state, a state symbol,
// state colours, and ten American forms (interstate shield, licence plate,
// varsity arch, western, seal, ribbon, stars & stripes, crest, masthead,
// state outline). Text is converted to paths, so each SVG is self-contained.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as topojson from "topojson-client";
import { geoTransverseMercator, geoPath, geoCentroid } from "d3-geo";
const opentype = createRequire(import.meta.url)("opentype.js");

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, "svg3");
fs.mkdirSync(OUT, { recursive: true });
const NM = (p) => path.join(HERE, "node_modules", p);

// ── sites ──
const src = fs.readFileSync("/home/user/NEWS/src/config/sites.ts", "utf8");
const re = /slug:\s*"([^"]+)",\s*domain:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?city:\s*"([^"]+)",\s*state:\s*"([^"]+)",\s*stateAbbr:\s*"([^"]+)",[\s\S]*?accent:\s*"([^"]+)",\s*accentDark:\s*"([^"]+)"/g;
const SITES = {};
for (const m of src.matchAll(re)) SITES[m[5]] = { slug: m[1], domain: m[2], name: m[3], city: m[4], state: m[5], abbr: m[6], c1: m[7], dark: m[8] };

// ── fonts ──
const fontCache = {};
function font(pkg) {
  if (fontCache[pkg]) return fontCache[pkg];
  const dir = NM(`@fontsource/${pkg}/files`);
  const files = fs.readdirSync(dir).filter((f) => /-latin-\d+-normal\.woff$/.test(f));
  files.sort((a, b) => parseInt(a.match(/-(\d+)-normal/)[1]) - parseInt(b.match(/-(\d+)-normal/)[1]));
  // Heaviest weight up to 900 — display faces read best bold.
  const buf = fs.readFileSync(path.join(dir, files[files.length - 1]));
  return (fontCache[pkg] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
}
const SMALL = "libre-franklin";
function smallFont() {
  const buf = fs.readFileSync(NM("@fontsource/libre-franklin/files/libre-franklin-latin-700-normal.woff"));
  return (fontCache.__small ||= opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
}
const fnt = (k) => (k === SMALL ? smallFont() : font(k));

const n2 = (v) => (Math.round(v * 100) / 100).toString();
function pathData(p) {
  let o = "";
  for (const c of p.commands) {
    if (c.type === "M" || c.type === "L") o += c.type + n2(c.x) + " " + n2(c.y);
    else if (c.type === "Q") o += "Q" + n2(c.x1) + " " + n2(c.y1) + " " + n2(c.x) + " " + n2(c.y);
    else if (c.type === "C") o += "C" + n2(c.x1) + " " + n2(c.y1) + " " + n2(c.x2) + " " + n2(c.y2) + " " + n2(c.x) + " " + n2(c.y);
    else if (c.type === "Z") o += "Z";
  }
  return o;
}
function glyphsOf(k, str) {
  const f = fnt(k);
  return Array.from(str).map((c) => {
    const g = f.charToGlyph(c);
    // A face without the character falls back to its upper-case form.
    return g.index === 0 && c !== c.toUpperCase() ? f.charToGlyph(c.toUpperCase()) : g;
  });
}
function text(k, str, size, x, y, spacing = 0) {
  const f = fnt(k);
  const gs = glyphsOf(k, str);
  let cx = x;
  let d = "";
  gs.forEach((g, i) => {
    d += pathData(g.getPath(cx, y, size));
    cx += (g.advanceWidth / f.unitsPerEm) * size;
    if (i < gs.length - 1) {
      if (!spacing) {
        const kv = Number(f.getKerningValue(g, gs[i + 1]));
        if (Number.isFinite(kv)) cx += (kv / f.unitsPerEm) * size;
      }
      cx += spacing;
    }
  });
  return { d, w: cx - x };
}
const width = (k, s, size, sp = 0) => text(k, s, size, 0, 0, sp).w;
const fit = (k, s, max, maxW, sp = 0) => Math.min(max, (max * maxW) / Math.max(1, width(k, s, max, sp)));
// Cap height of a face at a size, measured on "H", to centre text vertically.
const capH = (k, size) => {
  const b = fnt(k).charToGlyph("H").getPath(0, 0, size).getBoundingBox();
  return -b.y1;
};
// Text centred on cx with its cap height centred on cy.
function textC(k, s, size, cx, cy, sp = 0) {
  const w = width(k, s, size, sp);
  return text(k, s, size, cx - w / 2, cy + capH(k, size) / 2, sp);
}

// Text along a circle: top arc reads outward, bottom arc reads upright.
function arcText(k, s, size, cx, cy, r, where, sp = 0) {
  const f = fnt(k);
  const gs = glyphsOf(k, s);
  const adv = gs.map((g) => (g.advanceWidth / f.unitsPerEm) * size + sp);
  const total = adv.reduce((a, b) => a + b, 0) - sp;
  let out = "";
  let run = 0;
  gs.forEach((g, i) => {
    const mid = run + adv[i] / 2 - sp / 2;
    run += adv[i];
    const t = (mid - total / 2) / r;
    const a = where === "top" ? -Math.PI / 2 + t : Math.PI / 2 - t;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    const rot = ((where === "top" ? a + Math.PI / 2 : a - Math.PI / 2) * 180) / Math.PI;
    const gw = (g.advanceWidth / f.unitsPerEm) * size;
    out += `<path transform="translate(${n2(px)} ${n2(py)}) rotate(${n2(rot)})" d="${pathData(g.getPath(-gw / 2, where === "top" ? 0 : capH(k, size), size))}"/>`;
  });
  return out;
}

// ── icons & shapes ──
function icon(name, x, y, size, fill) {
  const svg = fs.readFileSync(NM(`@phosphor-icons/core/assets/fill/${name}-fill.svg`), "utf8");
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect width="256" height="256" fill="none"\/>/, "");
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(size / 256)})" fill="${fill}">${inner}</g>`;
}
const star = (cx, cy, r) => {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.4 : r;
    d += `${i ? "L" : "M"}${n2(cx + rr * Math.cos(a))},${n2(cy + rr * Math.sin(a))}`;
  }
  return d + "Z";
};
const stars = (xs, cy, r) => xs.map((x) => star(x, cy, r)).join("");

const topo = JSON.parse(fs.readFileSync(NM("us-atlas/states-10m.json"), "utf8"));
const FEAT = topojson.feature(topo, topo.objects.states).features;
function outline(name, x, y, w, h) {
  const f = FEAT.find((s) => s.properties.name === name);
  const [lon, lat] = geoPath().centroid(f);
  const proj = geoTransverseMercator().rotate([-lon, -lat]).fitExtent([[x, y], [x + w, y + h]], f);
  return { d: geoPath(proj)(f), c: geoPath(proj).centroid(f), b: geoPath(proj).bounds(f) };
}


// ════════════ v3: premium American mastheads ════════════
// Direction: editorial American masthead. Big type with character in press
// black, one state accent used sparingly, hairline ornaments, a small
// symbol like an editor's mark. Layouts vary; none is repeated fifty times.

// Specific weight/style of a face; falls back to the nearest available.
function fontW(pkg, weight, style = "normal") {
  const key = `${pkg}/${weight}/${style}`;
  if (fontCache[key]) return fontCache[key];
  const dir = NM(`@fontsource/${pkg}/files`);
  const re2 = new RegExp(`-latin-(\\d+)-${style}\\.woff$`);
  const avail = fs.readdirSync(dir).map((f) => f.match(re2)).filter(Boolean).map((m) => parseInt(m[1]));
  if (!avail.length) return null;
  const w = avail.sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight))[0];
  const buf = fs.readFileSync(path.join(dir, `${pkg}-latin-${w}-${style}.woff`));
  return (fontCache[key] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
}
// Register a face under a short key so text()/width() can use it.
function reg(key, pkg, weight, style = "normal") {
  const f = fontW(pkg, weight, style);
  if (!f) return null;
  fontCache[key] = f;
  return key;
}
const TAG = reg("tag", "libre-franklin", 600);

function subtleIcon(name, x, y, size, fill) {
  const svg = fs.readFileSync(NM(`@phosphor-icons/core/assets/light/${name}-light.svg`), "utf8");
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect width="256" height="256" fill="none"\/>/, "");
  return `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(size / 256)})" fill="${fill}">${inner}</g>`;
}
const diamond = (cx, cy, r) => `M${n2(cx)},${n2(cy - r)}L${n2(cx + r)},${n2(cy)}L${n2(cx)},${n2(cy + r)}L${n2(cx - r)},${n2(cy)}Z`;

const W = 640, H = 160, INK = "#121212", GREY = "#5c5c5c";
const tagline = (s) => `NEWS FROM ACROSS ${s.state.toUpperCase()}`;

// [font, weight, style, case, motif, express treatment, slogan]
// case: U = uppercase, T = title case; style "italic" uses the italic cut.
const S = {
  Alabama: ["playfair-display", 900, "italic", "T", "river", "banner", "Alabama news, close to home."],
  Alaska: ["big-shoulders-display", 900, "normal", "U", "peaks", "tracked", "News from the Last Frontier."],
  Arizona: ["young-serif", 400, "normal", "U", "sun", "tracked", "News under the desert sun."],
  Arkansas: ["fraunces", 800, "normal", "T", "river", "tracked", "The Natural State, every day."],
  California: ["dm-serif-display", 400, "normal", "T", "waves", "tracked", "From the coast to the Sierra."],
  Colorado: ["cinzel", 800, "normal", "U", "peaks", "tracked", "News from the high country."],
  Connecticut: ["libre-baskerville", 700, "normal", "T", "arc", "tracked", "Connecticut, town by town."],
  Delaware: ["bodoni-moda", 800, "normal", "U", "arc", "tracked", "The First State, first."],
  Florida: ["archivo-black", 400, "normal", "U", "waves", "tag", "From the Keys to the Panhandle."],
  Georgia: ["abril-fatface", 400, "normal", "T", "skyline", "tracked", "From Atlanta to the coast."],
  Hawaii: ["prata", 400, "normal", "U", "waves", "tracked", "Island news, every day."],
  Idaho: ["oswald", 700, "normal", "U", "peaks", "divider", "Idaho, plain and true."],
  Illinois: ["libre-franklin", 900, "normal", "T", "skyline", "slash", "From Chicago to Cairo."],
  Indiana: ["russo-one", 400, "normal", "U", "slash", "slash", "Indiana news, straight up."],
  Iowa: ["alfa-slab-one", 400, "normal", "U", "fields", "tag", "Iowa, every county."],
  Kansas: ["arvo", 700, "normal", "T", "fields", "tracked", "News from the heartland."],
  Kentucky: ["rozha-one", 400, "normal", "T", "arc", "banner", "The Bluegrass, every day."],
  Louisiana: ["fraunces", 600, "italic", "T", "swoosh", "tracked", "From the bayou to Bourbon Street."],
  Maine: ["merriweather", 900, "normal", "U", "waves", "tracked", "News from Down East."],
  Maryland: ["bevan", 400, "normal", "T", "waves", "banner", "From the bay to the mountains."],
  Massachusetts: ["eb-garamond", 800, "normal", "T", "arc", "tracked", "The Commonwealth, every day."],
  Michigan: ["anton", 400, "normal", "U", "waves", "divider", "Michigan, both peninsulas."],
  Minnesota: ["newsreader", 800, "normal", "T", "waves", "divider", "Land of 10,000 stories."],
  Mississippi: ["playfair-display", 700, "normal", "U", "river", "tracked", "From the river to the Gulf."],
  Missouri: ["zilla-slab", 700, "normal", "T", "river", "tag", "From St. Louis to Kansas City."],
  Montana: ["bebas-neue", 400, "normal", "U", "peaks", "tracked", "Big Sky news."],
  Nebraska: ["roboto-slab", 900, "normal", "U", "fields", "divider", "Nebraska, plain spoken."],
  Nevada: ["staatliches", 400, "normal", "U", "sun", "slash", "Nevada, beyond the Strip."],
  "New Hampshire": ["source-serif-4", 900, "normal", "T", "peaks", "tracked", "Live free. Read on."],
  "New Jersey": ["barlow-condensed", 900, "normal", "U", "slash", "slash", "Jersey news, no filter."],
  "New Mexico": ["ultra", 400, "normal", "U", "sun", "tracked", "News from the Land of Enchantment."],
  "New York": ["noto-serif-display", 900, "normal", "T", "skyline", "tracked", "From the city to upstate."],
  "North Carolina": ["spectral", 800, "normal", "T", "peaks", "waves", "From the mountains to the Outer Banks."],
  "North Dakota": ["fjalla-one", 400, "normal", "U", "fields", "tracked", "Out on the northern plains."],
  Ohio: ["titan-one", 400, "normal", "U", "slash", "tag", "Ohio, all 88 counties."],
  Oklahoma: ["patua-one", 400, "normal", "T", "sun", "banner", "Oklahoma news, straight talk."],
  Oregon: ["literata", 800, "normal", "T", "peaks", "waves", "From the coast to the Cascades."],
  Pennsylvania: ["gloock", 400, "normal", "T", "arc", "tracked", "From Philly to Pittsburgh."],
  "Rhode Island": ["yeseva-one", 400, "normal", "T", "waves", "tracked", "Small state. Big stories."],
  "South Carolina": ["cormorant-garamond", 700, "italic", "T", "waves", "banner", "From the Upstate to the Lowcountry."],
  "South Dakota": ["teko", 700, "normal", "U", "peaks", "divider", "From the Black Hills to the prairie."],
  Tennessee: ["passion-one", 900, "normal", "U", "swoosh", "tracked", "From Memphis to the Smokies."],
  Texas: ["rye", 400, "normal", "U", "star", "banner", "Texas news, told straight."],
  Utah: ["league-gothic", 400, "normal", "U", "peaks", "tag", "From red rock to Salt Lake."],
  Vermont: ["frank-ruhl-libre", 900, "normal", "T", "peaks", "tracked", "Green Mountain news."],
  Virginia: ["old-standard-tt", 700, "normal", "T", "arc", "tracked", "From the Blue Ridge to the bay."],
  Washington: ["domine", 700, "normal", "T", "peaks", "slash", "From Puget Sound to the Palouse."],
  "West Virginia": ["saira-extra-condensed", 900, "normal", "U", "peaks", "tracked", "Mountain State news."],
  Wisconsin: ["lora", 700, "italic", "T", "waves", "divider", "Wisconsin, every corner."],
  Wyoming: ["holtwood-one-sc", 400, "normal", "U", "peaks", "tracked", "Wyoming, wide open."],
};


// ════════════ v7: premium pass on the Expres-style logos ════════════
// Same structure as v6. Motifs are drawn and shaded rather than outlined,
// ornaments carry a metallic gold, the name and banners get quiet gradients,
// EXPRESS is set between hairlines, the slogan in an italic serif.
const OUT7 = path.join(HERE, "svg7");
fs.mkdirSync(OUT7, { recursive: true });
const W7 = 600, H7 = 300;
const tintC = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
const shade = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v * (1 - t)).toString(16).padStart(2, "0");
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};
const sansBold = reg("sansBold7", "libre-franklin", 700);
const sansTag = reg("sansTag7", "libre-franklin", 600);
const sloganFont = reg("slogan7", "playfair-display", 500, "italic");

// Per-logo gradient ids.
function defs(id, s) {
  return `<defs>
<linearGradient id="${id}ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22325a"/><stop offset="1" stop-color="#0d1730"/></linearGradient>
<linearGradient id="${id}acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tintC(s.c1, 0.12)}"/><stop offset="1" stop-color="${shade(s.c1, 0.22)}"/></linearGradient>
<linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3c98f"/><stop offset=".5" stop-color="#b98d4e"/><stop offset="1" stop-color="#8c6630"/></linearGradient>
</defs>`;
}

const M7 = {
  peaks(b, id, s) {
    const cx = b.x + b.w / 2, base = b.y - 10;
    const back = `M${cx - 92},${base} L${cx - 52},${base - 30} L${cx - 30},${base - 18} L${cx + 6},${base - 40} L${cx + 40},${base - 22} L${cx + 62},${base - 32} L${cx + 92},${base} Z`;
    const front = `M${cx - 74},${base} L${cx - 30},${base - 38} L${cx - 14},${base - 26} L${cx + 16},${base - 56} L${cx + 74},${base} Z`;
    const snow = `M${cx + 16},${base - 56} L${cx + 30},${base - 42} L${cx + 23},${base - 44} L${cx + 17},${base - 38} L${cx + 10},${base - 45} L${cx + 3},${base - 43} Z
M${cx - 30},${base - 38} L${cx - 21},${base - 30} L${cx - 26},${base - 31} L${cx - 31},${base - 27} L${cx - 37},${base - 32} Z`;
    return `<path d="${back}" fill="${tintC(s.c1, 0.6)}"/><path d="${front}" fill="url(#${id}acc)"/><path d="${snow}" fill="#ffffff"/>
<rect x="${cx - 96}" y="${base}" width="192" height="1.6" fill="url(#${id}gold)"/>`;
  },
  waves(b, id, s) {
    const x0 = b.x + 6, x1 = b.x + b.w - 6;
    const wave = (y, amp, sw, op) => {
      const n = Math.max(5, Math.round((x1 - x0) / 48));
      const step = (x1 - x0) / n;
      let d = `M${x0},${y}`;
      for (let i = 0; i < n; i++) d += ` q${n2(step / 4)},${-amp} ${n2(step / 2)},0 t${n2(step / 2)},0`;
      return `<path d="${d}" fill="none" stroke="url(#${id}acc)" stroke-width="${sw}" stroke-linecap="round" opacity="${op}"/>`;
    };
    const y = b.base + 15;
    return wave(y, 8, 4.2, 1) + wave(y + 8, 6, 2.2, 0.55);
  },
  sun(b, id) {
    const cx = b.x + b.w / 2, cy = b.y - 10;
    let rays = "";
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      const w = 0.07;
      const p = (r, t) => `${n2(cx + r * Math.cos(t))},${n2(cy + r * Math.sin(t))}`;
      rays += `M${p(31, a - w)}L${p(i % 2 ? 44 : 52, a)}L${p(31, a + w)}Z`;
    }
    return `<path d="${rays}" fill="url(#${id}gold)"/><path d="M${cx - 25},${cy} A25,25 0 0 1 ${cx + 25},${cy} Z" fill="url(#${id}acc)"/>
<rect x="${cx - 70}" y="${cy}" width="140" height="1.6" fill="url(#${id}gold)"/>`;
  },
  star(b, id) {
    const cy = Math.max(b.y - 30, 30);
    const r = Math.min(20, (b.y - 6) / 2.2);
    const cx = b.x + b.w / 2;
    return `<path d="${star(cx, cy, r)}" fill="url(#${id}acc)"/>
<rect x="${cx - r - 74}" y="${cy + 2}" width="62" height="1.4" fill="url(#${id}gold)"/><rect x="${cx + r + 12}" y="${cy + 2}" width="62" height="1.4" fill="url(#${id}gold)"/>
<path d="${star(cx - r - 84, cy + 2.7, 4)}${star(cx + r + 84, cy + 2.7, 4)}" fill="url(#${id}gold)"/>`;
  },
  arc(b, id) {
    const x0 = b.x - 16, y0 = b.base + 4, x1 = b.x + b.w * 0.64, y1 = b.y - 28;
    const sx = x1 + 24, sy = y1 - 4, r = 13;
    // A tapered crescent rather than a hairline: wide at the top, fine at the ends.
    const outer = `M${n2(x0)},${n2(y0)} C${n2(x0 - 12)},${n2(y1)} ${n2(x1 - 120)},${n2(y1 - 12)} ${n2(x1)},${n2(y1)}`;
    const inner = ` C${n2(x1 - 118)},${n2(y1 - 7)} ${n2(x0 - 5)},${n2(y1 + 4)} ${n2(x0)},${n2(y0)} Z`;
    return `<path d="${outer}${inner}" fill="url(#${id}gold)"/>
<path d="M${sx},${sy - r} Q${sx + 2},${sy - 2} ${sx + r},${sy} Q${sx + 2},${sy + 2} ${sx},${sy + r} Q${sx - 2},${sy + 2} ${sx - r},${sy} Q${sx - 2},${sy - 2} ${sx},${sy - r}Z" fill="url(#${id}gold)"/>
<circle cx="${sx + 16}" cy="${sy - 12}" r="2" fill="url(#${id}gold)"/>`;
  },
  skyline(b, id) {
    const cx = b.x + b.w / 2, base = b.y - 10;
    // width, height, roof: 0 flat, 1 spire, 2 stepped
    const bl = [[10, 18, 0], [12, 30, 2], [9, 24, 0], [11, 46, 1], [14, 58, 1], [12, 38, 2], [10, 50, 0], [12, 28, 2], [9, 34, 1], [11, 20, 0]];
    const tot = bl.reduce((a, [w]) => a + w + 3, 0);
    let x = cx - tot / 2, d = "";
    for (const [w, h, roof] of bl) {
      d += `M${n2(x)},${base}V${base - h}`;
      if (roof === 1) d += `H${n2(x + w / 2 - 1)}V${base - h - 12}H${n2(x + w / 2 + 1)}V${base - h}`;
      if (roof === 2) d += `H${n2(x + 2)}V${base - h - 5}H${n2(x + w - 2)}V${base - h}`;
      d += `H${n2(x + w)}V${base}Z`;
      x += w + 3;
    }
    return `<path d="${d}" fill="url(#${id}acc)"/><rect x="${cx - tot / 2 - 14}" y="${base}" width="${tot + 28}" height="1.8" fill="url(#${id}gold)"/>`;
  },
  slash() { return ""; },
  fields(b, id, s) {
    const cx = b.x + b.w / 2, base = b.y - 10;
    const hill = `M${cx - 96},${base} Q${cx - 30},${base - 46} ${cx + 96},${base} Z`;
    let rows = "";
    for (let i = 1; i < 7; i++) rows += `M${cx - 96 + i * 12},${base} Q${cx - 30 + i * 4},${base - 40 + i * 4} ${cx + 96 - i * 4},${base - 2}`;
    return `<clipPath id="${id}hill"><path d="${hill}"/></clipPath><path d="${hill}" fill="url(#${id}acc)"/>
<g clip-path="url(#${id}hill)"><path d="${rows}" fill="none" stroke="${tintC(s.c1, 0.55)}" stroke-width="1.4"/></g>
<circle cx="${cx + 58}" cy="${base - 42}" r="10" fill="url(#${id}gold)"/>`;
  },
  river(b, id) {
    const y = b.base + 16, x0 = b.x, w = b.w;
    const top = `M${x0},${y + 4} C${x0 + w * 0.2},${y - 12} ${x0 + w * 0.35},${y + 16} ${x0 + w * 0.5},${y + 2} S${x0 + w * 0.8},${y - 10} ${x0 + w},${y + 1}`;
    const bot = ` C${x0 + w * 0.8},${y - 4} ${x0 + w * 0.65},${y + 12} ${x0 + w * 0.5},${y + 7} S${x0 + w * 0.2},${y - 6} ${x0},${y + 4} Z`;
    return `<path d="${top}${bot}" fill="url(#${id}acc)"/>`;
  },
  swoosh(b, id, s) {
    const x0 = b.x - 14, x1 = b.x + b.w + 10, y = b.base - (b.base - b.y) * 0.18, L = x1 - x0;
    const main = `M${x0},${y + 16} C${x0 + L * 0.35},${y - 6} ${x0 + L * 0.7},${y - 14} ${x1},${y - 30} C${x0 + L * 0.72},${y - 4} ${x0 + L * 0.38},${y + 10} ${x0 + 8},${y + 22} Z`;
    // Dry-brush streaks along the stroke.
    let streaks = "";
    for (let i = 0; i < 3; i++) streaks += `M${x0 + 30 + i * 8},${y + 12 - i * 3} C${x0 + L * 0.4},${y - 2 - i * 4} ${x0 + L * 0.7},${y - 10 - i * 4} ${x1 - 20 - i * 14},${y - 24 - i * 2}`;
    return `<path d="${main}" fill="url(#${id}acc)" opacity="0.92"/><path d="${streaks}" fill="none" stroke="${tintC(s.c1, 0.45)}" stroke-width="0.9" opacity="0.8"/>`;
  },
};

function logo7(s, cfg) {
  const [pkg, wt, style, cs, motif, exT, slogan] = cfg;
  const id = s.slug.replace(/[^a-z]/g, "");
  const k = reg(`${pkg}-7-${wt}-${style}`, pkg, wt, style) || reg(`${pkg}-7`, pkg, wt);
  const name = cs === "U" ? s.state.toUpperCase() : s.state;
  const c1 = s.c1;
  const horizontal = exT === "tag" || exT === "divider" || exT === "slash";
  let body = "";
  let b;
  const ink = `url(#${id}ink)`, acc = `url(#${id}acc)`, gold = `url(#${id}gold)`;

  if (!horizontal) {
    const size = fit(k, name, 116, W7 - 80);
    const w = width(k, name, size);
    const t = textC(k, name, size, W7 / 2, 132);
    b = { x: (W7 - w) / 2, y: 132 - capH(k, size) / 2, w, h: capH(k, size), base: 132 + capH(k, size) / 2 };
    body += `<path fill="${ink}" d="${t.d}"/>`;
    const ey = b.base + (motif === "waves" || motif === "river" ? 60 : 48);
    if (exT === "banner") {
      const ex = textC(sansBold, "EXPRESS", 26, W7 / 2, ey, 7);
      const bw = ex.w + 74, bx = (W7 - bw) / 2;
      body += `<path d="M${bx - 58},${ey + 9} L${bx + 20},${ey - 6} L${bx + 12},${ey + 15} Z" fill="${shade(c1, 0.35)}"/>
<path d="M${bx + 14},${ey - 25} H${bx + bw} L${bx + bw - 14},${ey + 25} H${bx} Z" fill="${acc}"/>
<path d="M${bx + 18},${ey - 20} H${bx + bw - 6} L${bx + bw - 7.5},${ey - 17} H${bx + 17} Z" fill="#ffffff" opacity=".18"/>
<path fill="#ffffff" d="${ex.d}"/>`;
    } else {
      const ex = textC(sansBold, "EXPRESS", 27, W7 / 2, ey, 15);
      const half = ex.w / 2 + 22;
      body += `<path fill="${acc}" d="${ex.d}"/>
<rect x="${W7 / 2 - half - 64}" y="${ey - 0.7}" width="64" height="1.4" fill="${gold}"/><rect x="${W7 / 2 + half}" y="${ey - 0.7}" width="64" height="1.4" fill="${gold}"/>
<path d="${diamond(W7 / 2 - half - 70, ey, 3)}${diamond(W7 / 2 + half + 70, ey, 3)}" fill="${gold}"/>`;
    }
    const sl = textC(sloganFont, slogan, 17, W7 / 2, ey + 42);
    body += `<path fill="#3b4660" d="${sl.d}"/>`;
  } else {
    const exSize = 28;
    const exW = exT === "tag" ? width(sansBold, "EXPRESS", exSize, 5) + 36 : width(sansBold, "EXPRESS", exSize, 9) + 30;
    const size = fit(k, name, 104, W7 - 84 - exW);
    const w = width(k, name, size);
    const total = w + 26 + exW;
    const x0 = (W7 - total) / 2;
    const base = 158 + capH(k, size) / 2 - 10;
    const t = text(k, name, size, x0, base);
    b = { x: x0, y: base - capH(k, size), w, h: capH(k, size), base };
    body += `<path fill="${ink}" d="${t.d}"/>`;
    const ex0 = x0 + w + 26;
    const ecy = base - capH(k, size) / 2;
    if (exT === "tag") {
      const ex = text(sansBold, "EXPRESS", exSize, ex0 + 18, ecy + capH(sansBold, exSize) / 2, 5);
      body += `<rect x="${ex0}" y="${ecy - 25}" width="${exW}" height="50" fill="${acc}"/><rect x="${ex0 + 4}" y="${ecy - 21}" width="${exW - 8}" height="42" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/><path fill="#ffffff" d="${ex.d}"/>`;
    } else if (exT === "divider") {
      const ex = text(sansBold, "EXPRESS", exSize, ex0 + 20, ecy + capH(sansBold, exSize) / 2, 9);
      body += `<rect x="${ex0 + 2}" y="${b.y - 4}" width="4" height="${b.h + 8}" fill="${gold}"/><path fill="${acc}" d="${ex.d}"/>`;
    } else {
      const ex = text(sansBold, "EXPRESS", exSize, ex0 + 26, ecy + capH(sansBold, exSize) / 2, 9);
      body += `<path d="M${ex0 + 12},${b.y - 6} h12 L${ex0 + 6},${b.base + 6} h-12 Z" fill="${acc}"/><path fill="${ink}" d="${ex.d}"/>`;
    }
    const low = motif === "waves" || motif === "river" ? 18 : 0;
    const sl = text(sloganFont, slogan, 17, x0 + 2, base + 48 + low);
    body += `${low ? "" : `<rect x="${x0 + 2}" y="${base + 22}" width="44" height="1.4" fill="${gold}"/>`}<path fill="#3b4660" d="${sl.d}"/>`;
  }

  const m = M7[motif](b, id, s);
  body = motif === "swoosh" ? m + body : body + m;
  return defs(id, s) + body;
}

const made7 = [];
for (const [state, cfg] of Object.entries(S)) {
  const s = SITES[state];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W7} ${H7}" width="${W7}" height="${H7}" role="img" aria-label="${s.name}"><title>${s.name} — ${cfg[6]}</title>\n${logo7(s, cfg)}\n</svg>\n`;
  if (svg.includes("NaN")) throw new Error(`NaN in ${state}`);
  fs.writeFileSync(path.join(OUT7, `${s.slug}.svg`), svg);
  made7.push({ ...s, slogan: cfg[6] });
}
if (made7.length !== 50) throw new Error(`made ${made7.length}`);
made7.sort((a, b) => a.state.localeCompare(b.state));
const cards7 = made7
  .map((s) => `<figure><div class="logo"><img src="data:image/svg+xml;base64,${fs.readFileSync(path.join(OUT7, s.slug + ".svg")).toString("base64")}" alt="${s.name}"></div>
<figcaption><b>${s.name}</b><span>${s.domain}</span></figcaption></figure>`)
  .join("\n");
fs.writeFileSync(
  path.join(HERE, "logouri-sua-v7.html"),
  `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sigle SUA premium</title>
<style>:root{--bg:#e6e3dc;--card:#fff;--ink:#111;--mute:#6b6b6b}
body{margin:0;background:var(--bg);font-family:Arial,sans-serif;color:var(--ink)}
header{padding:28px 16px 8px;max-width:1240px;margin:0 auto}h1{margin:0 0 6px;font-size:24px}p{margin:0;color:var(--mute);font-size:14px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px;padding:16px;max-width:1240px;margin:0 auto}
figure{margin:0;background:var(--card)}.logo{padding:10px 16px}.logo img{width:100%;height:auto;display:block}
figcaption{padding:8px 14px 12px;display:flex;flex-direction:column;gap:2px;font-size:13px;border-top:1px solid #eee}figcaption span{color:var(--mute)}</style></head>
<body><header><h1>50 de sigle, varianta premium</h1><p>Stilul rețelei Expres, cu elemente desenate, accente aurii și slogan cursiv.</p></header><main>${cards7}</main></body></html>`
);
console.log(`v7 made ${made7.length}`);
