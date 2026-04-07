import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, s.name as site_name, s.slug as site_slug
       FROM articles a JOIN sites s ON a.site_id = s.id
       WHERE a.id = $1`,
      [params.id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ article: rows[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, content, summary, category, author, featured_image } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { rows } = await pool.query(
      `UPDATE articles
       SET title = $1, slug = $2, content = $3, summary = $4, category = $5, author = $6, featured_image = $7
       WHERE id = $8
       RETURNING *`,
      [title, slug, content || "", summary || "", category || "general", author || "Staff Reporter", featured_image || "", params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, article: rows[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { rowCount } = await pool.query(`DELETE FROM articles WHERE id = $1`, [params.id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
