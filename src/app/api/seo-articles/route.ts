import { PLACEHOLDER_IMG } from "@/lib/homepage-data";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/** Map each SEO topic to DB category names and title keyword searches */
const topicMapping: Record<string, { categories: string[]; titleKeywords: string[] }> = {
  "weather-forecast": {
    categories: ["weather"],
    titleKeywords: ["weather", "storm", "hurricane", "tornado", "flood", "forecast", "blizzard", "heat wave", "cold front"],
  },
  "crime-reports": {
    categories: ["crime", "police", "courts"],
    titleKeywords: ["crime", "police", "arrest", "murder", "shooting", "robbery", "theft", "assault", "homicide", "suspect"],
  },
  "high-school-football": {
    categories: ["sports", "sport"],
    titleKeywords: ["high school football", "football", "touchdown", "quarterback", "playoff", "varsity", "friday night"],
  },
  "real-estate-market": {
    categories: ["business", "economy", "real estate"],
    titleKeywords: ["real estate", "housing", "home price", "mortgage", "property", "home sale", "housing market"],
  },
  "lottery-results": {
    categories: ["local-news", "local", "news"],
    titleKeywords: ["lottery", "powerball", "mega millions", "winning number", "jackpot", "lotto"],
  },
  "job-market": {
    categories: ["business", "economy"],
    titleKeywords: ["job", "hiring", "layoff", "unemployment", "employment", "workforce", "career", "employer"],
  },
  "traffic-updates": {
    categories: ["local-news", "local", "news"],
    titleKeywords: ["traffic", "road", "accident", "crash", "closure", "construction", "commute", "highway", "interstate"],
  },
  "school-closings": {
    categories: ["education", "local-news", "local"],
    titleKeywords: ["school", "closing", "delay", "cancellation", "dismissal", "district", "education"],
  },
  "gas-prices": {
    categories: ["business", "economy", "local-news"],
    titleKeywords: ["gas price", "fuel", "oil", "gasoline", "energy", "gas station", "petroleum"],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteSlug = searchParams.get("site") || "";
  let topic = searchParams.get("topic") || "";

  try {
    const { rows: siteRows } = await pool.query(
      "SELECT id FROM sites WHERE slug = $1",
      [siteSlug]
    );
    if (siteRows.length === 0) {
      return NextResponse.json({ articles: [] });
    }
    const siteId = siteRows[0].id;

    // If topic looks like "{city}-news", treat it as general local news
    const isCityNews = !topicMapping[topic] && topic.endsWith("-news");
    if (isCityNews) {
      topic = "city-news";
    }

    const mapping = topicMapping[topic] || {
      categories: ["local-news", "local", "news", "general"],
      titleKeywords: [],
    };

    // Build query: match by category OR by title keyword search
    const conditions: string[] = ["a.site_id = $1"];
    const params: (string | number)[] = [siteId];
    let paramIdx = 2;

    // Category condition
    const catPlaceholders = mapping.categories
      .map(() => `$${paramIdx++}`)
      .join(", ");
    const categoryCondition = `a.category IN (${catPlaceholders})`;
    params.push(...mapping.categories);

    // Title keyword ILIKE conditions
    const titleConditions = mapping.titleKeywords.map((kw) => {
      params.push(`%${kw}%`);
      return `a.title ILIKE $${paramIdx++}`;
    });

    const searchClause =
      titleConditions.length > 0
        ? `(${categoryCondition} OR ${titleConditions.join(" OR ")})`
        : categoryCondition;

    conditions.push(searchClause);

    const query = `
      SELECT a.id, a.title, a.slug, a.summary, a.featured_image, a.category, a.author, a.published_at, a.views FROM articles a
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.published_at DESC
      LIMIT 30
    `;

    const { rows } = await pool.query(query, params);

    const articles = rows.map((row: Record<string, unknown>) => ({
      img:
        (row.featured_image as string) ||
        PLACEHOLDER_IMG,
      title: row.title as string,
      summary: (row.summary as string) || "",
      category: (row.category as string) || "News",
      date: new Date(row.published_at as string).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      author: (row.author as string) || "Staff Reporter",
      slug: row.slug as string,
    }));

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
