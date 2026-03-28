import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug") || "";

  try {
    const { rows } = await pool.query(
      "SELECT ga_measurement_id FROM sites WHERE slug = $1",
      [slug]
    );
    return NextResponse.json({
      gaId: rows[0]?.ga_measurement_id || null,
    });
  } catch {
    return NextResponse.json({ gaId: null });
  }
}
