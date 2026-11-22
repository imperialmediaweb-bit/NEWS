"use client";

import { useState } from "react";

const TYPES: [string, string, string][] = [
  ["tip", "News tip", "Something happened in your town that people should know."],
  ["photo", "Photo or video", "Weather, a fire, a crash scene from a safe distance, a parade, an event."],
  ["event", "Community event", "A festival, fair, concert, fundraiser or meeting coming up."],
  ["achievement", "Local achievement", "A student award, a high-school title, a scholarship, a milestone."],
  ["closing", "Closing or delay", "A school, office, church or business closed or opening late (weather, outage)."],
];

/** The reader submission form. Everything goes to the newsroom's review queue first. */
export default function SubmitForm({ siteName, state, accent }: { siteName: string; state: string; accent: string }) {
  const [type, setType] = useState("tip");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    data.set("type", type);
    try {
      const res = await fetch("/api/submit", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-[16px] text-green-900">
        <p className="font-bold">Thank you — we received it.</p>
        <p className="mt-2">An editor at {siteName} will review it. We may email you to confirm details before anything is published.</p>
      </div>
    );
  }

  const input = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-[15px] focus:border-gray-500 focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="space-y-5" encType="multipart/form-data">
      <fieldset>
        <legend className="text-[15px] font-bold">What are you sending?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TYPES.map(([v, label, help]) => (
            <label key={v} className={`cursor-pointer rounded border p-3 ${type === v ? "border-2" : "border-gray-300"}`} style={type === v ? { borderColor: accent } : undefined}>
              <input type="radio" name="type_choice" value={v} checked={type === v} onChange={() => setType(v)} className="mr-2" />
              <b>{label}</b>
              <span className="mt-1 block text-[13px] text-gray-600">{help}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-[14px] font-semibold">
        Headline
        <input name="title" required minLength={8} maxLength={200} className={input} placeholder={type === "event" ? "Fall Festival at Central Park" : "Water main break closes Main Street"} />
      </label>
      <label className="block text-[14px] font-semibold">
        What happened? Who, what, where, when
        <textarea name="body" required minLength={30} maxLength={8000} rows={6} className={input} placeholder="Give the facts you know first-hand. Please don't name people accused of anything; we confirm that with officials." />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[14px] font-semibold">
          City or town in {state}
          <input name="city" maxLength={120} className={input} />
        </label>
        {(type === "event" || type === "closing") && (
          <label className="block text-[14px] font-semibold">
            {type === "closing" ? "Which day(s)" : "Date and time of the event"}
            <input name="event_date" maxLength={60} className={input} placeholder="Sat, Dec 6, 10 am–4 pm" />
          </label>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-[14px] font-semibold">
          Photo (optional, up to 8 MB)
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="mt-1 block w-full text-[14px]" />
        </label>
        <label className="block text-[14px] font-semibold">
          Video link (optional)
          <input name="video_url" type="url" maxLength={500} className={input} placeholder="https://youtube.com/…" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-[14px] font-semibold">
          Your name
          <input name="name" required maxLength={120} className={input} autoComplete="name" />
        </label>
        <label className="block text-[14px] font-semibold">
          Email
          <input name="email" type="email" required maxLength={200} className={input} autoComplete="email" />
        </label>
        <label className="block text-[14px] font-semibold">
          Phone (optional)
          <input name="phone" maxLength={40} className={input} autoComplete="tel" />
        </label>
      </div>
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2 text-[13.5px] text-gray-700">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I confirm this is accurate to the best of my knowledge. Any photo or video is mine, or I have the right to share it, and I allow {siteName} to publish it with credit to me. Nothing is published until an editor reviews it, and {siteName} may edit or decline it. My email and phone are never published.
        </span>
      </label>
      {status === "error" && <p className="text-[14px] font-semibold text-red-700">{message}</p>}
      <button type="submit" disabled={status === "sending"} className="rounded px-6 py-3 text-[15px] font-bold text-white disabled:opacity-60" style={{ background: accent }}>
        {status === "sending" ? "Sending…" : "Send to the newsroom"}
      </button>
    </form>
  );
}
