/**
 * The text of a Facebook post: a short headline, and a line saying the photo
 * is not of the event.
 *
 * What was here before asked gemini-2.0-flash — a model Google has retired —
 * to write a "social" caption, and fell back to a template of hooks,
 * questions and share prompts when it failed, which was every single time.
 * That template is what actually went out: "Have you seen similar cases?" on
 * a football score, and "Share this with a friend from", cut off because the
 * city was never passed. Meta names that pattern in its policy and demotes
 * it.
 *
 * So this does one thing: shorten the headline. No questions, no calls to
 * share, no hashtags, no invented detail. If it fails, the original headline
 * goes out unchanged — which is a perfectly good Facebook post.
 */

/**
 * Every image on this network comes from a stock library — Pexels, Pixabay,
 * Unsplash — chosen by a search query derived from the article. It is not a
 * photograph of the event.
 *
 * The first post out of this system carried a picture of the Parc des
 * Princes, with a groundskeeper mowing, above a story about a game played at
 * the Stade de France. Nobody reading it would know the picture was not of
 * the match. Saying so is the difference between an illustration and a false
 * claim about a real event.
 */
export const PHOTO_DISCLAIMER = "📷 Stock photo — illustrative, not of this event.";

const PROMPT = `Shorten this news headline for a Facebook post.

Rules:
- Keep it under 90 characters.
- Keep every fact: names, numbers, places, scores. Change none of them.
- Invent nothing. If you cannot shorten it without losing a fact, return it unchanged.
- No questions. No "share this". No hashtags. No emoji. No quotation marks.
- Return the headline alone, nothing else.`;

/**
 * Shorten a headline with the cheapest model available.
 *
 * Returns null on any failure — a dead model, a bad key, a refusal — and the
 * caller keeps the original headline. This is cosmetic; it must never be the
 * reason a post does not go out.
 */
export async function shortenHeadline(title: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.FB_CAPTION_MODEL || "gpt-5-nano";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: title },
        ],
        // The gpt-5 family and the o-series reject max_tokens and take
        // max_completion_tokens; everything before them is the other way
        // round. Same split as the article rewriter.
        ...(/^(gpt-[5-9]|o[0-9])/.test(model)
          ? { max_completion_tokens: 200 }
          : { max_tokens: 60, temperature: 0.3 }),
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const out = String(data?.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/^["']|["']$/g, "");

    // A "shortened" headline longer than the original, or empty, or one that
    // has clearly been rewritten into something else, is not an improvement.
    if (!out || out.length < 15 || out.length > title.length) return null;
    return out;
  } catch {
    return null;
  }
}
