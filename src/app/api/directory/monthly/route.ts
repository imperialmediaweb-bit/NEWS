import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { publishPaidOrder, type PaidOrder } from "@/lib/paid-publish";
import { ensurePaidTable } from "@/lib/paid";

/** Owner's one-click answer to the monthly article email: publish now, or skip this month. */
export const dynamic = "force-dynamic";

const page = (text: string) =>
  new NextResponse(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 16px;font-size:17px;line-height:1.5">${text}</body>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

// GET only shows a confirm button: mail scanners open links on their own, so the action needs a POST.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "", t = req.nextUrl.searchParams.get("t") || "", a = req.nextUrl.searchParams.get("a") === "skip" ? "skip" : "publish";
  const label = a === "skip" ? "Skip this month's article" : "Publish my article now";
  return page(`<form method="post"><input type="hidden" name="id" value="${id.replace(/\D/g, "")}"><input type="hidden" name="t" value="${t.replace(/[^a-f0-9]/g, "")}"><input type="hidden" name="a" value="${a}"><button style="font-size:17px;padding:12px 22px;border-radius:8px;border:0;background:#111;color:#fff;font-weight:bold">${label}</button></form>`);
}

export async function POST(req: NextRequest) {
  const f = await req.formData();
  const id = Number(f.get("id")), t = String(f.get("t") || ""), a = String(f.get("a") || "");
  if (!id || t.length < 20) return page("This link is not valid.");
  await ensurePaidTable();
  const { rows } = await pool.query(`SELECT * FROM paid_orders WHERE id = $1 AND product = 'monthly_article' AND owner_token = $2`, [id, t]);
  const o = rows[0] as (PaidOrder & { article_slug: string | null }) | undefined;
  if (!o) return page("This link is not valid.");
  if (o.status === "published") return page(`This article is already live. <a href="/${o.article_slug}">Read it</a>.`);
  if (o.status === "skipped") return page("You skipped this month's article. Next month's will arrive as usual.");
  if (a === "skip") {
    await pool.query(`UPDATE paid_orders SET status = 'skipped', auto_publish_at = NULL WHERE id = $1`, [id]);
    return page("Done, this month's article will not be published. Next month's will arrive as usual.");
  }
  if (a === "publish") {
    const slug = await publishPaidOrder(o);
    return page(slug ? `It's live. <a href="/${slug}">Read your article</a>.` : "We couldn't publish it right now. Please try again in a few minutes.");
  }
  return page("This link is not valid.");
}
