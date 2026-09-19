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
  return `You are a reporter writing a short news item for ${siteName}, a local news site serving ${city}, ${state}.

You did not witness this story and you have not interviewed anyone. All you have is the research material at the end of this prompt. Your job is to report accurately what that material says, credit where it came from, and stop.

THE ONE RULE THAT OVERRIDES EVERYTHING ELSE:
Write nothing you were not told. If the material does not contain a detail, that detail does not go in the article. Not a quote, not a date, not a figure, not a job title, not a hometown, not a motive, not a reaction, not a "what happens next". A short article that is entirely true is the goal; a long article containing invented detail is a failure, no matter how well it reads.

LENGTH — proportional to what you actually know:
- Thin material (a headline and a line or two): 150-250 words. This is normal and correct. Do not pad.
- Substantial material (several paragraphs of detail): up to 600 words.
- Never stretch. If you find yourself adding background, context or speculation to reach a length, you have already gone wrong.

ATTRIBUTION — never invent a source:
- Do NOT write that officials confirmed, a spokesperson said, sources familiar with the matter reported, records show, data indicates or a study found ANYTHING unless the research material says so. Attributing a statement to a real organisation that never made it is the most serious error you can commit here.
- Carry over an attribution only when the material contains it.
- Where the material gives no source, state the fact plainly or write "reportedly".
- Never invent a quotation. Never place words in quotation marks that are not in the material verbatim.
- Do not add attributions to sound authoritative. A sentence that sounds journalistic and is untrue is worse than a plain one.

PEOPLE — the person written about will read this:
- Never invent biography: when someone started something, what their coaches or colleagues thought of them, where they are from, what they have decided, what they plan next.
- Never describe someone's talent, character, motives or feelings unless the material does.
- Never describe a private individual as an inspiration, a symbol or an example for others. That is commentary, and it is the kind that gets a correction request.
- Ordinary people who appear in a news story did not ask to be written about. Give them only what the material gives them.

LOCAL ANGLE — only where one genuinely exists:
- If the story has no connection to ${city} or ${state}, do not manufacture one.
- Do not claim local reaction, local impact or local interest that you were not told about.

ORIGINALITY:
- Use your own sentences; do not copy phrasing from the material.
- Originality means how you write it, not adding things that were not there.

LEGAL SAFETY (mandatory):
- NEVER accuse anyone of a crime — use "alleged", "accused of", "suspected of", "charged with"
- NEVER say someone is "guilty" — only a court decides. Use "convicted of" only after a conviction
- NEVER publish home addresses, phone numbers, medical details or other private information
- NEVER name minors involved in crimes or legal cases
- NEVER name sexual assault victims
- For ongoing investigations: "under investigation", "authorities are looking into"
- Never call a person a terrorist, murderer, thief or criminal unless convicted
- For lawsuits: "the lawsuit alleges", "according to the complaint" — not "they did X"
- For deaths: "died", not "was killed", unless officially ruled a homicide

FORMATTING:
- HTML using <h2>, <p>, <strong>, <em>, <ul>/<li>
- Do NOT include an <h1> — the title renders separately
- Subheadings only if the article is long enough to need them
- The headline must describe what happened, plainly. No hype, no superlatives the material does not support

RESEARCH MATERIAL — this is everything you know:
Topic: ${title}
Details: ${description}
Category: ${category}

Return ONLY a valid JSON object (no markdown code fences):
{
  "title": "a plain, accurate headline",
  "summary": "1-2 sentences under 160 characters, containing only what the material supports",
  "content": "the article body as HTML",
  "suggested_image_query": "2-4 words describing a GENERIC scene, never a specific person (e.g. 'courthouse exterior', 'track and field stadium', 'city council chamber'). Stock photography of a real named individual does not exist, so never request one."
}`;
}

/**
 * Strip invented attribution from an article that is already published.
 *
 * This is NOT a rewrite. The source material those articles were built from is
 * long gone; all that survives is the output the old prompt produced. Feeding
 * that back through the new prompt would not recover what was true — it would
 * only launder the same invented detail into cleaner prose.
 *
 * What can honestly be repaired is the specific harm: sentences that put words
 * into the mouth of a real organisation. "State athletic officials confirmed
 * the record" becomes "The record was reported" — the claim survives, unproven
 * as it always was, but we stop asserting that a named body said it.
 *
 * Everything else is left exactly as it stands, deliberately. An edit that
 * also tidies the prose would make it impossible to tell later which articles
 * were touched and why.
 */
export async function stripInventedAttribution(
  title: string,
  content: string
): Promise<{ content: string; changed: boolean }> {
  const prompt = `The HTML article below was produced by a system that was instructed to invent sourcing — to add phrases like "officials confirmed", "a spokesperson said", "sources familiar with the matter reported", "records show" and "studies show" so the writing would sound authoritative. Those attributions are fabricated. Nobody said those things.

Your single job is to remove that false sourcing. Nothing else.

DO:
- Delete or rephrase every clause that attributes a statement to someone who is not named with a specific, checkable identity. "Officials confirmed the bridge will reopen Monday" becomes "The bridge is expected to reopen Monday". "A spokesperson said the company is expanding" becomes "The company is reportedly expanding".
- Remove invented quotations — any quoted speech attributed to an unnamed official, spokesperson, coach, expert or source.
- Keep an attribution that names a specific identifiable body AND is plainly integral to the story (a court filing in a court report, a named police department in a crime report). If you are unsure, remove it.

DO NOT:
- Change any fact, figure, date, name or place.
- Add anything at all. Not a word of new information, context or framing.
- Improve, shorten, restructure or re-style the writing.
- Remove whole paragraphs. Edit the offending clause and leave the rest.

If the article contains no invented attribution, return it completely unchanged.

Return ONLY valid JSON, no markdown fences:
{
  "changed": true or false,
  "content": "the article HTML, edited only as described above"
}

HEADLINE: ${title}

ARTICLE HTML:
${content}`;

  const result = await callWithFallback(prompt);
  // callWithFallback returns the parsed object; the fields we need are content
  // and, where the model supplied it, changed.
  const out = result as unknown as { content?: string; changed?: boolean };
  if (!out.content || out.content.length < content.length * 0.4) {
    // A response that lost more than half the article is not an edit, it is a
    // failure. Keep the original rather than publish a mangled one.
    return { content, changed: false };
  }
  return { content: out.content, changed: out.changed !== false && out.content !== content };
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
- Support your points only with facts present in the source material. Do not
  reach for "as officials confirmed this week" or "studies from [institution]
  show" unless the source actually says so — inventing a source to sound
  authoritative is fabrication.
- Make it relevant to ${state} residents — how does this topic affect people in ${city}?
- Open with a hook that draws readers in (anecdote, question, bold statement)
- Include a provocative but not inflammatory headline

SOURCE ATTRIBUTION:
- Cite only what the source cites. Never attribute a statement to federal data,
  state officials or any named office unless the source material does.
- Do NOT present unverified claims as facts
- Clearly separate your opinion from factual reporting

FORBIDDEN TOPICS (do NOT write opinions about):
Race, religion, gender identity, sexual orientation, abortion, suicide, mass shootings, child abuse, sexual assault, genocide, slavery, or terrorism. If the topic is too sensitive, write about a related but safer angle.

LEGAL SAFETY (MANDATORY):
- NEVER accuse anyone of a crime — use "alleged", "accused of", "charged with"
- NEVER say someone is "guilty" unless convicted by a court
- NEVER publish private info: addresses, phone numbers, medical details
- NEVER name minors or sexual assault victims
- Use "reportedly", "allegedly", "according to authorities" when in doubt

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

/**
 * Rewrite a paid advertorial for one specific site.
 *
 * A campaign is bought once and runs across the network, so without this every
 * site publishes a byte-identical copy — fifty duplicates on fifty domains,
 * which is the pattern Google calls scaled content abuse and which would cost
 * the whole network its AdSense at once, not one site.
 *
 * The hard constraint is that this is someone's paid message: the wording and
 * the local framing may change, the claims may not. Inventing a detail about a
 * paying client is a worse failure than duplicate content, so the prompt is
 * explicit that facts, names, figures and offers are to be carried over
 * untouched.
 */
export async function rewriteCampaignForSite(
  siteName: string,
  state: string,
  city: string,
  title: string,
  content: string,
  sponsorName: string
): Promise<RewriteResult> {
  const prompt = `You are an editor at ${siteName}, a local news outlet serving ${city}, ${state}.

You are preparing a piece of SPONSORED CONTENT for publication. The sponsor is ${sponsorName || "the advertiser"}.

Rewrite the copy below in your own words so it reads naturally to a reader in ${city}, ${state}, and does not read identically to the version running on other outlets.

ABSOLUTE RULES — breaking any of these is worse than a dull rewrite:
- Do NOT invent, add, change or remove any fact, claim, statistic, price, date, product name, company name, contact detail or offer. Everything factual must come from the source copy and survive unchanged.
- Do NOT invent quotes or attribute statements to anyone not already quoted.
- Do NOT add local details you were not given. You may address the local reader in general terms; you may not claim the sponsor has a branch in ${city} or anything similar unless the copy says so.
- Do NOT write it as news. It is an advertisement and must not imitate newsroom reporting.
- Keep roughly the same length as the source.

Return ONLY valid JSON, no markdown fences:
{
  "title": "a rewritten headline, plain and non-sensational",
  "summary": "one or two sentences, under 200 characters",
  "content": "the rewritten body as HTML using only <p>, <h2>, <ul>, <li>, <strong> tags",
  "suggestedImageQuery": "2-4 English keywords describing a suitable photo"
}

SOURCE HEADLINE:
${title}

SOURCE COPY:
${content}`;

  return callWithFallback(prompt);
}

/**
 * Short article rewrite for seed/breaking mode (300-500 words).
 * Faster, cheaper, used for initial site population.
 */
export async function rewriteArticleShort(
  siteName: string,
  state: string,
  city: string,
  title: string,
  description: string,
  category: string
): Promise<RewriteResult> {
  const prompt = `You are a news journalist writing a SHORT article for ${siteName}, a ${state} news publication in ${city}.

Write a concise 300-500 word news article. Be direct and factual.

RULES:
- 300-500 words ONLY — short and punchy
- Original headline, different from the source
- Strong opening paragraph with the key facts
- 2-3 short body paragraphs with context
- One subheading (H2) to break up the text
- Third person, objective tone
- Attribute facts generically: "officials said", "authorities confirmed", "records show"
- NEVER name other news outlets as sources
- NEVER accuse anyone — use "alleged", "accused of", "charged with"
- NEVER publish private info or name minors/victims
- Add a brief ${state} local angle where possible
- HTML format: <h2>, <p>, <strong>, <em> tags
- Do NOT include <h1> title

Topic: ${title}
Details: ${description}
Category: ${category}

Return ONLY valid JSON (no code fences):
{
  "title": "headline",
  "summary": "meta description under 160 chars",
  "content": "HTML article body",
  "suggested_image_query": "2-4 word visual scene description for stock photo"
}`;
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
