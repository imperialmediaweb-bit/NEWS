import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { dirSchema, applyClaim } from "@/lib/directory";
import { siteSchema } from "@/lib/business-site";

/** Directory admin: approve claims and free listings, hide abusive reviews, see imports. Behind the admin login. */
export const dynamic = "force-dynamic";

/** "google.com → /directory/austin" style label from the saved source JSON. */
function srcLabel(raw: string): string {
  try {
    const j = JSON.parse(raw) as { ref?: string; landing?: string };
    const host = (u?: string) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } };
    let land = ""; try { const u = new URL(j.landing || ""); land = u.pathname + (u.search.includes("utm_") ? u.search : ""); } catch { /* none */ }
    return `${host(j.ref) || "direct / unknown"}${land ? ` → ${land}` : ""}`;
  } catch { return raw.slice(0, 120); }
}

async function act(fd: FormData) {
  "use server";
  await dirSchema();
  const id = Number(fd.get("id")), action = String(fd.get("action"));
  if (action === "approve" && await applyClaim(id)) await pool.query(`UPDATE business_claims SET reviewed_by = 'admin', reviewed_at = now() WHERE id = $1`, [id]);
  if (action === "reject") {
    const { rows } = await pool.query(`UPDATE business_claims SET status = 'rejected', reviewed_by = 'admin', reviewed_at = now() WHERE id = $1 RETURNING business_id`, [id]);
    if (rows[0]) await pool.query(`UPDATE businesses SET status = 'hidden' WHERE id = $1 AND status = 'pending'`, [rows[0].business_id]);
  }
  if (action === "remove-biz" || action === "keep-biz") {
    const { rows } = await pool.query(`UPDATE business_removals SET status = $2 WHERE id = $1 AND status = 'pending' RETURNING business_id`, [id, action === "remove-biz" ? "removed" : "kept"]);
    if (rows[0] && action === "remove-biz") await pool.query(`UPDATE businesses SET status = 'hidden', updated_at = now() WHERE id = $1`, [rows[0].business_id]);
  }
  if (action === "hide-review") {
    const { rows } = await pool.query(`UPDATE business_reviews SET hidden = TRUE WHERE id = $1 AND NOT hidden AND verified RETURNING business_id, rating`, [id]);
    if (rows[0]) await pool.query(`UPDATE businesses SET rating_sum = rating_sum - $2, rating_count = GREATEST(rating_count - 1, 0) WHERE id = $1`, [rows[0].business_id, rows[0].rating]);
  }
  revalidatePath("/admin/directory");
}

export default async function DirectoryAdmin() {
  await dirSchema();
  await siteSchema();
  const [{ rows: removals }, { rows: claims }, { rows: reviews }, { rows: imports }, { rows: totals }] = await Promise.all([
    pool.query(`SELECT r.*, b.name AS biz, b.city, b.slug, b.site_slug, b.tier FROM business_removals r JOIN businesses b ON b.id = r.business_id WHERE r.status = 'pending' ORDER BY r.created_at DESC`),
    pool.query(`SELECT c.*, b.name AS current_name, b.slug, b.status AS biz_status,
                       (SELECT COUNT(*)::int FROM business_claims x WHERE lower(x.name) = lower(c.name) AND x.created_at > now() - interval '7 days') AS by_same
                  FROM business_claims c JOIN businesses b ON b.id = c.business_id WHERE c.status = 'pending' AND c.order_id IS NULL ORDER BY c.created_at DESC LIMIT 100`),
    pool.query(`SELECT r.id, r.rating, r.body, r.name, r.created_at, b.name AS biz, b.slug, b.site_slug FROM business_reviews r JOIN businesses b ON b.id = r.business_id WHERE r.verified AND NOT r.hidden ORDER BY r.created_at DESC LIMIT 60`),
    pool.query(`SELECT * FROM directory_imports ORDER BY started_at DESC`),
    pool.query(`SELECT COUNT(*)::int n, COUNT(*) FILTER (WHERE claimed)::int claimed, COUNT(*) FILTER (WHERE tier <> 'free')::int paid FROM businesses`),
  ]);
  const { rows: inv } = await pool.query(`SELECT COUNT(*) FILTER (WHERE i.status = 'sent')::int sent, COUNT(*) FILTER (WHERE i.status = 'sent' AND b.claimed)::int claimed, COUNT(*) FILTER (WHERE i.status = 'sent' AND b.marketing_optout)::int optout FROM business_invites i JOIN businesses b ON b.id = i.business_id`).catch(() => ({ rows: [] as { sent: number; claimed: number; optout: number }[] }));
  // Every signup and claim of the last 30 days, with who decided and where it came from.
  const { rows: recent } = await pool.query(`
    SELECT c.id, c.site_slug, c.status, c.reviewed_by, c.created_at, c.source_info, c.data->>'name' AS name, c.data->>'city' AS city,
           b.slug, b.status AS biz_status, b.claimed, (b.source = 'owner') AS is_new
      FROM business_claims c JOIN businesses b ON b.id = c.business_id
     WHERE c.created_at > now() - interval '30 days' AND c.order_id IS NULL
     ORDER BY c.created_at DESC LIMIT 200`).catch(() => ({ rows: [] as Record<string, unknown>[] }));
  // Owner-run businesses (claimed, paid or with a website) — the ones worth watching.
  const { rows: owned } = await pool.query(`
    SELECT b.id, b.name, b.city, b.slug, b.site_slug, b.tier, b.claimed, b.status, b.owner_email, b.updated_at,
           s.slug AS web_slug, s.status AS web_status, s.plan AS web_plan, s.paid_until
    FROM businesses b LEFT JOIN business_sites s ON s.business_id = b.id
    WHERE b.claimed OR b.tier <> 'free' OR s.business_id IS NOT NULL
    ORDER BY b.updated_at DESC LIMIT 300`);
  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold">Business directory</h1>
      <p className="mt-1 text-sm text-gray-600">{totals[0]?.n ?? 0} businesses · {totals[0]?.claimed ?? 0} claimed · {totals[0]?.paid ?? 0} Spotlight. Paid Spotlights are in <a href="/admin/paid" className="underline">admin / paid</a>.</p>
      {inv[0] && <p className="text-sm text-gray-600">Invitations to imported businesses: {inv[0].sent} sent · {inv[0].claimed} claimed · {inv[0].optout} unsubscribed.</p>}

      <h2 className="mt-8 text-xl font-bold">Signups and claims, last 30 days ({recent.length})</h2>
      <p className="text-sm text-gray-600">Approved = live (auto = checked automatically, admin = by you). Rejected repeats are double submissions.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left"><th>Date</th><th>Business</th><th>Newspaper</th><th>Type</th><th>Status</th><th>Came from</th></tr></thead>
          <tbody>{recent.map((r) => {
            const dom = sites[String(r.site_slug)]?.domain;
            const st = r.status === "applied" ? `approved${r.reviewed_by ? ` (${r.reviewed_by})` : ""}` : r.status === "rejected" ? `rejected${r.reviewed_by ? ` (${r.reviewed_by})` : ""}` : String(r.status);
            return (
              <tr key={String(r.id)} className="border-t align-top">
                <td className="py-1 text-xs">{new Date(String(r.created_at)).toLocaleDateString("en-US")}</td>
                <td className="font-semibold">{r.status === "applied" && dom ? <a href={`https://${dom}/directory/listing/${r.slug}`} target="_blank" rel="noreferrer" className="underline">{String(r.name)}</a> : String(r.name)}<div className="text-xs font-normal text-gray-500">{String(r.city || "")}</div></td>
                <td>{sites[String(r.site_slug)]?.name || String(r.site_slug)}</td>
                <td>{r.is_new ? "new listing" : "claim"}</td>
                <td className={r.status === "applied" ? "text-green-700" : r.status === "rejected" ? "text-gray-500" : "font-bold text-amber-700"}>{st}</td>
                <td className="text-xs">{r.source_info ? srcLabel(String(r.source_info)) : "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      <h2 className="mt-8 text-xl font-bold">Owner businesses and websites ({owned.length})</h2>
      <p className="text-sm text-gray-600">Claimed, Spotlight or with a website. Website: draft = preview only, active = live and paid, past_due = payment failed, canceled = stopped.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left"><th>Business</th><th>Newspaper</th><th>Listing</th><th>Tier</th><th>Website</th><th>Owner</th></tr></thead>
          <tbody>{owned.map((b) => {
            const dom = sites[b.site_slug]?.domain;
            return (
              <tr key={b.id} className="border-t align-top">
                <td className="py-1 font-semibold">{b.name}<div className="text-xs font-normal text-gray-500">{b.city}</div></td>
                <td>{sites[b.site_slug]?.name || b.site_slug}</td>
                <td>{dom ? <a href={`https://${dom}/directory/listing/${b.slug}`} target="_blank" rel="noreferrer" className="underline">{b.status}</a> : b.status}{b.claimed ? " · claimed" : ""}</td>
                <td>{b.tier}</td>
                <td>{b.web_slug ? <><a href={`https://${dom}/b/${b.web_slug}`} target="_blank" rel="noreferrer" className="underline">{b.web_status}</a>{b.web_plan ? ` · ${b.web_plan}` : ""}</> : "—"}</td>
                <td className="text-xs">{b.owner_email || "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {!owned.length && <p className="text-sm text-gray-500">None yet.</p>}
      </div>

      <h2 className="mt-8 text-xl font-bold">Removal requests ({removals.length})</h2>
      <div className="mt-3 space-y-3">
        {removals.map((r) => (
          <form key={r.id} action={act} className="rounded border border-red-200 bg-white p-4">
            <p className="font-bold">{r.biz} · {r.city} · {sites[r.site_slug]?.name}{r.tier !== "free" ? " · ⚠ PAID SPOTLIGHT" : ""}</p>
            <p className="text-sm">From {r.name} &lt;{r.email}&gt;{r.reason ? `: ${r.reason}` : ""}</p>
            <input type="hidden" name="id" value={r.id} />
            <div className="mt-2 flex gap-2">
              <button name="action" value="remove-biz" className="rounded bg-red-700 px-4 py-1.5 text-sm font-bold text-white">Remove listing</button>
              <button name="action" value="keep-biz" className="rounded bg-gray-500 px-4 py-1.5 text-sm font-bold text-white">Keep</button>
            </div>
          </form>
        ))}
        {!removals.length && <p className="text-sm text-gray-500">None.</p>}
      </div>

      <h2 className="mt-8 text-xl font-bold">Claims and free listings to check ({claims.length})</h2>
      <div className="mt-3 space-y-3">
        {claims.map((c) => (
          <div key={c.id} className="rounded border bg-white p-4">
            <p className="text-xs uppercase text-gray-500">{sites[c.site_slug]?.name} · {c.biz_status === "pending" ? "NEW free listing" : `Claim of “${c.current_name}”`} · {new Date(c.created_at).toLocaleString("en-US")}</p>
            <p className="mt-1 font-bold">{c.data.name} · {c.data.category} · {c.data.city}</p>
            <p className="text-sm text-gray-700">{[c.data.address, c.data.phone, c.data.website, c.data.hours].filter(Boolean).join(" · ")}</p>
            {c.data.description && <p className="mt-1 text-sm">{c.data.description}</p>}
            <p className="mt-1 text-sm text-gray-600">From {c.name} &lt;{c.email}&gt;{c.by_same > 3 && <b className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">BULK: {c.by_same} listings from this sender in 7 days</b>}</p>
            {c.source_info && <p className="text-xs text-gray-500">Came from: {srcLabel(c.source_info)}</p>}
            <form action={act} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={c.id} />
              <button name="action" value="approve" className="rounded bg-green-700 px-4 py-1.5 text-sm font-bold text-white">Approve</button>
              <button name="action" value="reject" className="rounded bg-gray-600 px-4 py-1.5 text-sm font-bold text-white">Reject</button>
            </form>
          </div>
        ))}
        {!claims.length && <p className="text-sm text-gray-500">Nothing waiting.</p>}
      </div>

      <h2 className="mt-10 text-xl font-bold">Latest reviews</h2>
      <p className="text-sm text-gray-600">Hide only abuse, spam, threats or reviews that aren&apos;t about a real visit. Negative but honest reviews stay (FTC rules).</p>
      <div className="mt-3 space-y-2">
        {reviews.map((r) => (
          <form key={r.id} action={act} className="flex items-start justify-between gap-3 rounded border bg-white p-3 text-sm">
            <div><b>{"★".repeat(r.rating)}</b> <a href={`https://${sites[r.site_slug]?.domain}/directory/listing/${r.slug}`} className="underline">{r.biz}</a> · {r.name}<p className="mt-1">{r.body}</p></div>
            <input type="hidden" name="id" value={r.id} />
            <button name="action" value="hide-review" className="shrink-0 rounded bg-red-700 px-3 py-1 text-xs font-bold text-white">Hide</button>
          </form>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold">OpenStreetMap imports</h2>
      <table className="mt-3 w-full text-sm"><thead><tr className="text-left"><th>State</th><th>Status</th><th>Found</th><th>Saved</th><th>Started</th><th>Error</th></tr></thead>
        <tbody>{imports.map((i) => <tr key={i.state} className="border-t"><td>{i.state}</td><td>{i.status}</td><td>{i.found}</td><td>{i.saved}</td><td>{i.started_at ? new Date(i.started_at).toLocaleString("en-US") : ""}</td><td className="text-red-700">{i.error}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
