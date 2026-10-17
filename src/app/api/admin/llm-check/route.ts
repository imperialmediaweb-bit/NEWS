import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Which LLM can this deployment actually reach, and with which model names?
 *
 *   GET /api/admin/llm-check?key=CRON_SECRET
 *
 * The rewriter fans out over three providers and falls back between them, so
 * when it stops producing articles the error it stores ("All LLM providers
 * failed: …") tells you only that every attempt failed — not which model name
 * is wrong, whether a key is missing, or what Google would accept instead.
 * Model names are also the part of this system most likely to rot: providers
 * retire a name and every call starts returning 400, with the pipeline looking
 * identical to a quota problem from the outside.
 *
 * So this asks the providers directly rather than trusting what is configured:
 *
 *   - Gemini publishes a model list, so we fetch it and report every model that
 *     actually supports generateContent.
 *   - OpenAI and Anthropic are probed with a one-token request, which is the
 *     only way to learn whether the key works AND the model name resolves.
 *
 * To change a model once you can see which ones exist:
 *
 *   GET /api/admin/llm-check?key=…&set_gemini=gemini-2.5-flash
 *   GET /api/admin/llm-check?key=…&set_openai=gpt-4o-mini
 *   GET /api/admin/llm-check?key=…&set_anthropic=claude-haiku-4-5
 *   GET /api/admin/llm-check?key=…&set_provider=rotation
 *
 * A write through a GET is deliberate: these links get pasted into chat and
 * clicked from a phone, and a config row behind an admin key is not worth a
 * form. Setting happens before the checks, so one call changes the model and
 * tells you in the same response whether the new name works.
 *
 * No API key or key fragment is ever returned — only whether one is present.
 */

type ProviderReport = {
  provider: string;
  keyPresent: boolean;
  configuredModel: string;
  ok: boolean;
  error?: string;
  /** Models this provider says it has. Only Gemini publishes a usable list. */
  availableModels?: string[];
};

async function getConfig(key: string, fallback: string): Promise<string> {
  try {
    const { rows } = await pool.query(
      "SELECT value FROM pipeline_config WHERE key = $1",
      [key]
    );
    return rows[0]?.value || fallback;
  } catch {
    return fallback;
  }
}

async function setConfig(key: string, value: string) {
  await pool.query(
    `INSERT INTO pipeline_config (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
}

/** A trivial prompt: enough to prove the round trip, cheap enough to run often. */
const PING = 'Reply with exactly this JSON and nothing else: {"ok":true}';

async function checkGemini(model: string): Promise<ProviderReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  const report: ProviderReport = {
    provider: "gemini",
    keyPresent: Boolean(apiKey),
    configuredModel: model,
    ok: false,
  };
  if (!apiKey) {
    report.error = "GEMINI_API_KEY not set";
    return report;
  }

  // The model list is the whole point of this endpoint: it is the only
  // authoritative answer to "what may I put in llm_model_gemini?".
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`
    );
    if (res.ok) {
      const data = await res.json();
      report.availableModels = (data?.models || [])
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          (m.supportedGenerationMethods || []).includes("generateContent")
        )
        .map((m: { name?: string }) => String(m.name || "").replace(/^models\//, ""))
        .sort();
    } else {
      report.error = `model list failed ${res.status}: ${(await res.text()).slice(0, 300)}`;
    }
  } catch (e) {
    report.error = `model list failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PING }] }],
          generationConfig: { maxOutputTokens: 32, responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) {
      report.error = `${res.status}: ${(await res.text()).slice(0, 400)}`;
      return report;
    }
    await res.json();
    report.ok = true;
    // A successful call makes the earlier list error irrelevant noise.
    if (report.availableModels) report.error = undefined;
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  }
  return report;
}

async function checkOpenAI(model: string): Promise<ProviderReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  const report: ProviderReport = {
    provider: "openai",
    keyPresent: Boolean(apiKey),
    configuredModel: model,
    ok: false,
  };
  if (!apiKey) {
    report.error = "OPENAI_API_KEY not set";
    return report;
  }

  // What this key may actually use. Model names and tiers change often enough
  // that picking "the cheap one" from memory is how you end up configuring a
  // name that no longer resolves — which is exactly how Anthropic's entry in
  // this file came to 404. Listing is one call and it is authoritative.
  try {
    const list = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (list.ok) {
      const data = await list.json();
      report.availableModels = (data?.data || [])
        .map((m: { id?: string }) => String(m.id || ""))
        // Chat models only: the list also carries embeddings, audio, image
        // and moderation models, which are not candidates here.
        .filter((id: string) => /^(gpt|o[0-9]|chatgpt)/.test(id))
        .sort();
    }
  } catch {
    // A failed listing is not a failed provider — the probe below decides.
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 32,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: PING }],
      }),
    });
    if (!res.ok) {
      report.error = `${res.status}: ${(await res.text()).slice(0, 400)}`;
      return report;
    }
    await res.json();
    report.ok = true;
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  }
  return report;
}

async function checkAnthropic(model: string): Promise<ProviderReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const report: ProviderReport = {
    provider: "anthropic",
    keyPresent: Boolean(apiKey),
    configuredModel: model,
    ok: false,
  };
  if (!apiKey) {
    report.error = "ANTHROPIC_API_KEY not set";
    return report;
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 32,
        messages: [{ role: "user", content: PING }],
      }),
    });
    if (!res.ok) {
      report.error = `${res.status}: ${(await res.text()).slice(0, 400)}`;
      return report;
    }
    await res.json();
    report.ok = true;
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  }
  return report;
}

export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const changed: Record<string, string> = {};

  // Apply any requested change first, so the checks below test the new value.
  for (const [param, configKey] of [
    ["set_gemini", "llm_model_gemini"],
    ["set_openai", "llm_model_openai"],
    ["set_anthropic", "llm_model_anthropic"],
    ["set_provider", "llm_provider"],
  ] as const) {
    const value = params.get(param)?.trim();
    if (!value) continue;
    // Model names are plain identifiers. Anything else is a mistake, or an
    // attempt to put something odd in a value we interpolate into a URL.
    if (!/^[A-Za-z0-9._:-]{1,80}$/.test(value)) {
      return NextResponse.json(
        { error: `${param} must be a plain model name, got: ${value.slice(0, 80)}` },
        { status: 400 }
      );
    }
    await setConfig(configKey, value);
    changed[configKey] = value;
  }

  const [provider, geminiModel, openaiModel, anthropicModel] = await Promise.all([
    getConfig("llm_provider", "rotation"),
    getConfig("llm_model_gemini", "gemini-2.0-flash"),
    getConfig("llm_model_openai", "gpt-4o-mini"),
    getConfig("llm_model_anthropic", "claude-haiku-4-5"),
  ]);

  const providers = await Promise.all([
    checkGemini(geminiModel),
    checkOpenAI(openaiModel),
    checkAnthropic(anthropicModel),
  ]);

  const working = providers.filter((p) => p.ok).map((p) => p.provider);

  return NextResponse.json({
    strategy: provider,
    changed: Object.keys(changed).length ? changed : undefined,
    working,
    // The rewriter falls back across all three, so one working provider is
    // enough to keep publishing. Zero is why the pipeline is silent.
    canPublish: working.length > 0,
    providers,
  });
}
