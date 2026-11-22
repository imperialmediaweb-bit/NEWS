import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getSiteByDomain } from "@/config/sites";
import { r2Put, r2Ready, r2Url } from "@/lib/r2";
import { ensureSubmissionsTable, SUBMISSION_TYPES, type SubmissionType } from "@/lib/submissions";
import { Resend } from "resend";

const NEWSROOM_INBOX = process.env.SUBMISSIONS_EMAIL || "ainewss2023@gmail.com";
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * POST /api/submit — a reader's tip, photo/video, event or achievement
 * (multipart form). Stored as 'pending' for the newsroom to review; nothing
 * goes live from here.
 */
export const dynamic = "force-dynamic";

const MAX_PHOTO = 8 * 1024 * 1024;
const recent = new Map<string, number[]>();

function tooMany(ipHash: string): boolean {
  const now = Date.now();
  const list = (recent.get(ipHash) || []).filter((t) => now - t < 3600e3);
  list.push(now);
  recent.set(ipHash, list);
  return list.length > 5; // five an hour from one address
}

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
  const site = getSiteByDomain(host);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 400 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }
  // honeypot: a field people never see
  if (clean(form.get("website"), 200)) return NextResponse.json({ ok: true });

  const type = clean(form.get("type"), 20) as SubmissionType;
  const title = clean(form.get("title"), 200);
  const body = clean(form.get("body"), 8000);
  const city = clean(form.get("city"), 120);
  const eventDate = clean(form.get("event_date"), 60);
  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 200);
  const phone = clean(form.get("phone"), 40);
  const videoUrl = clean(form.get("video_url"), 500);
  const consent = form.get("consent") === "on" || form.get("consent") === "true";

  if (!(type in SUBMISSION_TYPES)) return NextResponse.json({ error: "Choose what you are sending." }, { status: 400 });
  if (title.length < 8 || body.length < 30) return NextResponse.json({ error: "Please add a headline and a few sentences about what happened." }, { status: 400 });
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please give your name and a valid email so we can confirm the details." }, { status: 400 });
  if (!consent) return NextResponse.json({ error: "Please confirm the consent box." }, { status: 400 });
  if (videoUrl && !/^https:\/\//i.test(videoUrl)) return NextResponse.json({ error: "The video link must start with https://" }, { status: 400 });

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const ipHash = crypto.createHash("sha256").update(`${ip}|${process.env.CRON_SECRET || ""}`).digest("hex").slice(0, 32);
  if (tooMany(ipHash)) return NextResponse.json({ error: "Too many submissions from this connection. Please try again later." }, { status: 429 });

  let photoUrl: string | null = null;
  const photo = form.get("photo");
  if (photo && typeof photo !== "string" && photo.size > 0) {
    if (photo.size > MAX_PHOTO) return NextResponse.json({ error: "The photo is larger than 8 MB." }, { status: 400 });
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(photo.type)) return NextResponse.json({ error: "The photo must be JPG, PNG, WebP or HEIC." }, { status: 400 });
    if (r2Ready()) {
      const ext = photo.type.split("/")[1].replace("jpeg", "jpg");
      const key = `submissions/${site.slug}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
      await r2Put(key, new Uint8Array(await photo.arrayBuffer()), photo.type);
      photoUrl = r2Url(key);
    }
  }

  await ensureSubmissionsTable();
  await pool.query(
    `INSERT INTO submissions (site_slug, state, type, title, body, city, event_date, name, email, phone, photo_url, video_url, consent, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [site.slug, site.state, type, title, body, city || null, eventDate || null, name, email, phone || null, photoUrl, videoUrl || null, consent, ipHash]
  );
  // tell the newsroom; a failed email never fails the submission
  if (process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: `${site.name} <contact@alabama-express.com>`,
        to: NEWSROOM_INBOX,
        replyTo: email,
        subject: `[${site.name}] ${SUBMISSION_TYPES[type]}: ${title}`.slice(0, 180),
        html: `<p><b>${esc(SUBMISSION_TYPES[type])}</b> on ${esc(site.name)}${city ? ` — ${esc(city)}` : ""}${eventDate ? ` — ${esc(eventDate)}` : ""}</p>
<h2>${esc(title)}</h2><p style="white-space:pre-wrap">${esc(body)}</p>
${photoUrl ? `<p><img src="${photoUrl}" style="max-width:520px"></p>` : ""}${videoUrl ? `<p>Video: <a href="${esc(videoUrl)}">${esc(videoUrl)}</a></p>` : ""}
<p>From ${esc(name)} &lt;${esc(email)}&gt;${phone ? ` · ${esc(phone)}` : ""}</p>
<p><a href="https://${site.domain}/admin/submissions">Review it in the admin</a> (approve or reject).</p>`,
      });
    } catch (e) {
      console.error("[submit] notify failed", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ ok: true });
}
