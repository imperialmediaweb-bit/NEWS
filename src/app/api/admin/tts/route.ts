import { NextRequest, NextResponse } from "next/server";

/**
 * Text to speech with the network's OpenAI key, for narrating presentation
 * videos. POST {text, voice?} → audio/mpeg.
 *   POST /api/admin/tts?key=CRON_SECRET
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").slice(0, 3000);
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: body.model || "gpt-4o-mini-tts",
      voice: body.voice || "onyx",
      input: text,
      instructions: body.instructions || "Warm, confident American documentary narrator presenting a business for sale. Clear, unhurried, premium.",
      response_format: "mp3",
    }),
  });
  if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}` }, { status: 502 });
  return new NextResponse(await res.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg" } });
}
