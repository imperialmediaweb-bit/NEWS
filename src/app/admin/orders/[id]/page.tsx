"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  STATUS_STYLE,
  STATUS_LABEL,
  Progress,
  NETWORK_SIZE,
  INPUT,
  LABEL,
  adminKey,
  promptForKey,
  when,
  type Order,
  type Placement,
} from "../shared";

/**
 * One campaign: everything that happens to it.
 *
 * The order as it arrived, the article, publication across the network, the
 * links as they appear, and the client's report link. The list stays a list;
 * all the controls live here, which is the arrangement the Romanian panel
 * arrived at after the combined screen became unusable.
 */
export default function OrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState("");
  const [copied, setCopied] = useState(false);
  const [edit, setEdit] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/orders?id=${id}&key=${encodeURIComponent(adminKey())}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        setOrder({
          ...data.order,
          published_count: (data.placements || []).length,
          reportUrl: data.order?.token ? `/report/${data.order.token}` : null,
        });
        setPlacements(data.placements || []);
        setError("");
      } catch (e) {
        if (!quiet) setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    promptForKey();
    if (id) load();
  }, [id, load]);

  /**
   * Publish across the network.
   *
   * The endpoint takes ten sites at a time and reports what is left, so one
   * call leaves the campaign a fifth done and the client's live report mostly
   * empty. This keeps going until nothing remains, and stops on the first
   * error rather than hammering a failing endpoint.
   */
  async function publish() {
    setBusy("publish");
    setProgress("Starting…");
    try {
      for (let pass = 0; pass < 20; pass++) {
        const res = await fetch("/api/admin/orders/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: adminKey(), orderId: id, perRun: 10 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        setProgress(
          `${data.publishedTotal} of ${NETWORK_SIZE} published` +
            (data.remaining > 0 ? ` — ${data.remaining} to go…` : " — done")
        );
        await load(true);
        if (!data.remaining || data.remaining <= 0) break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress("");
    } finally {
      setBusy("");
    }
  }

  async function patch(fields: Record<string, unknown>) {
    setBusy("save");
    try {
      const res = await fetch(
        `/api/admin/orders?key=${encodeURIComponent(adminKey())}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...fields }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      await load(true);
      setEdit(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!confirm("Delete this campaign? Only possible while nothing is published."))
      return;
    setBusy("delete");
    try {
      const res = await fetch(
        `/api/admin/orders?id=${id}&key=${encodeURIComponent(adminKey())}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      router.push("/admin/orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy("");
    }
  }

  function copyReport() {
    if (!order?.reportUrl) return;
    navigator.clipboard.writeText(`${window.location.origin}${order.reportUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!order)
    return (
      <div className="p-8">
        <p className="text-gray-600">Campaign not found.</p>
        <Link href="/admin/orders" className="text-[var(--accent)] text-sm">
          ← back to orders
        </Link>
      </div>
    );

  const live = placements.filter((p) => p.url).length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All campaigns
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">{order.client}</h1>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {STATUS_LABEL[order.status] || order.status}
        </span>
        <span className="text-sm text-gray-500">
          {order.price ? `$${order.price}` : ""}
          {order.paid ? " · paid" : order.price ? " · UNPAID" : ""}
        </span>
      </div>
      <a
        href={order.client_url}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-[var(--accent)] break-all hover:underline"
      >
        {order.client_url}
      </a>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Publication ───────────────────────────────────────────── */}
      <section className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-bold mb-3">Publication</h2>
        <Progress total={NETWORK_SIZE} live={live} big />

        {progress && (
          <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded p-2 mb-3">
            {progress}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {order.status !== "cancelled" && live < NETWORK_SIZE && (
            <button
              onClick={publish}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded font-bold text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {busy === "publish"
                ? "Publishing…"
                : live > 0
                  ? "Publish the remaining papers"
                  : "Publish across the network"}
            </button>
          )}

          {order.reportUrl && (
            <>
              <a
                href={order.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded text-sm"
              >
                Open the client report <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={copyReport}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy the link for the client
                  </>
                )}
              </button>
            </>
          )}

          {/* A cancelled campaign is not a dead end: the first version hid
              every button on one, leaving a row with an empty Actions column
              and no way to act on it. */}
          {order.status === "cancelled" ? (
            <button
              onClick={() => patch({ status: "pending_review" })}
              disabled={!!busy}
              className="px-4 py-2.5 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => patch({ status: "cancelled" })}
              disabled={!!busy}
              className="px-4 py-2.5 border border-gray-300 rounded text-sm text-gray-600 disabled:opacity-50"
            >
              Cancel campaign
            </button>
          )}

          <button
            onClick={() => patch({ paid: !order.paid })}
            disabled={!!busy}
            className="px-4 py-2.5 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Mark {order.paid ? "unpaid" : "paid"}
          </button>

          {live === 0 && (
            <button
              onClick={remove}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded text-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      </section>

      {/* ── The links ─────────────────────────────────────────────── */}
      <section className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-bold mb-3">
          Published links{" "}
          <span className="font-normal text-gray-500 text-sm">
            ({placements.length})
          </span>
        </h2>
        {placements.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing published yet. The client&apos;s report is empty until the
            first newspaper goes live.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <tr>
                <th className="py-2">Newspaper</th>
                <th className="py-2">Article</th>
                <th className="py-2">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {placements.map((p) => (
                <tr key={p.site_slug}>
                  <td className="py-2 font-medium">{p.site_slug}</td>
                  <td className="py-2">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:underline break-all"
                      >
                        {p.url.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                    {when(p.placed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── The order as it arrived ───────────────────────────────── */}
      <section className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">The brief</h2>
          <button
            onClick={() => setEdit((v) => !v)}
            className="text-sm text-[var(--accent)]"
          >
            {edit ? "Cancel" : "Edit"}
          </button>
        </div>

        {edit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              patch({
                title: f.get("title"),
                material: f.get("material"),
                notes: f.get("notes"),
                siteInstructions: String(f.get("siteInstructions") || "") || null,
              });
            }}
          >
            <label className={LABEL} htmlFor="title">Headline</label>
            <input
              id="title"
              name="title"
              defaultValue={order.title || ""}
              className={INPUT}
            />
            <label className={`${LABEL} mt-4`} htmlFor="material">The article</label>
            <textarea
              id="material"
              name="material"
              rows={10}
              defaultValue={order.material || ""}
              className={INPUT}
            />
            <label className={`${LABEL} mt-4`} htmlFor="siteInstructions">
              Per-newspaper instructions
            </label>
            <textarea
              id="siteInstructions"
              name="siteInstructions"
              rows={3}
              defaultValue={order.site_instructions || ""}
              className={INPUT}
            />
            <label className={`${LABEL} mt-4`} htmlFor="notes">Notes</label>
            <input
              id="notes"
              name="notes"
              defaultValue={order.notes || ""}
              className={INPUT}
            />
            <button
              type="submit"
              disabled={!!busy}
              className="mt-4 px-5 py-2 bg-[var(--accent)] text-white rounded text-sm font-bold disabled:opacity-50"
            >
              {busy === "save" ? "Saving…" : "Save"}
            </button>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className={LABEL}>Headline</dt>
              <dd>{order.title || <span className="text-gray-400">— written per paper —</span>}</dd>
            </div>
            <div>
              <dt className={LABEL}>The article</dt>
              <dd className="whitespace-pre-wrap text-gray-700">
                {order.material || <span className="text-gray-400">—</span>}
              </dd>
            </div>
            {order.site_instructions && (
              <div>
                <dt className={LABEL}>Per-newspaper instructions</dt>
                <dd className="whitespace-pre-wrap text-gray-700">
                  {order.site_instructions}
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className={LABEL}>Contact</dt>
                <dd className="text-gray-700">
                  {order.email || "—"}
                  {order.phone ? ` · ${order.phone}` : ""}
                </dd>
              </div>
              <div>
                <dt className={LABEL}>Ordered</dt>
                <dd className="text-gray-700">{when(order.created_at)}</dd>
              </div>
            </div>
            {order.notes && (
              <div>
                <dt className={LABEL}>Notes</dt>
                <dd className="text-gray-700">{order.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </section>
    </div>
  );
}
