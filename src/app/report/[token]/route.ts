import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureOrdersSchema } from "@/lib/orders-schema";
import { excelFilename, orderExcel } from "@/lib/order-excel";

export const dynamic = "force-dynamic";

/**
 * The client's report, openable without a password.
 *
 * In the Romanian original the report button pointed at an /api/admin/ address,
 * so the link sent to a client answered "unauthorized" and the only way to
 * deliver it was to save the page as a PDF and send the file. Each order now
 * carries a random token and this address shows that order and nothing else.
 *
 *   /report/<token>
 *
 * A missing or wrong token returns 404 without saying whether it ever existed,
 * so the URL cannot be probed. The page is noindex,nofollow: it is one
 * client's document and has no business in search results.
 */
export async function GET(req: NextRequest, ctx: { params: { token: string } }) {
  const token = (ctx.params?.token || "").trim();

  // Short tokens are not ours; refuse without touching the database.
  if (token.length < 16) return notFound();

  await ensureOrdersSchema();

  const { rows } = await pool.query(
    `SELECT id, client, title, client_url, package, created_at, published_at, status
       FROM orders WHERE token = $1`,
    [token]
  );
  if (rows.length === 0) return notFound();

  const order = rows[0];

  const { rows: placements } = await pool.query(
    `SELECT p.site_slug, p.url, p.placed_at, a.title
       FROM order_placements p
       LEFT JOIN articles a ON a.id = p.article_id
      WHERE p.order_id = $1
      ORDER BY p.placed_at`,
    [order.id]
  );

  // Same token, same order, as a spreadsheet. A client who wants the links in
  // a file should not need a second address or a password for it.
  if (req.nextUrl.searchParams.get("format") === "xlsx") {
    const file = orderExcel(
      {
        client: String(order.client || ""),
        title: order.title as string | null,
        client_url: order.client_url as string | null,
        package: order.package as string | null,
        created_at: order.created_at as string | null,
        published_at: order.published_at as string | null,
      },
      placements.map((p) => ({
        site_slug: String(p.site_slug || ""),
        url: (p.url as string | null) ?? null,
        placed_at: (p.placed_at as string | null) ?? null,
        title: (p.title as string | null) ?? null,
      }))
    );
    return new NextResponse(Buffer.from(file), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${excelFilename(String(order.client || ""))}"`,
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(render(order, placements, token), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}

function notFound() {
  return new NextResponse("Report not found.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

function render(
  order: Record<string, unknown>,
  placements: Record<string, unknown>[],
  token: string
): string {
  const date = (v: unknown) =>
    v
      ? new Date(v as string).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  const rows = placements
    .map(
      (p) => `<tr>
        <td>${esc(String(p.site_slug || ""))}</td>
        <td>${esc(String(p.title || order.title || ""))}</td>
        <td><a href="${esc(String(p.url || "#"))}" target="_blank" rel="noopener">${esc(
          String(p.url || "")
        )}</a></td>
        <td class="date">${date(p.placed_at)}</td>
      </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Campaign report — ${esc(String(order.client || ""))}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
         max-width: 980px; margin: 0 auto; padding: 32px 20px; color: #111; line-height: 1.5; }
  h1 { font-size: 1.6rem; margin: 0 0 4px; }
  .sub { color: #666; margin-bottom: 28px; }
  .summary { display: flex; gap: 32px; flex-wrap: wrap; padding: 16px 0 24px;
             border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; margin-bottom: 24px; }
  .summary div span { display: block; font-size: .72rem; text-transform: uppercase;
                      letter-spacing: .08em; color: #888; margin-bottom: 2px; }
  .summary div strong { font-size: 1.25rem; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  th { text-align: left; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em;
       color: #888; border-bottom: 2px solid #e5e5e5; padding: 8px 10px 8px 0; }
  td { padding: 10px 10px 10px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  td a { color: #0b5ea8; word-break: break-all; }
  .date { white-space: nowrap; color: #777; }
  .download { margin: -8px 0 24px; }
  .download a { display: inline-block; background: #0b5ea8; color: #fff; text-decoration: none;
                padding: 9px 16px; border-radius: 6px; font-size: .88rem; font-weight: 600; }
  .download span { color: #888; font-size: .82rem; margin-left: 10px; }
  @media print { .download { display: none; } }
  footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e5e5;
           color: #777; font-size: .82rem; }
  @media print { body { padding: 0; } a { color: #111; } }
</style>
</head>
<body>
  <h1>Campaign report</h1>
  <p class="sub">${esc(String(order.client || ""))}${
    order.package ? ` · ${esc(String(order.package))}` : ""
  }</p>

  <div class="summary">
    <div><span>Published on</span><strong>${placements.length} sites</strong></div>
    <div><span>Ordered</span><strong>${date(order.created_at)}</strong></div>
    <div><span>First published</span><strong>${date(order.published_at)}</strong></div>
  </div>

  ${
    placements.length
      ? `<p class="download"><a href="/report/${esc(token)}?format=xlsx">Download as Excel</a>
         <span>every link, sortable, in one file</span></p>`
      : ""
  }

  ${
    placements.length === 0
      ? `<p>Publication is in progress. This page updates as each site goes live.</p>`
      : `<table>
    <thead><tr><th>Site</th><th>Headline</th><th>Link</th><th>Published</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
  }

  <footer>
    Every placement is published as clearly labelled sponsored content, and
    links to ${esc(String(order.client_url || "your site"))} are marked
    <code>rel="sponsored"</code> — which is what the advertising guidelines of
    search engines require of paid placements.
  </footer>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
