import crypto from "crypto";
import pool from "@/lib/db";

/**
 * Paid placements: a sponsored story ("Promote your business") and an
 * obituary. The customer writes it and pays by Stripe Checkout; the newsroom
 * reviews it in /admin/paid before it is published, clearly labelled.
 * "listing" is a monthly subscription: a paid entry in the paper's local
 * business directory (/directory), live while the subscription is active.
 */
export { LISTING_CATEGORIES } from "@/lib/listing-categories";
export const PRODUCTS = {
  sponsored: { name: "Sponsored story", cents: Number(process.env.PRICE_SPONSORED_CENTS || 4900) },
  obituary: { name: "Obituary", cents: Number(process.env.PRICE_OBITUARY_CENTS || 2500) },
  listing: { name: "Local business directory listing (monthly)", cents: Number(process.env.PRICE_LISTING_CENTS || 1900) },
  press_release: { name: "Press release", cents: Number(process.env.PRICE_PRESS_RELEASE_CENTS || 4900) },
  spotlight: { name: "Business Spotlight (12 months)", cents: Number(process.env.PRICE_SPOTLIGHT_CENTS || 4900) },
  spotlight_home: { name: "Business Spotlight + 7 days on the homepage", cents: Number(process.env.PRICE_SPOTLIGHT_HOME_CENTS || 14900) },
  featured: { name: "Featured sponsored story (7 days on the homepage)", cents: Number(process.env.PRICE_SPONSORED_CENTS || 4900) + Number(process.env.PRICE_FEATURE_ADDON_CENTS || 10000) },
} as const;
export type Product = keyof typeof PRODUCTS;

let ready: Promise<unknown> | null = null;
export function ensurePaidTable() {
  ready ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS paid_orders (
         id SERIAL PRIMARY KEY,
         site_slug VARCHAR(100) NOT NULL,
         product VARCHAR(20) NOT NULL,
         title TEXT NOT NULL,
         body TEXT NOT NULL,
         business TEXT,
         website TEXT,
         name TEXT NOT NULL,
         email TEXT NOT NULL,
         photo_url TEXT,
         cents INT NOT NULL,
         status VARCHAR(20) NOT NULL DEFAULT 'awaiting_payment',
         stripe_session TEXT,
         article_slug TEXT,
         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
         paid_at TIMESTAMPTZ,
         published_at TIMESTAMPTZ
       );
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS city TEXT;
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS phone TEXT;
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS listing_category TEXT;
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS stripe_subscription TEXT;
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS business_id INT;
       ALTER TABLE paid_orders ADD COLUMN IF NOT EXISTS auto_publish_at TIMESTAMPTZ;`
    )
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}

/** Stripe REST call (form-encoded), no SDK. */
export async function stripe<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${res.status}`);
  return json;
}

/** Verify a Stripe webhook signature (t=…,v1=…) against the raw body. */
export function verifyStripe(raw: string, header: string, secret: string, toleranceSec = 300): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const got = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return got.some((g) => g.length === expected.length && crypto.timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}

/**
 * What a sponsored story may not promote. Checked before payment, so nobody is
 * charged for something that will not run; the editor still reviews the rest.
 * Google, Stripe and US law all restrict these, and they are what link and
 * "guest post" sellers push onto local news sites.
 */
const BANNED: Array<[RegExp, string]> = [
  [/\b(cbd|thc|delta[- ]?[89]|cannabis|marijuana|weed|kratom|psilocybin|magic mushrooms?|dispensar(y|ies)|vape|vaping|e-?cig)\b/i, "cannabis, CBD, kratom or vaping products"],
  [/\b(pills?|tablets?|capsules?|viagra|cialis|tramadol|oxy(codone|contin)|adderall|xanax|ozempic|semaglutide|tirzepatide|steroids?|peptides?|sarms?|no prescription|without (a )?prescription|online pharmacy|weight[- ]loss (pill|supplement|gumm)|keto (pill|gumm)|diet pills?|male enhancement|supplements?)\b/i, "drugs, pills, supplements or online pharmacies"],
  [/\b(crypto(currency)?|bitcoin|forex|binary options|trading signals?|guaranteed returns?|double your money|airdrop|nft|presale)\b/i, "crypto, forex or investment offers"],
  [/\b(payday loans?|title loans?|cash advance|bad credit loans?|debt relief|credit repair)\b/i, "payday or high-cost loans and debt relief"],
  [/\b(escorts?|adult (content|entertainment|toys|videos?)|porn|xxx|onlyfans|dating (app|site|service)s?|hookups?|sugar (daddy|baby))\b/i, "adult or dating services"],
  [/\b(guns?|firearms?|ammo|ammunition|rifles?|pistols?|knives for sale|weapons?)\b/i, "weapons or ammunition"],
  [/\b(backlinks?|guest posts?|seo services|link building|dofollow|essay writing|write my essay|fake (id|reviews?)|followers for sale|buy (likes|followers))\b/i, "SEO link selling, essay writing or fake reviews and followers"],
  [/\b(tobacco|cigarettes?|cigars?|nicotine)\b/i, "tobacco or nicotine"],
];

/** The reason a sponsored text is refused, or null if it may go to review. */
export function bannedReason(...texts: string[]): string | null {
  const t = texts.join(" \n ");
  for (const [re, label] of BANNED) if (re.test(t)) return label;
  return null;
}

/**
 * Allowed, but at the premium price: casinos and gaming, burlesque, cabaret and
 * other 18+ shows. Licensed venues only; the editor still reviews each one.
 */
export const PREMIUM_CENTS = Number(process.env.PRICE_PREMIUM_CENTS || 9900);
const PREMIUM = /\b(casinos?|sportsbooks?|sports betting|betting|poker|slot machines?|gaming floor|bingo|burlesque|cabaret|revue|18\+|21\+|adults? only|nightclubs?|gentlemen'?s club)\b/i;

/** True when a sponsored story is in a premium-priced category. */
export function isPremium(...texts: string[]): boolean {
  return PREMIUM.test(texts.join(" \n "));
}
