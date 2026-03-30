import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateOpinion } from "@/lib/pipeline/rewriter";
import { findImage } from "@/lib/pipeline/images";
import { publishArticle } from "@/lib/pipeline/publisher";
import { logRunStart, logRunEnd, isPipelineEnabled } from "@/lib/pipeline/scheduler";
import { FORBIDDEN_OPINION_TOPICS } from "@/config/feeds";
import { sites } from "@/config/sites";

function authCheck(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

function isForbiddenTopic(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return FORBIDDEN_OPINION_TOPICS.some((topic) => text.includes(topic));
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPipelineEnabled())) {
    return NextResponse.json({ message: "Pipeline disabled" });
  }

  // Check if opinion generation is enabled
  const { rows: configRows } = await pool.query(
    "SELECT value FROM pipeline_config WHERE key = 'opinion_enabled'"
  );
  if (configRows[0]?.value !== "true") {
    return NextResponse.json({ message: "Opinion generation disabled" });
  }

  const startTime = Date.now();
  const runId = await logRunStart("opinion");

  try {
    // Get trending topics from recent feed items (rewritten ones = real news)
    const { rows: topics } = await pool.query(
      `SELECT id, title, description, category FROM feed_items
       WHERE status = 'rewritten'
       AND category NOT IN ('crime', 'celebrity')
       AND created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 10`
    );

    // Filter out forbidden topics
    const safeTopics = topics.filter(
      (t) => !isForbiddenTopic(t.title, t.description || "")
    );

    if (safeTopics.length === 0) {
      await logRunEnd(runId, 0, 0, Date.now() - startTime);
      return NextResponse.json({ message: "No safe topics found", generated: 0 });
    }

    // Pick 1-2 random topics
    const shuffled = safeTopics.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);

    let generated = 0;
    let failed = 0;

    for (const topic of selected) {
      try {
        // Use first site for context
        const firstSite = Object.values(sites)[0];

        const rewrite = await generateOpinion(
          firstSite.name,
          firstSite.state,
          firstSite.city,
          topic.title,
          topic.description || ""
        );

        const image = await findImage(rewrite.suggestedImageQuery);

        await publishArticle({
          feedItemId: topic.id,
          rewrite,
          category: "opinion",
          sourceUrl: "",
          imageUrl: image?.url || null,
          scope: "national",
          state: null,
          author: "Opinion Desk",
        });

        generated++;
      } catch (error) {
        failed++;
        console.error("Opinion generation failed:", error);
      }
    }

    await logRunEnd(runId, generated, failed, Date.now() - startTime);

    return NextResponse.json({
      generated,
      failed,
      topicsConsidered: safeTopics.length,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    await logRunEnd(runId, 0, 0, Date.now() - startTime, String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
