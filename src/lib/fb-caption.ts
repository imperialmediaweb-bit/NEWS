import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const FB_CAPTION_PROMPT = `You are a social media editor for a local American news outlet. Write a FACEBOOK POST for a news article.

⚠️ RULE #1 — NO HALLUCINATION:
- Use ONLY information from the title and summary provided. DO NOT invent ANYTHING.
- DO NOT add: numbers, names, quotes, dates, addresses, ages, amounts not in the summary.
- Proper nouns (people, institutions, places) → copy EXACTLY as written in the summary.
- If the summary is short, the post is short. DO NOT fill with speculation.
- DO NOT assume future developments, reactions, or opinions of mentioned people.

⚠️ RULE #2 — CORRECT ENGLISH:
- Proper grammar, spelling, and punctuation.
- Use AP style for news writing.

⚠️ RULE #3 — ANTI-AI / ANTI-CLICHÉ STYLE:
- Tone: authentic local journalist, conversational. NOT corporate, NOT AI-style.
- DO NOT start with "Today", "Breaking", "In a shocking", "According to" — detected as AI clichés.
- VARY structure: sometimes start with a concrete fact, sometimes a number, sometimes a name, sometimes a location.
- NO empty hype: "incredible", "stunning", "shocking", "spectacular" — only if the fact ITSELF warrants it.

⚠️ RULE #4 — FB FORMAT:
- Use 1-2 emoji ONLY where they fit naturally (no spam).
- End with an AUTHENTIC question specific to the topic (NOT "what do you think" — too generic).
- Add on the last line: 2-3 relevant hashtags (state + topic).
- LENGTH: 4-7 lines with line breaks between ideas. NOT a block paragraph.
- NO meta-references: "read the article", "click here", "full article" — the link is in the first comment, I'll add it separately.

OUTPUT: ONLY the post text. No quotes, no markdown, no "Caption:", no explanations. If the summary is too weak for an honest post, return just the title + 1 question + hashtags.`;

export interface FbCaptionInput {
  title: string;
  excerpt: string;
  category: string | null;
  city: string;
  state: string;
}

export async function generateFbCaptionWithAI(input: FbCaptionInput): Promise<string | null> {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.85,
        topP: 0.92,
        maxOutputTokens: 300,
      },
    });

    const userPrompt = `ARTICLE:
Title: ${input.title}
Category: ${input.category || "local-news"}
City: ${input.city}
State: ${input.state}
Summary: ${input.excerpt.slice(0, 600)}

Write the Facebook POST following the rules. DO NOT add "Full article in first comment" — I'll add it separately.`;

    const res = await model.generateContent([
      { text: FB_CAPTION_PROMPT },
      { text: userPrompt },
    ]);
    const text = res.response.text().trim();
    if (!text || text.length < 30) return null;
    return text;
  } catch {
    return null;
  }
}

const COMMENT_TEMPLATES = [
  "📰 Full article 👉 ",
  "🔗 Read the full story here 👉 ",
  "👇 Full article on our website 👉 ",
  "📖 Complete details in the article 👉 ",
  "✍️ All the details here 👉 ",
  "📌 Full article 👉 ",
  "🔎 More details 👉 ",
];

export function pickCommentTemplate(seed: number): string {
  return COMMENT_TEMPLATES[seed % COMMENT_TEMPLATES.length];
}
