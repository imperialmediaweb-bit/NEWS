import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSiteByDomain } from "@/config/sites";
import { ownerBusinesses } from "@/lib/directory-owner";
import { r2Put, r2Ready, r2Url } from "@/lib/r2";

/** Owner photo upload for the Business Website (JPG/PNG/WebP, 8 MB). Returns the public URL. */
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });
  const f = await req.formData();
  const own = await ownerBusinesses(String(f.get("token") || ""), site.slug);
  if (!own) return NextResponse.json({ error: "Your link has expired." }, { status: 401 });
  const biz = own.businesses.find((x: { id: number }) => x.id === Number(f.get("businessId")));
  const file = f.get("file");
  if (!biz || !file || typeof file === "string") return NextResponse.json({ error: "No photo." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/i.test(file.type)) return NextResponse.json({ error: "JPG, PNG or WebP up to 8 MB." }, { status: 400 });
  if (!r2Ready()) return NextResponse.json({ error: "Uploads are not available right now." }, { status: 503 });
  const key = `sites/${site.slug}/${biz.id}/${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
  await r2Put(key, new Uint8Array(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url: r2Url(key) });
}
