"use client";

import { useState } from "react";
import { SiteConfig } from "@/config/site-config";

/**
 * The order form for the advertising page.
 *
 * The page described four products and gave no way to buy any of them, so
 * every enquiry depended on a reader finding an email address and writing one
 * unprompted. This asks for what a campaign actually needs — who, what, where,
 * how much — so a reply can be a quote rather than a list of questions.
 */
export default function AdvertiseForm({ site }: { site: SiteConfig }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");

    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/advertising-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: data.get("company"),
          contactName: data.get("contactName"),
          email: data.get("email"),
          phone: data.get("phone"),
          website: data.get("website"),
          package: data.get("package"),
          budget: data.get("budget"),
          message: data.get("message"),
          // Honeypot — hidden from people, filled in by bots.
          website_url: data.get("website_url"),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Request failed");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h3
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase" }}
        >
          Thank you
        </h3>
        <p className="text-gray-600 text-sm">
          We&apos;ve received your enquiry and will be in touch within one business day.
        </p>
      </div>
    );
  }

  const field =
    "w-full px-3 py-2.5 border border-gray-300 rounded text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";
  const label = "block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5";

  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h3
        className="text-xl mb-1"
        style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", fontWeight: 700 }}
      >
        Request a proposal
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Tell us what you want to promote and we&apos;ll come back with options and pricing.
      </p>

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
        <div>
          <label className={label} htmlFor="website">Your website</label>
          <input id="website" name="website" maxLength={300} placeholder="https://" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="budget">Budget range</label>
          <select id="budget" name="budget" className={field} defaultValue="">
            <option value="">Not sure yet</option>
            <option>Under $500</option>
            <option>$500 – $2,000</option>
            <option>$2,000 – $10,000</option>
            <option>Over $10,000</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={label} htmlFor="package">What are you interested in?</label>
        <select id="package" name="package" className={field} defaultValue="">
          <option value="">Not sure — advise me</option>
          <option>Display advertising</option>
          <option>Sponsored article</option>
          <option>Newsletter sponsorship</option>
          <option>Network-wide campaign (all 50 states)</option>
        </select>
      </div>

      <div className="mt-4">
        <label className={label} htmlFor="message">
          What would you like to promote?
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={4000}
          className={field}
          placeholder={`Tell us about the product, service or announcement — and which markets matter most. ${site.state} only, or nationwide?`}
        />
      </div>

      {/* Hidden from people; bots fill it in and are silently discarded. */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <p className="text-xs text-gray-500 mt-4 leading-relaxed">
        Sponsored articles are published with a clear sponsored-content label and their links
        are marked <code>rel=&quot;sponsored&quot;</code>. We don&apos;t sell links that pass
        ranking credit, and we don&apos;t publish advertising disguised as news.
      </p>

      {state === "error" && (
        <p className="text-sm text-red-600 mt-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-5 w-full md:w-auto px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-60 text-white font-bold rounded transition-colors"
        style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "1px" }}
      >
        {state === "sending" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
