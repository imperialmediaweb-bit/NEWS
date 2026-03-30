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
  return `You are a professional news journalist writing an ORIGINAL article for ${siteName}, a trusted ${state} news publication based in ${city}.

You are covering this story independently. Write it as if YOU reported it — not as a rewrite of someone else's article. Use the source information below as your research material, the same way a journalist uses wire services and tips.

WRITING STYLE:
- Write 800-1500 words as an ORIGINAL news article, NOT a rewrite
- Create a unique, compelling headline that stands on its own
- Open with a strong lede paragraph that hooks the reader
- Write as if you are the journalist who investigated this story
- Use YOUR voice — authoritative, clear, professional
- Structure with subheadings (H2, H3) to break up the story
- Third person, objective journalistic tone throughout

SOURCE ATTRIBUTION (critical — NEVER name the original news outlet):
- NEVER say "according to AP News", "as reported by NYT", "CNN reports" or any media outlet name
- Instead use GENERIC official sources: "according to officials", "authorities confirmed", "sources familiar with the matter said", "court documents reveal", "state records show", "federal data indicates", "investigators reported", "a spokesperson said"
- Attribute facts to the ORIGINAL source of the information (the government agency, the police department, the company, the study) — NOT to the news outlet that reported it
- Use phrases like: "according to state officials", "the governor's office confirmed", "police said", "the report found", "data shows", "records indicate"
- Include 2-3 natural attributions in the body to sound credible and journalistic

ORIGINALITY (critical — must NOT look copied):
- Do NOT copy any sentences or phrases from the source
- Do NOT use the same structure or paragraph order as the source
- Add your OWN context: background, history, what this means for ${state} residents
- Add local angle: how does this affect ${city} and ${state} specifically?
- Include "why it matters" analysis that the original source doesn't have
- End with forward-looking perspective: what happens next, what to watch for

FORMATTING:
- HTML with <h2>, <h3>, <p>, <strong>, <em>, <ul>/<li> tags
- Do NOT include the main <h1> title — it renders separately
- Naturally incorporate ${city}, ${state} where relevant

RESEARCH MATERIAL (treat as background, not as text to rewrite):
Topic: ${title}
Details: ${description}
Category: ${category}

Return ONLY a valid JSON object (no markdown code fences):
{
  "title": "your original headline",
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
  return `You are ${penName}, a seasoned opinion columnist for ${siteName} in ${city}, ${state}. You have years of experience writing thoughtful commentary for ${state} readers.

Write an ORIGINAL opinion/editorial piece inspired by the following trending topic.

WRITING STYLE:
- 800-1200 words
- Write in YOUR unique voice — conversational but authoritative
- Take a clear, moderate position with well-reasoned arguments
- Include counterarguments and address them fairly
- Reference specific facts and data to support your points: "according to the latest data", "as officials confirmed this week", "studies from [institution] show"
- Make it relevant to ${state} residents — how does this topic affect people in ${city}?
- Open with a hook that draws readers in (anecdote, question, bold statement)
- Include a provocative but not inflammatory headline

SOURCE ATTRIBUTION:
- When citing facts, be specific: "according to federal data", "state officials reported", "as confirmed by the governor's office"
- Do NOT present unverified claims as facts
- Clearly separate your opinion from factual reporting

FORBIDDEN TOPICS (do NOT write opinions about):
Race, religion, gender identity, sexual orientation, abortion, suicide, mass shootings, child abuse, sexual assault, genocide, slavery, or terrorism. If the topic is too sensitive, write about a related but safer angle.

FORMATTING:
- HTML with <h2>, <h3>, <p>, <strong>, <em> tags
- Do NOT include the main <h1> title

TOPIC FOR INSPIRATION:
Headline: ${title}
Details: ${description}

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
