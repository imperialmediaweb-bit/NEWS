import pool from "@/lib/db";

export interface RewriteResult {
  title: string;
  summary: string;
  content: string;
  suggestedImageQuery: string;
}

type LLMProvider = "gemini" | "openai" | "anthropic";

// Round-robin counter stored in memory (resets on deploy, which is fine)
let rotationIndex = 0;

const PROVIDER_ORDER: LLMProvider[] = ["gemini", "openai", "anthropic"];

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

/**
 * Get the next provider based on the configured strategy.
 * - "rotation": round-robin Gemini → OpenAI → Claude
 * - "cheapest": always Gemini (cheapest), others as fallback
 * - "gemini" / "openai" / "anthropic": single provider with fallback chain
 */
async function getProviderChain(): Promise<LLMProvider[]> {
  const strategy = await getConfig("llm_provider", "rotation");

  if (strategy === "rotation") {
    const idx = rotationIndex % PROVIDER_ORDER.length;
    rotationIndex++;
    // Start from current rotation position, then try others
    const chain: LLMProvider[] = [];
    for (let i = 0; i < PROVIDER_ORDER.length; i++) {
      chain.push(PROVIDER_ORDER[(idx + i) % PROVIDER_ORDER.length]);
    }
    return chain;
  }

  if (strategy === "cheapest") {
    return ["gemini", "openai", "anthropic"];
  }

  // Single provider with fallback to others
  const primary = strategy as LLMProvider;
  const fallbacks = PROVIDER_ORDER.filter((p) => p !== primary);
  return [primary, ...fallbacks];
}

function buildNewsPrompt(
  siteName: string,
  state: string,
  city: string,
  title: string,
  description: string,
  sourceUrl: string,
  category: string
): string {
  return `You are a professional news journalist writing for ${siteName}, a ${state} news publication based in ${city}.

Rewrite the following news story into an original, SEO-optimized article.

REQUIREMENTS:
- Write 800-1500 words
- Use an engaging headline (different from the original)
- Include a compelling lede paragraph
- Structure with subheadings (H2, H3)
- Write in third person, objective journalistic tone
- Include relevant context and background
- Do NOT copy any sentences verbatim from the source
- Naturally incorporate the location (${city}, ${state}) where relevant
- End with a concluding paragraph that provides outlook or next steps
- Format the article body as HTML with <h2>, <h3>, <p>, <strong>, <em>, <ul>/<li> tags
- Do NOT include the main <h1> title in the content — it will be rendered separately

ORIGINAL HEADLINE: ${title}
ORIGINAL SUMMARY: ${description}
SOURCE URL: ${sourceUrl}
CATEGORY: ${category}

Return ONLY a valid JSON object with these fields (no markdown code fences):
{
  "title": "your new headline",
  "summary": "2-3 sentence meta description under 160 characters",
  "content": "full HTML article body",
  "suggested_image_query": "2-4 word stock photo search query describing the VISUAL SCENE (e.g. 'courthouse steps reporters', 'factory workers assembly line', 'football stadium night game'). Be specific and visual, NOT abstract."
}`;
}

export function buildOpinionPrompt(
  siteName: string,
  state: string,
  city: string,
  title: string,
  description: string,
  penName: string
): string {
  return `You are ${penName}, an opinion columnist for ${siteName} in ${city}, ${state}.

Write an original opinion/editorial piece about the following trending topic.

REQUIREMENTS:
- 800-1200 words
- Take a clear, moderate position with well-reasoned arguments
- Include counterarguments and address them fairly
- Reference real facts and context from the news story
- Use a conversational but authoritative tone
- Include a provocative but not inflammatory headline
- NEVER write about: race, religion, gender identity, sexual orientation, abortion, suicide, mass shootings, child abuse, sexual assault, genocide, slavery, or terrorism in an opinionated way
- If the topic is too sensitive, write about a related but safer angle
- Format as HTML with <h2>, <h3>, <p>, <strong>, <em> tags
- Do NOT include the main <h1> title in the content

TOPIC HEADLINE: ${title}
TOPIC SUMMARY: ${description}

Return ONLY a valid JSON object (no markdown code fences):
{
  "title": "your opinion headline",
  "summary": "2-3 sentence meta description under 160 characters",
  "content": "full HTML article body",
  "suggested_image_query": "2-4 word stock photo search query describing the VISUAL SCENE. Be specific and visual, NOT abstract."
}`;
}

// ─── LLM Provider Implementations ───

async function callGemini(prompt: string): Promise<RewriteResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = await getConfig("llm_model_gemini", "gemini-2.0-flash");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseRewriteResponse(text);
}

async function callOpenAI(prompt: string): Promise<RewriteResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const model = await getConfig("llm_model_openai", "gpt-4o-mini");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return parseRewriteResponse(text);
}

async function callAnthropic(prompt: string): Promise<RewriteResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const model = await getConfig("llm_model_anthropic", "claude-haiku-4-5-20241022");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || "";
  return parseRewriteResponse(text);
}

// ─── Provider dispatch ───

const PROVIDER_FNS: Record<LLMProvider, (prompt: string) => Promise<RewriteResult>> = {
  gemini: callGemini,
  openai: callOpenAI,
  anthropic: callAnthropic,
};

function parseRewriteResponse(text: string): RewriteResult {
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const json = JSON.parse(cleaned);
  return {
    title: json.title || "",
    summary: json.summary || "",
    content: json.content || "",
    suggestedImageQuery: json.suggested_image_query || json.suggestedImageQuery || "",
  };
}

/**
 * Call LLM with automatic fallback chain.
 * Tries each provider in the chain until one succeeds.
 */
async function callWithFallback(prompt: string): Promise<RewriteResult> {
  const chain = await getProviderChain();
  const errors: string[] = [];

  for (const provider of chain) {
    try {
      const result = await PROVIDER_FNS[provider](prompt);
      return result;
    } catch (error) {
      errors.push(`${provider}: ${String(error)}`);
      console.error(`LLM ${provider} failed, trying next...`, error);
    }
  }

  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}

// ─── Public API ───

export async function rewriteArticle(
  siteName: string,
  state: string,
  city: string,
  title: string,
  description: string,
  sourceUrl: string,
  category: string
): Promise<RewriteResult> {
  const prompt = buildNewsPrompt(siteName, state, city, title, description, sourceUrl, category);
  return callWithFallback(prompt);
}

export async function generateOpinion(
  siteName: string,
  state: string,
  city: string,
  title: string,
  description: string
): Promise<RewriteResult> {
  const penNames = [
    "James Whitfield",
    "Sarah Mitchell",
    "David Chen",
    "Maria Rodriguez",
    "Robert Thompson",
  ];
  const penName = penNames[Math.floor(Math.random() * penNames.length)];
  const prompt = buildOpinionPrompt(siteName, state, city, title, description, penName);
  return callWithFallback(prompt);
}
