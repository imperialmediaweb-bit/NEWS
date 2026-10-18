"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  RefreshCw,
  Play,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

/**
 * Orders.
 *
 * The API for this existed and the panel did not, so the only way to see a
 * paid campaign or start publishing it was to call the endpoint by hand. An
 * order nobody can see is an order nobody fulfils.
 */

interface Order {
  id: number;
  client: string;
  email: string;
  client_url: string;
  package: string;
  price: string;
  currency: string;
  paid: boolean;
  title: string | null;
  material: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
  published_count: number;
  reportUrl: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  publishing: "bg-indigo-100 text-indigo-800",
  published: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-600",
};

const NETWORK_SIZE = 49;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [copied, setCopied] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const secret = () =>
    typeof window === "undefined" ? "" : localStorage.getItem("cron_secret") || "";

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?key=${encodeURIComponent(secret())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setOrders(data.orders || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("cron_secret")) {
      const s = prompt("Enter CRON_SECRET to access orders:");
      if (s) localStorage.setItem("cron_secret", s);
    }
    load();
  }, [load]);

  /**
   * Publish an order across the network.
   *
   * The endpoint publishes a batch and reports what is left, so one press
   * would leave the job a fifth done and a client's report half empty. This
   * keeps calling until nothing remains, showing the count as it goes — and
   * stops on the first error rather than hammering a failing endpoint.
   */
  async function publish(orderId: number) {
    setBusy(orderId);
    setProgress("Starting…");
    try {
      for (let pass = 0; pass < 20; pass++) {
        const res = await fetch("/api/admin/orders/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: secret(),
            orderId,
            perRun: 10,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

        setProgress(
          `${data.publishedTotal} of ${NETWORK_SIZE} published` +
            (data.remaining > 0 ? ` — ${data.remaining} to go…` : " — done")
        );
        await load();
        if (!data.remaining || data.remaining <= 0) break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress("");
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(orderId: number, status: string) {
    setBusy(orderId);
    try {
      const res = await fetch(
        `/api/admin/orders?key=${encodeURIComponent(secret())}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orderId, status }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  function copyReport(o: Order) {
    if (!o.reportUrl) return;
    navigator.clipboard.writeText(`${window.location.origin}${o.reportUrl}`);
    setCopied(o.id);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-sm text-gray-500">
              Campaigns ordered from the network, and where each one has reached.
            </p>
          </div>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded p-4 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {progress && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 rounded p-4 text-sm">
          {progress}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-600">No orders yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Orders placed at <code>/order</code> on any of the sites appear here for
            review. Nothing is published until you press Publish.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                // The key belongs on the outermost element a map returns,
                // and a bare <> cannot carry one — each order renders two
                // rows, so without this React reconciles them by position and
                // an expanded panel follows the wrong order after a refresh.
                <Fragment key={o.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setOpen(open === o.id ? null : o.id)}
                        className="text-left"
                      >
                        <div className="font-medium">{o.client}</div>
                        <div className="text-gray-500 text-xs">{o.email}</div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.package}</div>
                      <div className="text-xs text-gray-500">
                        {o.price} {o.currency} · {o.paid ? "paid" : "unpaid"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          STATUS_STYLE[o.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent)]"
                            style={{
                              width: `${Math.min(
                                100,
                                (o.published_count / NETWORK_SIZE) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {o.published_count}/{NETWORK_SIZE}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.reportUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={o.reportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            open <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => copyReport(o)}
                            title="Copy the link to send the client"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {copied === o.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {o.status !== "published" && o.status !== "cancelled" && (
                        <button
                          onClick={() => publish(o.id)}
                          disabled={busy === o.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white rounded text-xs font-medium disabled:opacity-50"
                        >
                          <Play className="w-3 h-3" />
                          {busy === o.id ? "Publishing…" : "Publish"}
                        </button>
                      )}
                      {o.status === "pending_review" && (
                        <button
                          onClick={() => setStatus(o.id, "cancelled")}
                          disabled={busy === o.id}
                          className="ml-2 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <dt className="text-gray-500 uppercase tracking-wider mb-1">
                              Link to promote
                            </dt>
                            <dd className="break-all">{o.client_url}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500 uppercase tracking-wider mb-1">
                              Requested headline
                            </dt>
                            <dd>{o.title || "— we write one —"}</dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="text-gray-500 uppercase tracking-wider mb-1">
                              Material from the client
                            </dt>
                            <dd className="whitespace-pre-wrap text-gray-700">
                              {o.material || "—"}
                            </dd>
                          </div>
                          {o.notes && (
                            <div className="md:col-span-2">
                              <dt className="text-gray-500 uppercase tracking-wider mb-1">
                                Notes
                              </dt>
                              <dd className="text-gray-700">{o.notes}</dd>
                            </div>
                          )}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
