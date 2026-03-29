import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: fetch all GA codes from DB
export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT slug, ga_measurement_id FROM sites WHERE ga_measurement_id IS NOT NULL AND ga_measurement_id != ''"
    );
    const codes: Record<string, string> = {};
    for (const row of rows) {
      codes[row.slug] = row.ga_measurement_id;
    }
    return NextResponse.json({ codes });
  } catch (e) {
    return NextResponse.json({ error: String(e), codes: {} });
  }
}

// POST: save GA codes for multiple sites
export async function POST(request: NextRequest) {
  try {
    const { codes } = await request.json();

    if (!codes || typeof codes !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    let updated = 0;
    for (const [slug, gaId] of Object.entries(codes)) {
      if (!gaId) continue;
      const { rowCount } = await pool.query(
        "UPDATE sites SET ga_measurement_id = $1 WHERE slug = $2",
        [gaId, slug]
      );
      if ((rowCount ?? 0) > 0) updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
