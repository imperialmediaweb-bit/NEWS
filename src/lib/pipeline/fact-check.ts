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
  "according officials residents local news express newsroom thanksgiving christmas easter halloween").split(" "));

export function factCheck(r: RewriteResult, source: string, allowed: string[] = []): string[] {
  const out = strip(`${r.title}\n${r.summary}\n${r.content}`);
  const src = norm(strip(source));
  const extra = norm(allowed.join(" "));
  const problems: string[] = [];

  // numbers: 3+ digits, or anything with a comma, decimal point, % or $ — must be in the source
  const srcNums = new Set((src.match(/\d[\d,.]*/g) || []).map((n) => n.replace(/,/g, "").replace(/\.$/, "")));
  for (const m of out.match(/\$?\d[\d,]*(\.\d+)?%?/g) || []) {
    const n = m.replace(/[$%]/g, "").replace(/,/g, "").replace(/\.$/, "");
    if (!n || (n.length < 3 && !/[.,$%]/.test(m))) continue; // small counts are often written as words
    if (/^20[0-3]\d$/.test(n) && (srcNums.has(n) || extra.includes(n))) continue;
    if (!srcNums.has(n) && !extra.includes(n)) problems.push(`number ${m}`);
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
