import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * Replace the invented personal bylines the pipeline used to assign with the
 * site's newsroom byline ("{Site name} Newsroom"). Touches only the names that
 * were on the old generated list; any other author is left alone.
 *   GET /api/admin/newsroom-bylines?key=CRON_SECRET            (count only)
 *   GET /api/admin/newsroom-bylines?key=CRON_SECRET&apply=1    (update)
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OLD_NAMES = ["Adrian Wells","Alex Sharma","Alicia Barnes","Amanda Foster","Andrew Stevens","Angela Davis","Ashley Morgan","Brandon Cruz","Brian Sullivan","Brittany Hall","Caroline Shaw","Catherine Banks","Chloe Rivera","Chris Donovan","Christopher Lee","Daniel Brooks","Daniel Kim","David Chen","David Park","Derek Williams","Diana Reyes","Diane Fletcher","Douglas Grant","Dylan Moore","Emily Richardson","Emma Russo","Ethan Price","Frank Doyle","Gabriella Fox","Gary Palmer","Gregory Stone","Hannah Phillips","Heather Quinn","Howard Klein","Ian Carter","Isabella Grant","Jake Morrison","James Whitfield","Jason Wu","Jeffrey Morgan","Jennifer Walsh","Jessica Lane","Jonathan Blake","Jordan Ellis","Katherine Nguyen","Kevin Chang","Kevin Murphy","Laura Martinez","Lauren Hayes","Linda Marsh","Lucas Webb","Marcus Johnson","Margaret Chen","Maria Gonzalez","Maria Rodriguez","Mark Fisher","Mason Clark","Megan Thompson","Melissa Green","Mia Rodriguez","Michael Torres","Michelle Wang","Monica Reeves","Natalie Herrera","Nathan Reed","Nicole Adams","Noah Patterson","Olivia Bennett","Patricia Coleman","Peter Lawson","Philip Reed","Priya Patel","Rachel Kim","Raymond Scott","Rebecca Hoffman","Richard Yang","Robert Chen","Robert Thompson","Ryan Cooper","Samantha Pierce","Sandra Vega","Sarah Mitchell","Sarah Nakamura","Simon Hayes","Sophia Turner","Staff Reporter","Stephanie Ross","Steven Keller","Teresa Burke","Thomas O'Brien","Tyler Jackson","Vanessa Cole","Victoria Cross","William Hart"];

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const match = "split_part(a.author, ',', 1) = ANY($1::text[])";
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM articles a WHERE ${match}`, [OLD_NAMES]);
  if (!req.nextUrl.searchParams.get("apply")) return NextResponse.json({ pending: rows[0].n });
  const res = await pool.query(
    `UPDATE articles a SET author = s.name || ' Newsroom' FROM sites s WHERE s.id = a.site_id AND ${match}`,
    [OLD_NAMES]
  );
  return NextResponse.json({ pending: rows[0].n, updated: res.rowCount });
}
