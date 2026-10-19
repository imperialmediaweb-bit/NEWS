"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, RefreshCw } from "lucide-react";
import NewOrderForm from "./NewOrderForm";
import {
  STATUS_STYLE,
  STATUS_LABEL,
  Progress,
  NETWORK_SIZE,
  adminKey,
  promptForKey,
  type Order,
} from "./shared";

/**
 * The orders list.
 *
 * Only a list. The first version of this screen expanded each order in place,
 * which is exactly what the Romanian network's panel used to do and stopped
 * doing — its own comment records why: "with three orders the buttons of one
 * ended up beside the table of another, and that is where every confusion
 * came from". The work happens at /admin/orders/<id>.
 */
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders?key=${encodeURIComponent(adminKey())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setOrders(data.orders || []);
      setError("");
    } catch (e) {
      // A dropped request during a quiet refresh is not worth a banner.
      if (!quiet) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    promptForKey();
    load();
  }, [load]);

  // While a campaign is still going out, refresh on its own.
  useEffect(() => {
    const running = orders.some(
      (o) => o.status === "publishing" || (o.published_count > 0 && o.published_count < NETWORK_SIZE)
    );
    if (!running) return;
    const t = setInterval(() => load(true), 60000);
    return () => clearInterval(t);
  }, [orders, load]);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setCreating((v) => !v)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm font-bold"
          >
            {creating ? "Close" : "+ New campaign"}
          </button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        The order, the article, publication and the client&apos;s report — each
        campaign has its own page.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      {creating && (
        <NewOrderForm
          onSaved={(id) => router.push(`/admin/orders/${id}`)}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-600">No campaigns yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Press <strong>+ New campaign</strong> for one you sold yourself, or
            wait for an order placed at <code>/order</code> on any of the sites.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const running = o.published_count > 0 && o.published_count < NETWORK_SIZE;
            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="block border border-gray-200 rounded-lg bg-white px-4 py-3 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      STATUS_STYLE[o.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                  <span className="font-bold" title={o.client}>
                    {o.client.length > 70 ? `${o.client.slice(0, 70)}…` : o.client}
                  </span>
                  {/* The package, in the list. Five orders from the same client
                      in one batch look identical without it — a company name
                      and a long URL, and no way to tell them apart without
                      opening each one. */}
                  {o.package && (
                    <span
                      className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold"
                      title={o.package}
                    >
                      {o.package.length > 46 ? `${o.package.slice(0, 46)}…` : o.package}
                    </span>
                  )}
                  <span
                    className="text-xs text-gray-500 truncate max-w-[280px]"
                    title={o.client_url}
                  >
                    {o.client_url}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    {o.published_count
                      ? o.published_count >= NETWORK_SIZE
                        ? `${o.published_count} articles`
                        : `${o.published_count} of ${NETWORK_SIZE} published`
                      : "not published"}
                    {o.price ? ` · $${o.price}` : ""}
                    {o.paid ? " · paid" : o.price ? " · UNPAID" : ""}
                  </span>
                </div>
                {running && (
                  <div className="mt-2">
                    <Progress total={NETWORK_SIZE} live={o.published_count} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
