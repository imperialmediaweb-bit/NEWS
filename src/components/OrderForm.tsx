"use client";

import { useState } from "react";
import { SiteConfig } from "@/config/site-config";

/**
 * The public order form.
 *
 * Submitting creates an order marked unpaid and pending review — nothing is
 * published until someone approves it. The form says so, because a client who
 * expects to be live in ten minutes and is not will email angrily, and a
 * client told the truth up front will not.
 */
export default function OrderForm({ site }: { site: SiteConfig }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [reportUrl, setReportUrl] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: data.get("company"),
          contactName: data.get("contactName"),
          email: data.get("email"),
          phone: data.get("phone"),
          clientUrl: data.get("clientUrl"),
          title: data.get("title"),
          material: data.get("material"),
          website_url: data.get("website_url"),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Order failed");
      setReportUrl(body.reportUrl || "");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h3
          className="text-xl font-bold mb-3"
          style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}
        >
          Order received
        </h3>
        <p className="text-gray-700 text-sm mb-4">
          We&apos;ll review it and email you an invoice. Nothing is published until
          you&apos;ve approved and paid.
        </p>
        {reportUrl && (
          <p className="text-sm text-gray-600">
            Your live report:{" "}
            <a href={reportUrl} className="text-[var(--accent)] underline break-all">
              {reportUrl}
            </a>
            <br />
            <span className="text-xs text-gray-500">
              It&apos;s empty for now and fills in with every link as each newspaper
              publishes. Keep it — you won&apos;t need to ask us whether it&apos;s out yet.
            </span>
          </p>
        )}
      </div>
    );
  }

  const field =
    "w-full px-3 py-2.5 border border-gray-300 rounded text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";
  const label = "block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="company">Company *</label>
          <input id="company" name="company" required maxLength={200} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="contactName">Your name *</label>
          <input id="contactName" name="contactName" required maxLength={200} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required maxLength={200} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" maxLength={60} className={field} />
        </div>
      </div>

      <div className="mt-4">
        <label className={label} htmlFor="clientUrl">Link to promote *</label>
        <input
          id="clientUrl"
          name="clientUrl"
          required
          maxLength={500}
          placeholder="https://yourcompany.com/page"
          className={field}
        />
        <p className="text-xs text-gray-500 mt-1">
          This is the address every article will link to.
        </p>
      </div>

      <div className="mt-4">
        <label className={label} htmlFor="title">Headline you&apos;d like</label>
        <input id="title" name="title" maxLength={300} className={field} />
        <p className="text-xs text-gray-500 mt-1">
          Leave blank and we&apos;ll write one.
        </p>
      </div>

      <div className="mt-4">
        <label className={label} htmlFor="material">What should the article say?</label>
        <textarea
          id="material"
          name="material"
          rows={7}
          maxLength={20000}
          className={field}
          placeholder={`Your announcement, product or service. Anything factual we should include — dates, prices, locations, contact details.\n\nIf you already have the copy written, paste it here and we'll use it.`}
        />
      </div>

      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {state === "error" && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 w-full md:w-auto px-10 py-3 bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white font-bold rounded transition-colors"
        style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "1px" }}
      >
        {state === "sending" ? "Sending…" : "Place order"}
      </button>

      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Nothing is published until you approve and pay. Every article is labelled
        sponsored content and links to your site are marked{" "}
        <code>rel=&quot;sponsored&quot;</code> — we don&apos;t sell links that pass
        ranking credit, because {site.name} wouldn&apos;t keep its own search
        visibility if we did.
      </p>
    </form>
  );
}
