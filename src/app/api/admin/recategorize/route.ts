import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * File recent stories under the right section.
 *
 *   GET /api/admin/recategorize?key=CRON_SECRET&days=30&limit=400
 *
 * Every feed was configured as local-news, so every story landed there and
 * Politics, Business, Sports and Life stayed empty. New stories now get their
 * section from the rewrite (lib/pipeline/rewriter.ts); this files the recent
 * ones, a batch per call: titles and summaries go to the cheapest OpenAI model
 * fifty at a time, and the answer is checked against the fixed list.
 *
 * Only local-news stories are touched, and every change is recorded in
 * article_recategorized with the old section, so it can be undone. A story the
 * model judges not to be about its state is only flagged there, never
 * deleted. The article page 301s an old URL to the new section, so links keep
 * working.
 */
const SECTIONS = ["politics", "business", "sports", "life", "local-news"];
const BATCH = 50;
const MODEL = process.env.RECATEGORIZE_MODEL || "gpt-5-nano";

async function classify(state: string, items: Array<{ title: string; summary: string }>): Promise<Array<{ section: string; offtopic: boolean } | null>> {
  const list = items.map((a, i) => `${i + 1}. ${a.title} — ${a.summary.slice(0, 200)}`).join("\n");
  const prompt = `These are stories on a ${state} statewide news site. For each, give the section it belongs in and whether it is about ${state}.

Sections: "politics" (government, elections, legislation, officials, courts on public policy), "business" (companies, jobs, economy, energy, real estate, prices), "sports" (any sport at any level), "life" (food, arts, culture, events, holidays, travel, health and family features), "local-news" (crime, public safety, accidents, weather, schools, community and anything else).
"about" is true when the story concerns ${state}'s places, people, institutions or events or directly affects people in ${state}; false for a story about another country or state with no ${state} connection.

Stories:
${list}

Return ONLY JSON: {"r":[{"n":1,"s":"politics","about":true}, ...]} with one entry per story, in order.`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `OpenAI ${r.status}`);
  const parsed = JSON.parse(j.choices?.[0]?.message?.content || "{}");
  const out: Array<{ section: string; offtopic: boolean } | null> = items.map(() => null);
  for (const e of parsed.r || []) {
    const i = Number(e.n) - 1;
    if (i >= 0 && i < items.length && SECTIONS.includes(String(e.s))) out[i] = { section: String(e.s), offtopic: e.about === false };
  }
  return out;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "30", 10) || 30));
  const limit = Math.min(1000, Math.max(BATCH, parseInt(req.nextUrl.searchParams.get("limit") || "400", 10) || 400));

  await pool.query(`CREATE TABLE IF NOT EXISTS article_recategorized (
    article_id INTEGER PRIMARY KEY,
    old_category VARCHAR(100),
    new_category VARCHAR(100),
    offtopic BOOLEAN DEFAULT FALSE,
    done_at TIMESTAMP DEFAULT NOW()
  )`);

  const { rows } = await pool.query(
    `SELECT a.id, a.title, COALESCE(a.summary, '') AS summary, s.state
       FROM articles a JOIN sites s ON s.id = a.site_id
      WHERE a.category = 'local-news'
        AND a.published_at > NOW() - make_interval(days => $1)
        AND lower(COALESCE(a.author, '')) <> 'sponsored content'
        AND NOT EXISTS (SELECT 1 FROM article_recategorized r WHERE r.article_id = a.id)
      ORDER BY a.published_at DESC
      LIMIT $2`,
    [days, limit]
  );

  // Batches of one state each, so the prompt can name the state.
  const byState = new Map<string, typeof rows>();
  for (const r of rows) byState.set(r.state, [...(byState.get(r.state) || []), r]);
  const batches: Array<{ state: string; items: typeof rows }> = [];
  for (const [state, list] of Array.from(byState)) for (let i = 0; i < list.length; i += BATCH) batches.push({ state, items: list.slice(i, i + BATCH) });

  const counts: Record<string, number> = {};
  let offtopic = 0;
  let errors = 0;
  const examples: string[] = [];
  // Four batches at a time keeps a call under the request limit.
  for (let i = 0; i < batches.length; i += 4) {
    await Promise.all(
      batches.slice(i, i + 4).map(async (b) => {
        let res: Array<{ section: string; offtopic: boolean } | null>;
        try {
          res = await classify(b.state, b.items);
        } catch {
          errors++;
          return;
        }
        for (let k = 0; k < b.items.length; k++) {
          const a = b.items[k];
          const r = res[k];
          if (!r) continue;
          counts[r.section] = (counts[r.section] || 0) + 1;
          if (r.offtopic) offtopic++;
          if (r.section !== "local-news") {
            await pool.query("UPDATE articles SET category = $2 WHERE id = $1 AND category = 'local-news'", [a.id, r.section]);
            if (examples.length < 12) examples.push(`${r.section}: ${a.title}`);
          }
          await pool.query(
            "INSERT INTO article_recategorized (article_id, old_category, new_category, offtopic) VALUES ($1, 'local-news', $2, $3) ON CONFLICT (article_id) DO NOTHING",
            [a.id, r.section, r.offtopic]
          );
        }
      })
    );
  }

  const { rows: left } = await pool.query(
    `SELECT count(*)::int AS n FROM articles a
      WHERE a.category = 'local-news' AND a.published_at > NOW() - make_interval(days => $1)
        AND lower(COALESCE(a.author, '')) <> 'sponsored content'
        AND NOT EXISTS (SELECT 1 FROM article_recategorized r WHERE r.article_id = a.id)`,
    [days]
  );
  return NextResponse.json({ processed: rows.length, bySection: counts, offtopic, errors, remaining: left[0].n, examples });
}
