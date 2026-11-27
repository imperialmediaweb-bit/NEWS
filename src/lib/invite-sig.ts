import crypto from "crypto";

/** Signed preview link for a business's draft website (sent in the invitation email). */
export function previewSig(businessId: number): string {
  return crypto.createHmac("sha256", process.env.CRON_SECRET || "x").update(`preview:${businessId}`).digest("hex").slice(0, 24);
}
