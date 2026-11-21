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


// v8: every state gets its own full palette — name ink, accent, metal —
// taken from its flag, landscape or emblems, so no two logos share colours.
const PAL = {
  Alabama: ["#2b0a12", "#a6192e", "gold"],
  Alaska: ["#0b2545", "#e0a100", "silver"],
  Arizona: ["#5a1f0e", "#13959a", "copper"],
  Arkansas: ["#1f3b2c", "#b22234", "gold"],
  California: ["#0d3b66", "#e8833a", "gold"],
  Colorado: ["#12355b", "#c8102e", "gold"],
  Connecticut: ["#1b2a41", "#5f8a63", "gold"],
  Delaware: ["#23395b", "#b48a4a", "gold"],
  Florida: ["#005f73", "#e5603f", "gold"],
  Georgia: ["#3a1c14", "#e07a5f", "copper"],
  Hawaii: ["#003c5a", "#d6336c", "gold"],
  Idaho: ["#2d3a1f", "#c58b2a", "copper"],
  Illinois: ["#111111", "#0066cc", "silver"],
  Indiana: ["#0b1f3a", "#d9a300", "silver"],
  Iowa: ["#222222", "#d19a00", "gold"],
  Kansas: ["#1d3557", "#e9b10c", "gold"],
  Kentucky: ["#0b2a6f", "#2e8b57", "gold"],
  Louisiana: ["#3c1361", "#c9a227", "gold"],
  Maine: ["#0f2b3d", "#2e7d32", "silver"],
  Maryland: ["#111111", "#d23b2d", "gold"],
  Massachusetts: ["#14213d", "#8b1e2d", "gold"],
  Michigan: ["#00274c", "#e0a800", "silver"],
  Minnesota: ["#0e3b43", "#3a86c0", "silver"],
  Mississippi: ["#2c2c54", "#a5636f", "gold"],
  Missouri: ["#3d0c11", "#1f6f8b", "copper"],
  Montana: ["#1b3a4b", "#d18a04", "gold"],
  Nebraska: ["#4a0d0d", "#c99a3b", "gold"],
  Nevada: ["#1c1c1c", "#7b2cbf", "silver"],
  "New Hampshire": ["#233d2b", "#8c1c13", "silver"],
  "New Jersey": ["#2f2f2f", "#c79a2e", "gold"],
  "New Mexico": ["#7a0019", "#e6a800", "gold"],
  "New York": ["#0a0a0a", "#f05a28", "gold"],
  "North Carolina": ["#13294b", "#3f8fc8", "silver"],
  "North Dakota": ["#2a3d24", "#c9971f", "gold"],
  Ohio: ["#1a1a1a", "#bb0000", "silver"],
  Oklahoma: ["#1d4e6b", "#c75b12", "copper"],
  Oregon: ["#154734", "#c9a000", "gold"],
  Pennsylvania: ["#1f2a44", "#a8551a", "gold"],
  "Rhode Island": ["#0c2340", "#0097a0", "gold"],
  "South Carolina": ["#0b2340", "#6c9a4f", "silver"],
  "South Dakota": ["#3b2a1a", "#2f6690", "gold"],
  Tennessee: ["#232323", "#f07800", "silver"],
  Texas: ["#002868", "#bf0a30", "silver"],
  Utah: ["#4a1c0c", "#d9480f", "copper"],
  Vermont: ["#0b3d20", "#b23a1e", "gold"],
  Virginia: ["#1b1f3b", "#8c1d40", "gold"],
  Washington: ["#0f3d2e", "#3c9a5f", "silver"],
  "West Virginia": ["#1e2a3a", "#d99d00", "gold"],
  Wisconsin: ["#3e2723", "#c5050c", "gold"],
  Wyoming: ["#3d2b1f", "#b71c1c", "copper"],
};
const METAL = {
  gold: ["#e3c98f", "#b98d4e", "#8c6630"],
  silver: ["#e6e8ec", "#a7adb7", "#6e7480"],
  copper: ["#f0b48a", "#b86b3c", "#7d3f1c"],
};
if (Object.keys(PAL).length !== 50) throw new Error("palette count");
for (const [st, p] of Object.entries(PAL)) {
  const s = SITES[st];
  if (!s) throw new Error(`no site ${st}`);
  s.c1 = p[1];
  s.ink = p[0];
  s.metal = METAL[p[2]];
}

// ── v9: one small single-colour symbol per state ──
// Custom drawings are in a 100×100 box; phosphor icons are reused where a
// good one exists. Every symbol is drawn in one colour (white only cuts out).
const WHITE = "#ffffff";
const box = (x, y, size, inner) => `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(size / 100)})">${inner}</g>`;
const ph = (name) => {
  const svg = fs.readFileSync(NM(`@phosphor-icons/core/assets/fill/${name}-fill.svg`), "utf8");
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect width="256" height="256" fill="none"\/>/, "");
};
const phBox = (name, c) => `<g transform="scale(${100 / 256})" fill="${c}">${ph(name)}</g>`;
const rot = (d, deg) => `<g transform="rotate(${deg} 50 50)">${d}</g>`;

const DRAW = {
  keystone: (c) => `<path d="M30,8 H70 L86,92 H14 Z" fill="${c}"/><path d="M35,16 H65 L77,84 H23 Z" fill="none" stroke="${WHITE}" stroke-width="2.5"/>`,
  tristar: (c) => `<circle cx="50" cy="50" r="46" fill="${c}"/><circle cx="50" cy="50" r="38" fill="none" stroke="${WHITE}" stroke-width="2.5"/><path d="${star(50, 30, 13)}${star(32, 61, 13)}${star(68, 61, 13)}" fill="${WHITE}"/>`,
  zia: (c) => {
    const rays = `<rect x="38" y="4" width="5" height="22" fill="${c}"/><rect x="45" y="0" width="5" height="26" fill="${c}"/><rect x="52" y="0" width="5" height="26" fill="${c}"/><rect x="59" y="4" width="5" height="22" fill="${c}"/>`;
    return `${[0, 90, 180, 270].map((a) => rot(rays, a)).join("")}<circle cx="50" cy="50" r="17" fill="none" stroke="${c}" stroke-width="7"/>`;
  },
  lonestar: (c) => `<path d="${star(50, 53, 47)}" fill="${c}"/>`,
  gateway: (c) => `<path d="M8,96 Q50,-78 92,96 L81,96 Q50,-52 19,96 Z" fill="${c}"/><rect x="0" y="94" width="100" height="4" fill="${c}"/>`,
  rockarch: (c) => `<path d="M6,96 C6,40 22,16 50,16 C78,16 94,40 94,96 H76 C76,56 66,38 50,38 C34,38 24,56 24,96 Z" fill="${c}"/><rect x="0" y="94" width="100" height="4" fill="${c}"/>`,
  fleur: (c) => `<path d="M50,4 C63,20 63,44 50,60 C37,44 37,20 50,4 Z
M45,60 C30,63 12,55 10,40 C9,27 22,21 30,30 C21,31 19,42 27,47 C33,51 40,52 46,49 Z
M55,60 C70,63 88,55 90,40 C91,27 78,21 70,30 C79,31 81,42 73,47 C67,51 60,52 54,49 Z
M28,58 H72 V67 H28 Z
M44,67 C42,79 34,87 25,92 H39 C46,86 48,78 50,72 C52,78 54,86 61,92 H75 C66,87 58,79 56,67 Z" fill="${c}"/>`,
  peach: (c) => `<path d="M50,32 C80,22 98,50 86,74 C76,95 50,97 50,97 C50,97 24,95 14,74 C2,50 20,22 50,32 Z" fill="${c}"/><path d="M50,36 C40,52 42,78 50,94" fill="none" stroke="${WHITE}" stroke-width="2.5"/><path d="M50,32 C55,13 71,5 86,8 C80,25 65,33 50,32 Z" fill="${c}"/><path d="M50,32 C48,24 46,18 42,12" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  maple: (c) => `<path d="M50,2 L57,20 L67,14 L64,36 L80,26 L77,40 L97,42 L85,54 L91,63 L66,62 L68,75 L54,68 L53,98 L47,98 L46,68 L32,75 L34,62 L9,63 L15,54 L3,42 L23,40 L20,26 L36,36 L33,14 L43,20 Z" fill="${c}"/>`,
  needle: (c) => `<rect x="48.6" y="0" width="2.8" height="18" fill="${c}"/><ellipse cx="50" cy="25" rx="31" ry="7" fill="${c}"/><ellipse cx="50" cy="20" rx="14" ry="4.5" fill="${c}"/><path d="M43,31 L37,96 H45 L50,42 L55,96 H63 L57,31 Z" fill="${c}"/><rect x="40" y="60" width="20" height="3" fill="${c}"/>`,
  derrick: (c) => `<path d="M30,96 L46,6 H54 L70,96 H62 L51,18 H49 L38,96 Z" fill="${c}"/><path d="M41,74 L59,74 M44,54 L56,54 M46,36 L54,36 M39,84 L58,62 M42,62 L57,44 M44,44 L55,28" stroke="${c}" stroke-width="2.6"/><rect x="22" y="93" width="56" height="5" fill="${c}"/>`,
  windmill: (c) => {
    let blades = "";
    for (let i = 0; i < 12; i++) blades += rot(`<path d="M50,26 L47,6 H53 Z" fill="${c}"/>`.replace(/50,26/, "50,26"), i * 30).replace('rotate(', 'rotate(').replace(' 50 50)', ' 50 26)');
    return `${blades}<circle cx="50" cy="26" r="5" fill="${c}"/><path d="M42,96 L48,30 H52 L58,96 H53 L50,40 L47,96 Z" fill="${c}"/><path d="M44,70 H56 M45,52 H55" stroke="${c}" stroke-width="2.5"/><path d="M56,26 L84,22 L84,32 Z" fill="${c}"/>`;
  },
  corn: (c) => {
    let k = "";
    for (let r = 0; r < 8; r++) for (let col = -1; col <= 1; col++) k += `<circle cx="${50 + col * 7}" cy="${22 + r * 8}" r="2.4" fill="${WHITE}"/>`;
    return `<ellipse cx="50" cy="50" rx="16" ry="40" fill="${c}"/>${k}<path d="M50,96 C30,84 20,60 26,36 C34,58 42,76 50,90 Z M50,96 C70,84 80,60 74,36 C66,58 58,76 50,90 Z" fill="${c}"/>`;
  },
  buckeye: (c) => `<circle cx="50" cy="54" r="42" fill="${c}"/><ellipse cx="42" cy="38" rx="20" ry="14" fill="${WHITE}" opacity=".85"/><ellipse cx="42" cy="38" rx="14" ry="9" fill="${c}" opacity=".35"/>`,
  sunflower: (c) => {
    let p = "";
    for (let i = 0; i < 16; i++) p += rot(`<ellipse cx="50" cy="16" rx="7" ry="16" fill="${c}"/>`, i * 22.5);
    let d = "";
    for (let i = 0; i < 10; i++) d += `<circle cx="${50 + 9 * Math.cos(i * 0.63)}" cy="${50 + 9 * Math.sin(i * 0.63)}" r="1.8" fill="${WHITE}"/>`;
    return `${p}<circle cx="50" cy="50" r="18" fill="${c}"/><circle cx="50" cy="50" r="15" fill="none" stroke="${WHITE}" stroke-width="1.6"/>${d}`;
  },
  northstar: (c) => `<path d="M50,0 L57,43 L100,50 L57,57 L50,100 L43,57 L0,50 L43,43 Z" fill="${c}"/><path d="M50,22 L54,46 L78,50 L54,54 L50,78 L46,54 L22,50 L46,46 Z" fill="${c}" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="4" fill="${WHITE}"/>`,
  coloradoC: (c) => `<path d="M80,24 A40,40 0 1 0 80,76 L70,67 A27,27 0 1 1 70,33 Z" fill="${c}"/><circle cx="50" cy="50" r="17" fill="${c}"/>`,
  dipper: (c) => `<path d="${[[8, 62], [24, 56], [38, 58], [50, 66], [52, 84], [74, 88], [78, 70]].map(([x, y]) => star(x, y, 8.5)).join("")}${star(84, 18, 15)}" fill="${c}"/>`,
  arkansas: (c) => `<path d="M50,2 L98,50 L50,98 L2,50 Z M50,14 L86,50 L50,86 L14,50 Z" fill="${c}" fill-rule="evenodd"/><path d="${star(50, 34, 7)}${star(34, 58, 7)}${star(66, 58, 7)}${star(50, 64, 6)}" fill="${c}"/>`,
  tophat: (c) => `<path d="M30,10 H70 L68,80 H32 Z" fill="${c}"/><rect x="31" y="64" width="38" height="7" fill="${WHITE}"/><ellipse cx="50" cy="84" rx="46" ry="9" fill="${c}"/>`,
  bison: (c) => `<path d="M4,66 C2,52 8,40 18,36 C22,22 36,14 50,16 C64,14 80,20 90,34 C96,42 97,54 94,62 L92,92 H84 L82,70 C74,72 64,72 56,70 L54,92 H46 L44,70 C38,70 32,72 28,74 L26,92 H18 L18,76 C12,76 6,72 4,66 Z" fill="${c}"/><path d="M16,40 C12,34 10,30 14,26" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><circle cx="14" cy="52" r="2.4" fill="${WHITE}"/>`,
  rushmore: (c) => `<path d="M0,96 L14,62 C16,46 26,40 31,50 C33,34 46,30 50,44 C53,30 66,28 70,42 C74,32 86,34 87,50 L100,96 Z" fill="${c}"/><path d="M26,58 v6 M45,54 v7 M64,52 v7 M80,58 v6" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round"/>`,
  palmetto: (c) => `<path d="M14,8 A20,20 0 1 0 34,40 A16,16 0 1 1 14,8 Z" fill="${c}"/><g transform="translate(30 10) scale(.7)">${phBox("tree-palm", c)}</g>`,
  mitten: (c, s) => `<path d="${outline("Michigan", 2, 2, 96, 96).d}" fill="${c}"/>`,
};

// state → [kind, name]: "d" custom drawing, "p" phosphor icon.
const SYM = {
  Alaska: ["d", "dipper"], Arizona: ["p", "cactus"], Arkansas: ["d", "arkansas"], California: ["p", "bridge"],
  Colorado: ["d", "coloradoC"], Delaware: ["p", "shield-star"], Florida: ["p", "tree-palm"], Georgia: ["d", "peach"],
  Hawaii: ["p", "flower-lotus"], Idaho: ["p", "fish"], Illinois: ["d", "tophat"], Indiana: ["p", "flag-checkered"],
  Iowa: ["d", "corn"], Kansas: ["d", "sunflower"], Kentucky: ["p", "horse"], Louisiana: ["d", "fleur"],
  Maine: ["p", "lighthouse"], Michigan: ["d", "mitten"], Minnesota: ["d", "northstar"], Mississippi: ["p", "flower"],
  Missouri: ["d", "gateway"], Montana: ["d", "bison"], Nebraska: ["d", "windmill"], Nevada: ["p", "sun-horizon"],
  "New Hampshire": ["p", "snowflake"], "New Jersey": ["p", "lightbulb"], "New Mexico": ["d", "zia"],
  "North Carolina": ["p", "bird"], "North Dakota": ["p", "grains"], Ohio: ["d", "buckeye"], Oklahoma: ["d", "derrick"],
  Oregon: ["p", "tree-evergreen"], "Rhode Island": ["p", "anchor"], "South Carolina": ["d", "palmetto"],
  "South Dakota": ["d", "rushmore"], Tennessee: ["d", "tristar"], Texas: ["d", "lonestar"], Utah: ["d", "rockarch"],
  Vermont: ["d", "maple"], Washington: ["d", "needle"], "West Virginia": ["p", "mountains"], Wisconsin: ["p", "cow"],
  Wyoming: ["p", "cowboy-hat"],
};
// Old Eastern states get the broadsheet treatment instead of a symbol.
const GOTHIC = new Set(["New York", "Pennsylvania", "Massachusetts", "Virginia", "Maryland", "Connecticut", "Alabama"]);
if (Object.keys(SYM).length + GOTHIC.size !== 50) throw new Error(`symbols ${Object.keys(SYM).length} + ${GOTHIC.size}`);

function symbol(state, x, y, size, c) {
  const [kind, name] = SYM[state];
  return box(x, y, size, kind === "p" ? phBox(name, c) : DRAW[name](c));
}

// Inks that were close to black get a colour of their own.
Object.assign(PAL, {
  Illinois: ["#22305e", "#0066cc", "silver"],
  Iowa: ["#3d2f12", "#d19a00", "gold"],
  Ohio: ["#40161a", "#bb0000", "silver"],
  Tennessee: ["#3a2316", "#f07800", "silver"],
  Nevada: ["#2e2a3d", "#7b2cbf", "silver"],
  "New Jersey": ["#1f3a3d", "#c79a2e", "gold"],
});
for (const [st, p] of Object.entries(PAL)) {
  SITES[st].c1 = p[1];
  SITES[st].ink = p[0];
  SITES[st].metal = METAL[p[2]];
}

// ════════════ v7: premium pass on the Expres-style logos ════════════
// Same structure as v6. Motifs are drawn and shaded rather than outlined,
// ornaments carry a metallic gold, the name and banners get quiet gradients,
// EXPRESS is set between hairlines, the slogan in an italic serif.
const OUT7 = path.join(HERE, "svg9");
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
<linearGradient id="${id}ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tintC(s.ink, 0.16)}"/><stop offset="1" stop-color="${shade(s.ink, 0.1)}"/></linearGradient>
<linearGradient id="${id}acc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tintC(s.c1, 0.12)}"/><stop offset="1" stop-color="${shade(s.c1, 0.22)}"/></linearGradient>
<linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.metal[0]}"/><stop offset=".5" stop-color="${s.metal[1]}"/><stop offset="1" stop-color="${s.metal[2]}"/></linearGradient>
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
  if (GOTHIC.has(s.state)) return gothic(s, cfg);
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
    const ey = b.base + 48;
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
    body += `<path fill="${tintC(s.ink, 0.28)}" d="${sl.d}"/>`;
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
    const low = 0;
    const sl = text(sloganFont, slogan, 17, x0 + 2, base + 48 + low);
    body += `${low ? "" : `<rect x="${x0 + 2}" y="${base + 22}" width="44" height="1.4" fill="${gold}"/>`}<path fill="${tintC(s.ink, 0.28)}" d="${sl.d}"/>`;
  }

  // The state's symbol, small and in one colour, between metal hairlines.
  const sz = 46;
  if (!horizontal) {
    const cx = W7 / 2, top = Math.max(8, b.y - 16 - sz);
    body += symbol(s.state, cx - sz / 2, top, sz, acc);
    const ry = top + sz / 2;
    body += `<rect x="${cx - sz / 2 - 74}" y="${ry - 0.6}" width="62" height="1.2" fill="${gold}"/><rect x="${cx + sz / 2 + 12}" y="${ry - 0.6}" width="62" height="1.2" fill="${gold}"/>
<path d="${diamond(cx - sz / 2 - 78, ry, 2.6)}${diamond(cx + sz / 2 + 78, ry, 2.6)}" fill="${gold}"/>`;
  } else {
    const top = Math.max(8, b.y - 14 - sz);
    body += symbol(s.state, b.x, top, sz, acc);
    body += `<rect x="${b.x + sz + 12}" y="${top + sz / 2 - 0.6}" width="96" height="1.2" fill="${gold}"/><path d="${diamond(b.x + sz + 112, top + sz / 2, 2.6)}" fill="${gold}"/>`;
  }
  return defs(id, s) + body;
}

const BL = reg("blackletter9", "unifrakturmaguntia", 400);
const EXI = reg("expressItalic9", "playfair-display", 800, "italic");
function gothic(s, cfg) {
  const id = s.slug.replace(/[^a-z]/g, "");
  const slogan = cfg[6];
  const name = `The ${s.state}`;
  const size = fit(BL, name, 92, W7 - 70);
  const a = textC(BL, name, size, W7 / 2, 100);
  const e = textC(EXI, "Express", 54, W7 / 2, 184);
  const sx = W7 / 2 - e.w / 2 - 22, sx2 = W7 / 2 + e.w / 2 + 22;
  const sl = textC(sloganFont, slogan, 17, W7 / 2, 246);
  return defs(id, s) + `<path fill="url(#${id}ink)" d="${a.d}"/>
<path fill="url(#${id}acc)" d="${e.d}"/>
<path d="${star(sx, 178, 7)}${star(sx - 20, 178, 5)}${star(sx2, 178, 7)}${star(sx2 + 20, 178, 5)}" fill="url(#${id}ink)"/>
<rect x="${W7 / 2 - 150}" y="216" width="300" height="2" fill="url(#${id}gold)"/><rect x="${W7 / 2 - 150}" y="220.5" width="300" height="0.7" fill="url(#${id}gold)"/>
<path fill="${tintC(s.ink, 0.28)}" d="${sl.d}"/>`;
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
  path.join(HERE, "logouri-sua-v9.html"),
  `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sigle SUA premium</title>
<style>:root{--bg:#e6e3dc;--card:#fff;--ink:#111;--mute:#6b6b6b}
body{margin:0;background:var(--bg);font-family:Arial,sans-serif;color:var(--ink)}
header{padding:28px 16px 8px;max-width:1240px;margin:0 auto}h1{margin:0 0 6px;font-size:24px}p{margin:0;color:var(--mute);font-size:14px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px;padding:16px;max-width:1240px;margin:0 auto}
figure{margin:0;background:var(--card)}.logo{padding:10px 16px}.logo img{width:100%;height:auto;display:block}
figcaption{padding:8px 14px 12px;display:flex;flex-direction:column;gap:2px;font-size:13px;border-top:1px solid #eee}figcaption span{color:var(--mute)}</style></head>
<body><header><h1>50 de sigle, varianta finală</h1><p>Paletă proprie, simbolul statului mic și într-o singură culoare, gotic la statele istorice.</p></header><main>${cards7}</main></body></html>`
);
console.log(`v7 made ${made7.length}`);
