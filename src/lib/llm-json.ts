/**
 * Small JSON-only LLM call for the directory tools (Groq first, then Gemini,
 * then OpenAI). Low temperature: these prompts extract or rephrase, never invent.
 */
export async function llmJson<T>(prompt: string, maxTokens = 1500): Promise<T> {
  const errors: string[] = [];
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: process.env.DIRECTORY_GROQ_MODEL || "openai/gpt-oss-120b", temperature: 0.2, max_tokens: Math.max(maxTokens, 2500), response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!r.ok) throw new Error(`groq ${r.status}`);
      const j = await r.json();
      return JSON.parse(j?.choices?.[0]?.message?.content || "{}") as T;
    } catch (e) { errors.push(String(e)); }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.DIRECTORY_GEMINI_MODEL || "gemini-2.0-flash";
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens, responseMimeType: "application/json" } }),
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) throw new Error(`gemini ${r.status}`);
      const j = await r.json();
      return JSON.parse(j?.candidates?.[0]?.content?.parts?.[0]?.text || "{}") as T;
    } catch (e) { errors.push(String(e)); }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.DIRECTORY_OPENAI_MODEL || "gpt-4o-mini", temperature: 0.2, max_tokens: maxTokens, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) throw new Error(`openai ${r.status}`);
      const j = await r.json();
      return JSON.parse(j?.choices?.[0]?.message?.content || "{}") as T;
    } catch (e) { errors.push(String(e)); }
  }
  throw new Error(`no LLM available: ${errors.join("; ")}`);
}
