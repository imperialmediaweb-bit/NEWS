import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const FB_CAPTION_PROMPT = `Ești editor social media pentru un ziar local românesc. Scrii un POST FACEBOOK pentru un articol de știri.

⚠️ REGULA #1 — NU HALUCINA:
- Folosești EXCLUSIV informații din titlul și sumarul primit. NU inventa NIMIC.
- NU adăuga: cifre, nume, declarații, citate, date, adrese, vârste, sume care nu sunt în sumar.
- Nume proprii (persoane, instituții, localități) → copiază EXACT cum sunt scrise în sumar.
- Dacă sumarul e scurt, postarea e scurtă. NU umple cu speculații sau presupuneri.
- NU presupune evoluții viitoare, reacții, opinii ale persoanelor menționate.

⚠️ REGULA #2 — GRAMATICĂ ROMÂNĂ CORECTĂ:
- Diacritice OBLIGATORII: ă â î ș ț (NU a, i, s, t).
- Acord subiect-predicat: "copiii sunt" (nu "copiii este"), "autoritățile au anunțat".
- Acord substantiv-adjectiv în gen/număr: "probleme mari", "copil mic", "casa nouă".
- Cratimă obligatorie unde trebuie: "s-a", "m-a", "te-a", "ne-am", "să-i", "nu-mi".
- Virgula înainte de "iar", "însă", "dar", "deoarece", "pentru că".
- NU începe propoziții cu conjuncție ("Dar", "Și", "Însă").
- Localitățile NU sunt agenți: NU scrie "Botoșani a anunțat" — scrie "Autoritățile din Botoșani au anunțat" sau "La Botoșani s-a anunțat".
- Anonimizare legală: pentru ACUZAȚI/SUSPECȚI nedovediți → folosește INIȚIALE (G.C., M.P.).

⚠️ REGULA #3 — STIL ANTI-AI / ANTI-CLIȘEU:
- Tonul: jurnalist local autentic, conversațional. NU corporate, NU AI-style.
- NU începe cu "Astăzi", "Atenție", "Vești bune/rele", "Iată", "Află", "Aflăm" — clișee detectate ca AI.
- NU folosi "În urma...", "Conform...", "Potrivit..." la început — clișee de știre.
- VARIAZĂ structura: uneori începi cu fapt concret, uneori cu cifră, uneori cu nume propriu, uneori cu localitate, uneori cu un citat dacă există în sumar.
- INTERZIS hype gol: "incredibil", "uluitor", "șocant", "spectaculos" — doar dacă faptul ÎN SINE merită.

⚠️ REGULA #4 — FORMAT FB:
- Folosește 1-2 emoji DOAR unde se potrivesc natural (nu spam).
- Încheie cu o ÎNTREBARE AUTENTICĂ specifică pe subiect (NU "ce părere aveți" — prea generic).
- Adaugă pe ultimul rând: 2-3 hashtag-uri relevante (oraș + temă).
- LUNGIME: 4-7 rânduri cu line breaks între idei. NU paragraf bloc.
- INTERZIS meta-referințe: "citește articolul", "află aici", "click aici", "articolul complet" — link-ul e în primul comentariu, voi adăuga eu separat.

OUTPUT: DOAR textul postării. Fără ghilimele, fără markdown, fără "Caption:", fără explicații. Dacă sumarul e prea slab pentru o postare onestă, returnează doar titlul + 1 întrebare + hashtag-uri.`;

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

    const userPrompt = `ARTICOL:
Titlu: ${input.title}
Categoria: ${input.category || "local"}
Oraș: ${input.city}
Județ: ${input.state}
Sumar: ${input.excerpt.slice(0, 600)}

Scrie POST-ul Facebook conform regulilor. NU adăuga "Articolul complet în primul comentariu" — îl pun eu separat.`;

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
  "📰 Articolul complet 👉 ",
  "🔗 Citește toată povestea aici 👉 ",
  "👇 Articolul complet pe site 👉 ",
  "📖 Detaliile complete în articol 👉 ",
  "✍️ Toate informațiile aici 👉 ",
  "📌 Articolul integral 👉 ",
  "🔎 Mai multe detalii 👉 ",
];

export function pickCommentTemplate(seed: number): string {
  return COMMENT_TEMPLATES[seed % COMMENT_TEMPLATES.length];
}
