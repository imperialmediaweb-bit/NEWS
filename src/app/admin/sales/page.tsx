import pool from "@/lib/db";
import { sites } from "@/config/sites";
import { PRODUCTS, type Product } from "@/lib/paid";
import { LEAD_CENTS } from "@/lib/quotes";

/** Every sale in one place: one-time orders, website subscriptions and paid customer contacts. Behind the admin login. */
export const dynamic = "force-dynamic";

type Row = { kind: string; what: string; who: string; site_slug: string; cents: number; at: string; status: string; link: string | null };
const PRICES: Record<string, Record<string, number>> = {
  standard: { month: Number(process.env.PRICE_SITE_MONTH_CENTS || 2900), year: Number(process.env.PRICE_SITE_YEAR_CENTS || 24900) },
  premium: { month: Number(process.env.PRICE_PREMIUM_MONTH_CENTS || 5900), year: Number(process.env.PRICE_PREMIUM_YEAR_CENTS || 54900) },
};
const $ = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default async function SalesAdmin() {
  const [{ rows: orders }, { rows: subs }, { rows: leads }] = await Promise.all([
    pool.query(`SELECT id, product, title, business, name, email, site_slug, cents, status, COALESCE(paid_at, created_at) AS at, article_slug FROM paid_orders
                 WHERE status IN ('paid', 'published', 'ended', 'refunded') AND cents > 0 ORDER BY COALESCE(paid_at, created_at) DESC LIMIT 500`).catch(() => ({ rows: [] })),
    pool.query(`SELECT s.business_id, s.status, s.plan, COALESCE(s.level, 'standard') AS level, s.updated_at AS at, s.slug, b.name, b.site_slug, b.owner_email
                  FROM business_sites s JOIN businesses b ON b.id = s.business_id WHERE s.stripe_subscription IS NOT NULL ORDER BY s.updated_at DESC LIMIT 500`).catch(() => ({ rows: [] })),
    pool.query(`SELECT q.unlocked_at AS at, b.name, b.site_slug, r.city FROM quote_sends q JOIN businesses b ON b.id = q.business_id JOIN quote_requests r ON r.id = q.quote_id
                 WHERE q.mode = 'teaser' AND q.unlocked_at IS NOT NULL ORDER BY q.unlocked_at DESC LIMIT 500`).catch(() => ({ rows: [] })),
  ]);
  const rows: Row[] = [
    ...orders.map((o) => ({ kind: "Order", what: `${PRODUCTS[o.product as Product]?.name || o.product}: ${o.title}`, who: `${o.business || o.name} <${o.email}>`, site_slug: o.site_slug, cents: o.cents, at: o.at, status: o.status, link: o.article_slug ? `https://${sites[o.site_slug]?.domain}/${o.article_slug}` : null })),
    ...subs.map((x) => ({ kind: "Website", what: `${x.level === "premium" ? "Premium" : "Standard"} ${x.plan === "year" ? "yearly" : "monthly"}`, who: `${x.name}${x.owner_email ? ` <${x.owner_email}>` : ""}`, site_slug: x.site_slug, cents: PRICES[x.level]?.[x.plan] || 0, at: x.at, status: x.status, link: `https://${sites[x.site_slug]?.domain}/b/${x.slug}` })),
    ...leads.map((l) => ({ kind: "Lead", what: `Customer contact (${l.city})`, who: l.name, site_slug: l.site_slug, cents: LEAD_CENTS, at: l.at, status: "paid", link: null })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const since = (d: number) => rows.filter((r) => r.kind !== "Website" && r.status !== "refunded" && +new Date(r.at) > Date.now() - d * 86400_000).reduce((a, r) => a + r.cents, 0);
  const active = subs.filter((x) => x.status === "active");
  const mrr = active.reduce((a, x) => a + Math.round((PRICES[x.level]?.[x.plan] || 0) / (x.plan === "year" ? 12 : 1)), 0);
  const card = (label: string, value: string, note?: string) => (
    <div className="rounded-xl bg-white p-4 shadow-sm"><p className="text-[12px] font-bold uppercase tracking-wider text-gray-500">{label}</p><p className="mt-1 text-[28px] font-black">{value}</p>{note && <p className="text-[12px] text-gray-500">{note}</p>}</div>
  );
  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="text-2xl font-bold">Sales</h1>
      <p className="mt-1 text-sm text-gray-600">Everything customers bought: one-time orders, website subscriptions and paid customer contacts. All of it is delivered automatically.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {card("Today", $(since(1)), "one-time")}{card("Last 7 days", $(since(7)), "one-time")}{card("Last 30 days", $(since(30)), "one-time")}
        {card("Websites active", String(active.length), `${active.filter((x) => x.level === "premium").length} Premium`)}{card("Monthly recurring", $(mrr), "from website plans")}
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="p-3">Date</th><th>Type</th><th>What</th><th>Customer</th><th>Newspaper</th><th className="text-right">Amount</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b align-top last:border-0">
                <td className="whitespace-nowrap p-3 text-xs">{new Date(r.at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td><span className={`rounded px-2 py-0.5 text-xs font-bold ${r.kind === "Website" ? "bg-indigo-100 text-indigo-800" : r.kind === "Lead" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{r.kind}</span></td>
                <td className="max-w-[320px] py-3">{r.link ? <a href={r.link} target="_blank" rel="noreferrer" className="underline">{r.what}</a> : r.what}</td>
                <td className="max-w-[220px] break-words py-3 text-xs">{r.who}</td>
                <td className="text-xs">{sites[r.site_slug]?.name || r.site_slug}</td>
                <td className="text-right font-bold">{$(r.cents)}{r.kind === "Website" ? <span className="font-normal text-gray-500">{r.what.includes("yearly") ? "/yr" : "/mo"}</span> : null}</td>
                <td className="p-3 text-xs">{r.status}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No sales yet. They will appear here the moment someone pays.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
