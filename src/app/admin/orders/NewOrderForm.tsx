"use client";

import { useState } from "react";
import { INPUT, LABEL, CATEGORIES, adminKey } from "./shared";

/**
 * A campaign you sold yourself.
 *
 * The public form at /order covers clients who find the site. Most do not:
 * the order arrives by email or phone, money changes hands, and there has to
 * be somewhere to type it in. Without this screen the only way to enter a
 * paid campaign was to POST JSON to the API by hand.
 */
export default function NewOrderForm({
  onSaved,
  onCancel,
}: {
  onSaved: (id: number) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const f = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey(),
          client: f.get("client"),
          email: f.get("email"),
          phone: f.get("phone"),
          clientUrl: f.get("clientUrl"),
          package: f.get("package"),
          price: f.get("price"),
          currency: "USD",
          paid: f.get("paid") === "on",
          title: f.get("title"),
          material: f.get("material"),
          notes: f.get("notes"),
          category: f.get("category"),
          identicalText: f.get("identicalText") === "on",
          siteInstructions: String(f.get("siteInstructions") || "").trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      onSaved(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-gray-200 rounded-lg p-6 mb-6"
    >
      <h2 className="font-bold text-lg mb-4">New campaign</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL} htmlFor="client">Client *</label>
          <input id="client" name="client" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="clientUrl">Link to promote *</label>
          <input
            id="clientUrl"
            name="clientUrl"
            required
            placeholder="https://theircompany.com/page"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className={INPUT} />
        </div>
        <div>
          <label className={LABEL} htmlFor="package">Package</label>
          <input
            id="package"
            name="package"
            defaultValue="Network campaign — 49 newspapers"
            className={INPUT}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="price">Price (USD)</label>
            <input id="price" name="price" defaultValue="149" className={INPUT} />
          </div>
          <div>
            <label className={LABEL} htmlFor="category">Section</label>
            <select id="category" name="category" className={INPUT}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="title">Headline</label>
        <input
          id="title"
          name="title"
          placeholder="Leave blank and one is written for each paper"
          className={INPUT}
        />
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="material">The article</label>
        <textarea
          id="material"
          name="material"
          rows={8}
          className={INPUT}
          placeholder={
            "What the client sent: the announcement, the facts, dates, prices, locations.\n\nIf they supplied finished copy, paste it here and tick “use their text as-is” below."
          }
        />
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="siteInstructions">
          Per-newspaper instructions
        </label>
        <textarea
          id="siteInstructions"
          name="siteInstructions"
          rows={3}
          className={INPUT}
          placeholder={
            'One line per paper, e.g.\ntexas-express: mention the Austin opening\nflorida-express: mention the Miami office\n\nBlank means every paper gets the same brief.'
          }
        />
      </div>

      <div className="mt-4">
        <label className={LABEL} htmlFor="notes">Notes</label>
        <input
          id="notes"
          name="notes"
          placeholder="e.g. client wants it live on Monday"
          className={INPUT}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="paid" /> Already paid
        </label>
        <label className="flex items-center gap-2" title="No rewriting per state">
          <input type="checkbox" name="identicalText" /> Use the client&apos;s text
          as-is on every paper
        </label>
      </div>
      {/* Said plainly, because it is the one setting here that can cost the
          network its search visibility: forty-nine copies of one text is the
          duplicate-content pattern search engines penalise. */}
      <p className="mt-2 text-xs text-gray-500">
        Identical text on all 49 is what search engines treat as duplicate
        content. Only tick it when the client insists.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--accent)] text-white rounded font-bold text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create campaign"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
