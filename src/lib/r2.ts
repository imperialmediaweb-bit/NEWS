import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3-compatible) for the network's photos. Credentials live
 * only in Railway variables; nothing runs when they are missing.
 */
let client: AwsClient | null = null;

export function r2Ready(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL);
}

function c(): AwsClient {
  if (!client) client = new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: "s3", region: "auto" });
  return client;
}

const endpoint = (key: string) => `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`;

export async function r2Put(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const r = await c().fetch(endpoint(key), {
    method: "PUT",
    body: new Blob([body as unknown as ArrayBuffer], { type: contentType }),
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
  if (!r.ok) throw new Error(`r2 put ${key}: ${r.status} ${(await r.text()).slice(0, 200)}`);
}

export async function r2Exists(key: string): Promise<boolean> {
  const r = await c().fetch(endpoint(key), { method: "HEAD" });
  return r.ok;
}

export const r2Url = (key: string) => `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
