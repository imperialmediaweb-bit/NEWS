import type { Business } from "@/lib/directory";

/**
 * Express Score (0-100): a transparent ranking every business can read.
 *  - Reviews, up to 55: verified readers' stars (Bayesian, so one 5-star
 *    review doesn't beat forty 4.8s) and how many there are.
 *  - Profile, up to 30: hours, phone, website, an owner description, a photo.
 *  - Trust, up to 15: the owner claimed and confirmed the listing.
 * Money never changes the score: paid placement is shown apart, as Sponsored.
 */
export type ScorePart = { label: string; points: number; max: number };
export type Score = { total: number; parts: ScorePart[] };

export function expressScore(b: Pick<Business, "rating_sum" | "rating_count" | "hours" | "phone" | "website" | "description" | "photo_url" | "claimed">): Score {
  const n = b.rating_count || 0;
  const bayes = (3.5 * 3 + (b.rating_sum || 0)) / (3 + n); // 1..5
  const stars = Math.max(0, Math.min(40, ((bayes - 1) / 4) * 40));
  const volume = Math.min(15, Math.round(Math.log2(1 + n) * 4));
  const reviews = Math.round(stars + volume);
  const profile = (b.hours ? 7 : 0) + (b.phone ? 6 : 0) + (b.website ? 6 : 0) + (b.description && b.description.length > 60 ? 6 : 0) + (b.photo_url ? 5 : 0);
  const trust = b.claimed ? 15 : 0;
  return {
    total: Math.min(100, reviews + profile + trust),
    parts: [
      { label: n ? `Reviews (${n})` : "Reviews (none yet)", points: reviews, max: 55 },
      { label: "Profile", points: profile, max: 30 },
      { label: b.claimed ? "Owner verified" : "Not claimed yet", points: trust, max: 15 },
    ],
  };
}

/** Free ways to raise the score, each with its points, from what the profile is missing. */
export function scoreTips(b: Pick<Business, "rating_count" | "hours" | "phone" | "website" | "description" | "photo_url" | "claimed">): { text: string; points: number }[] {
  const t: { text: string; points: number }[] = [];
  if (!b.photo_url) t.push({ text: "Add a photo of your business", points: 5 });
  if (!b.hours) t.push({ text: "Add your opening hours", points: 7 });
  if (!b.description || b.description.length <= 60) t.push({ text: "Write a short description (2-3 sentences)", points: 6 });
  if (!b.website) t.push({ text: "Add your website (we can build you one)", points: 6 });
  if (!b.phone) t.push({ text: "Add a phone number", points: 6 });
  if ((b.rating_count || 0) < 10) t.push({ text: "Ask happy customers for a review (use your QR sign)", points: b.rating_count ? 3 : 8 });
  return t;
}
