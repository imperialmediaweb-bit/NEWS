"use client";

/**
 * The pieces both order screens need.
 *
 * Ported from the Romanian network, including the lesson its own comments
 * record: that panel started as one screen where each order expanded in
 * place, and with a handful of orders the buttons of one ended up beside the
 * table of another. They split it into a list and a page per order. The first
 * version here repeated the mistake, so this follows theirs — the list is a
 * list, and the work happens at /admin/orders/<id>.
 */

export interface Order {
  id: number;
  client: string;
  email: string | null;
  phone: string | null;
  client_url: string;
  package: string | null;
  price: number | string | null;
  currency: string;
  paid: boolean;
  title: string | null;
  material: string | null;
  notes: string | null;
  /** Per-site instructions, one line per site. */
  site_instructions: string | null;
  /** The client's own text on every paper, no rewriting. */
  identical_text: boolean | null;
  category: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
  published_count: number;
  reportUrl: string | null;
}

export interface Placement {
  site_slug: string;
  article_id: number | null;
  url: string | null;
  placed_at: string | null;
}

export const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800 border border-amber-200",
  approved: "bg-sky-100 text-sky-800 border border-sky-200",
  publishing: "bg-blue-100 text-blue-800 border border-blue-200",
  published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const STATUS_LABEL: Record<string, string> = {
  pending_review: "Awaiting review",
  approved: "Approved",
  publishing: "Publishing",
  published: "Published",
  cancelled: "Cancelled",
};

/** Sections a campaign can run in. Advertising stays the default. */
export const CATEGORIES = [
  "Advertising",
  "Business",
  "Local News",
  "US News",
  "Politics",
  "Sports",
  "Entertainment",
] as const;

export const NETWORK_SIZE = 49;

export const INPUT =
  "w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm placeholder-gray-400 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none";

export const LABEL =
  "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";

/** The admin key, entered once and kept in this browser. */
export function adminKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("cron_secret") || "";
}

export function promptForKey() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("cron_secret")) {
    const k = window.prompt("Enter CRON_SECRET to access orders:");
    if (k) localStorage.setItem("cron_secret", k);
  }
}

export function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const day = (x: Date) => x.toLocaleDateString("en-US");
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (day(d) === day(today)) return `today ${time}`;
  const tomorrow = new Date(today.getTime() + 86400000);
  if (day(d) === day(tomorrow)) return `tomorrow ${time}`;
  return `${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })} ${time}`;
}

/**
 * How far across the network this campaign has reached.
 *
 * The count that matters is how many articles are actually live, not how many
 * rows were written: on the Romanian network publication is spread over
 * twelve hours and an article's URL 404s until its turn comes, so a report
 * sent too early shows the client dead links. This network publishes in
 * batches rather than on a schedule, so the two numbers agree today — the bar
 * is built to tell them apart anyway, because the day staggering is added is
 * the day a progress bar that conflates them starts lying.
 */
export function Progress({
  total,
  live,
  big,
}: {
  total: number;
  live: number;
  big?: boolean;
}) {
  if (!total) return null;
  const pct = Math.round((live / total) * 100);
  const done = live >= total;
  return (
    <div className={big ? "mb-4" : ""}>
      <div
        className={`w-full ${big ? "h-3" : "h-1.5"} bg-gray-200 rounded-full overflow-hidden`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? "bg-emerald-500" : "bg-blue-500"
          }`}
          style={{ width: `${Math.max(pct, live ? 3 : 0)}%` }}
        />
      </div>
      {big && (
        <p className="mt-1.5 text-xs text-gray-600">
          <span className={done ? "text-emerald-700 font-bold" : "text-blue-700 font-bold"}>
            {live} of {total} published ({pct}%)
          </span>
          {done
            ? " — the campaign is complete and the report is final."
            : ` — ${total - live} still to go.`}
        </p>
      )}
    </div>
  );
}
