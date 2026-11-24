import type { RewriteResult } from "@/lib/pipeline/rewriter";

/**
 * Names and numbers must match the source exactly.
 *
 * The rewriting model sometimes "corrects" an unusual spelling to a more
 * common one (Moffett → Moffitt) or replaces a figure with one it remembers
 * (16,000 → 12,000). Readers, and the people written about, notice; a PR firm
 * asked for exactly those two corrections. This compares every number and
 * every name in the rewrite with the source text and lists what does not
 * appear there. The caller rewrites once more, then drops the story if it
 * still fails.
 */
const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/\s+/g, " ");
const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’‘]/g, "'").toLowerCase();

// capitalised words that are not names (sentence starts, days, months, titles, generic nouns)
const COMMON = new Set(("the a an and or but in on at for of to from by with after before during as this that these those it its he she they we his her their our " +
  "monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december " +
  "mr mrs ms dr gov governor sen senator rep representative mayor president sheriff chief police department county city state university college school " +
  "north south east west new st saint mount fort lake river street avenue road highway interstate park center county's state's city's " +
  "according officials residents local news express newsroom thanksgiving christmas easter halloween " +
  "united states america american americans nation national federal president association department office board council committee commission " +
  "key facts questions answered").split(" "));

export function factCheck(r: RewriteResult, source: string, allowed: string[] = []): string[] {
  // Title Case headlines ("Eureka Shootings Leaves Deputy") make every word look like a name:
  // their names are checked where they also appear in the body, so the title is left out then.
  const tw = r.title.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  const titleCase = tw.length >= 4 && tw.filter((w) => /^[A-Z]/.test(w)).length / tw.length > 0.6;
  const out = strip(`${titleCase ? "" : r.title}\n${r.summary}\n${r.content}`);
  const src = norm(strip(source));
  const extra = norm(allowed.join(" "));
  const problems: string[] = [];

  // numbers: 3+ digits, or anything with a comma, decimal point, % or $ — must be in the source
  const srcNums = new Set((src.match(/\d[\d,.]*/g) || []).map((n) => n.replace(/,/g, "").replace(/\.$/, "")));
  for (const m of out.match(/\$?\d[\d,]*(\.\d+)?%?/g) || []) {
    const n = m.replace(/[$%]/g, "").replace(/,/g, "").replace(/\.$/, "");
    if (!n || (n.length < 3 && !/[.,$%]/.test(m))) continue; // small counts are often written as words
    if (/^20[0-3]\d$/.test(n) && (srcNums.has(n) || extra.includes(n))) continue;
    if (srcNums.has(n) || extra.includes(n)) continue;
    const v = Number(n);
    if (Number.isFinite(v) && v > 0 && Array.from(srcNums).some((x) => { const y = Number(x); return y > 0 && Math.abs(y - v) / Math.max(y, v) < 0.01 && y !== v && String(y).length === String(v).length; })) continue;
    problems.push(`number ${m}`);
  }

  // names: runs of 2-4 capitalised words; every distinctive word must appear in the source
  const seen = new Set<string>();
  for (const m of out.match(/\b[A-Z][a-zA-Z'’.-]+(?:\s+(?:[A-Z]\.|[A-Z][a-zA-Z'’-]+)){1,3}\b/g) || []) {
    for (const w of m.split(/\s+/)) {
      const k = norm(w).replace(/['’]s$/, "").replace(/[.'’-]+$/, "");
      if (k.length < 3 || COMMON.has(k) || seen.has(k)) continue;
      seen.add(k);
      if (!new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(src) && !extra.includes(k)) problems.push(`name "${w}" (in "${m}")`);
    }
  }
  return Array.from(new Set(problems)).slice(0, 12);
}

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/**
 * Put the source's own spelling back: a capitalised word in the rewrite that is
 * not in the source but is one or two letters away from exactly one name in
 * the source (Moffitt → Moffett, Smethils → Smethills) is replaced by it.
 */
export function repairNames(r: RewriteResult, source: string): { rewrite: RewriteResult; fixed: string[] } {
  const srcWords = Array.from(new Set((strip(source).match(/\b[A-Z][a-zA-Z'’-]{2,}\b/g) || [])));
  const srcSet = new Set(srcWords.map((w) => w.toLowerCase()));
  const fixed: string[] = [];
  const fix = (text: string) => text.replace(/\b[A-Z][a-zA-Z'’-]{3,}\b/g, (w) => {
    if (srcSet.has(w.toLowerCase()) || COMMON.has(w.toLowerCase())) return w;
    const near = srcWords.filter((s) => s[0] === w[0] && lev(s.toLowerCase(), w.toLowerCase()) <= (w.length >= 7 ? 2 : 1));
    if (near.length !== 1) return w;
    fixed.push(`${w} → ${near[0]}`);
    return near[0];
  });
  const rewrite = { ...r, title: fix(r.title), summary: fix(r.summary), content: r.content.replace(/>([^<]+)</g, (_, t) => `>${fix(t)}<`) };
  return { rewrite, fixed: Array.from(new Set(fixed)) };
}

/** Durations the source never gave ("for several days", "for weeks"): a new claim about how long something lasts. */
export function inventedDurations(r: RewriteResult, source: string): string[] {
  const re = /\b(?:for\s+)?(?:several|a few|many|multiple)\s+(?:hours|days|weeks|months)\b|\bfor\s+(?:days|weeks|months)\b|\bindefinitely\b|\buntil further notice\b/gi;
  const src = norm(strip(source));
  return Array.from(new Set((strip(`${r.title} ${r.summary} ${r.content}`).match(re) || []).filter((p) => !src.includes(norm(p).replace(/^for\s+/, "")))));
}
