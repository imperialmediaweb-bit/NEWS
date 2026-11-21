import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Generate one website mockup image with OpenAI's image model, using the
 * network's own OPENAI_API_KEY (which stays on the server).
 *
 *   POST /api/admin/mockup?key=CRON_SECRET
 *   { prompt, logoPng?: base64, size?: "1024x1536" | "1536x1024", quality?: "low"|"medium"|"high" }
 *   → { b64, model, ms }
 *
 * The owner wants a mockup per state site to choose designs from, and asked
 * for them to be generated in one go instead of one by one in ChatGPT. With a
 * logo the edits endpoint is used, so the mockup carries the real logo rather
 * than a redrawn one. Each call costs money on the OpenAI account; nothing
 * here runs on a schedule.
 */
export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").slice(0, 30000);
  if (prompt.length < 20) return NextResponse.json({ error: "prompt required" }, { status: 400 });
  // Size and model are passed through: newer image models accept larger and
  // taller canvases than gpt-image-1, and OpenAI rejects what a model cannot do.
  const size = /^\d{3,4}x\d{3,4}$|^auto$/.test(String(body.size || "")) ? String(body.size) : "1024x1536";
  const quality = ["low", "medium", "high", "auto"].includes(body.quality) ? body.quality : "high";
  const model = /^[a-z0-9.\-]{3,40}$/.test(String(body.model || "")) ? String(body.model) : "gpt-image-1";

  const started = Date.now();
  let res: Response;
  if (body.logoPng) {
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("size", size);
    form.append("quality", quality);
    form.append("image[]", new Blob([Buffer.from(String(body.logoPng), "base64")], { type: "image/png" }), "logo.png");
    res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
    });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: json?.error?.message || `OpenAI ${res.status}`, status: res.status, ms: Date.now() - started },
      { status: 502 }
    );
  }
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ error: "no image in response", raw: JSON.stringify(json).slice(0, 300) }, { status: 502 });
  return NextResponse.json({ b64, model, ms: Date.now() - started, usage: json.usage || null });
}

// Which image models this key can use, newest first.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  });
  const j = await r.json().catch(() => ({}));
  const models = (j?.data || [])
    .filter((m: { id: string }) => /image|dall-e/i.test(m.id))
    .sort((a: { created: number }, b: { created: number }) => b.created - a.created)
    .map((m: { id: string; created: number }) => ({ id: m.id, created: new Date(m.created * 1000).toISOString().slice(0, 10) }));
  return NextResponse.json({ status: r.status, models });
}
