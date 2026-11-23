import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { ensurePaidTable, PRODUCTS, stripe, bannedReason, type Product } from "@/lib/paid";

export const dynamic = "force-dynamic";

/**
 * Paid sponsored stories and obituaries. Publish puts the customer's text on
 * the site as written, clearly labelled ("Sponsored" / obituary section);
 * Decline refunds the payment in full. Protected by the admin login.
 */
type Order = {
  id: number; site_slug: string; product: Product; title: string; body: string; business: string | null; website: string | null;
  name: string; email: string; photo_url: string | null; cents: number; status: string; stripe_session: string | null; created_at: string;
};

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slugify = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

async function act(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const action = String(formData.get("action"));
  await ensurePaidTable();
  const { rows } = await pool.query<Order>("SELECT * FROM paid_orders WHERE id = $1 AND status = 'paid'", [id]);
  const o = rows[0];
  if (!o) return;
  if (action === "publish") {
    const { rows: s } = await pool.query("SELECT id FROM sites WHERE slug = $1", [o.site_slug]);
    if (!s[0]) return;
    const sponsored = o.product === "sponsored" || o.product === "featured";
    const paras = o.body.split(/\n\s*\n/).map((p) => `<p>${esc(p.trim())}</p>`).join("\n");
    const content = sponsored
      ? `<p><em>Sponsored content from ${esc(o.business || o.name)}. ${esc(sites[o.site_slug]?.name || "")} was paid to publish it; the newsroom did not write it.</em></p>\n${paras}${o.website ? `\n<p><a href="${esc(o.website)}" rel="sponsored noopener" target="_blank">Visit ${esc(o.business || "the website")}</a></p>` : ""}`
      : paras;
    const slug = `${slugify(o.title)}-${o.id}`;
    const category = sponsored ? "sponsored" : "obituaries";
    await pool.query(
      `INSERT INTO articles (site_id, title, slug, content, summary, category, author, featured_image, published_at, source_url, auto_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),NULL,false) ON CONFLICT (site_id, slug) DO NOTHING`,
      [s[0].id, o.title, slug, content, o.body.slice(0, 155), category, sponsored ? "Sponsored Content" : "Obituary", o.photo_url]
    );
    await pool.query("UPDATE paid_orders SET status = 'published', article_slug = $2, published_at = now() WHERE id = $1", [id, `${category}/${slug}`]);
  } else if (action === "decline" && o.stripe_session) {
    const s = await fetch(`https://api.stripe.com/v1/checkout/sessions/${o.stripe_session}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }).then((r) => r.json());
    if (s.payment_intent) await stripe("refunds", { payment_intent: s.payment_intent });
    await pool.query("UPDATE paid_orders SET status = 'refunded' WHERE id = $1", [id]);
  }
  revalidatePath("/admin/paid");
}

export default async function PaidPage({ searchParams }: { searchParams: { status?: string } }) {
  await ensurePaidTable();
  const status = ["paid", "published", "refunded", "awaiting_payment"].includes(searchParams.status || "") ? searchParams.status! : "paid";
  const { rows } = await pool.query<Order>("SELECT * FROM paid_orders WHERE status = $1 ORDER BY created_at DESC LIMIT 100", [status]);
  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold">Paid placements</h1>
      <p className="mt-1 text-sm text-gray-600">Publish puts it on the site labelled as sponsored or as an obituary. Decline refunds the customer in full.</p>
      <nav className="mt-4 flex gap-3 text-sm">
        {["paid", "published", "refunded", "awaiting_payment"].map((s) => (
          <a key={s} href={`/admin/paid?status=${s}`} className={s === status ? "font-bold underline" : "text-blue-700"}>{s.replace("_", " ")}</a>
        ))}
      </nav>
      {rows.length === 0 && <p className="mt-8 text-gray-500">Nothing here.</p>}
      <div className="mt-6 space-y-6">
        {rows.map((o) => (
          <div key={o.id} className="rounded border border-gray-300 bg-white p-4">
            <div className="text-xs uppercase text-gray-500">#{o.id} · {PRODUCTS[o.product]?.name} · ${(o.cents / 100).toFixed(2)} · {sites[o.site_slug]?.name || o.site_slug} · {new Date(o.created_at).toLocaleString("en-US")}</div>
            <h2 className="mt-1 text-lg font-bold">{o.title}</h2>
            {bannedReason(o.title, o.body, o.business || "", o.website || "") && <p className="mt-1 rounded bg-red-100 p-2 text-sm font-bold text-red-800">⚠ Looks like {bannedReason(o.title, o.body, o.business || "", o.website || "")} — decline and refund.</p>}
            {o.business && <p className="text-sm">Business: <b>{o.business}</b>{o.website ? <> · <a href={o.website} target="_blank" rel="noreferrer" className="text-blue-700 underline">{o.website}</a></> : null}</p>}
            <p className="mt-2 whitespace-pre-wrap text-[15px]">{o.body}</p>
            {o.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.photo_url} alt="" className="mt-3 max-h-72 rounded" />
            )}
            <p className="mt-2 text-sm text-gray-700">From {o.name} &lt;{o.email}&gt;</p>
            {status === "paid" && (
              <form action={act} className="mt-4 flex gap-2">
                <input type="hidden" name="id" value={o.id} />
                <button name="action" value="publish" className="rounded bg-green-700 px-4 py-1.5 text-sm font-bold text-white">Publish</button>
                <button name="action" value="decline" className="rounded bg-gray-600 px-4 py-1.5 text-sm font-bold text-white">Decline &amp; refund</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
