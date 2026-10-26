/**
 * Turns the loose text in a stored article into real paragraphs.
 *
 * Paid placements were inserted by dropping the client's copy straight into
 * the page. The newlines survived into the database and then did nothing in a
 * browser, so a thousand-word article rendered as one unbroken wall of text on
 * fifty newspapers. Nobody reads that, and the client who paid for it sees a
 * page that looks like a mistake — which it was.
 *
 * Only text sitting outside any <p> is touched. Anything already marked up is
 * left exactly as it is, so running this twice changes nothing the second
 * time, and markup written on purpose is never rewritten.
 */
export function paragraphize(html: string): string {
  if (!html) return html;

  const pieces = html.split(/(<[^>]+>)/);
  let depth = 0;
  let out = "";

  for (const piece of pieces) {
    if (piece.startsWith("<")) {
      const tag = piece.toLowerCase();
      // Only paragraph-level containers matter: a stray <strong> around part
      // of the copy should not stop the rest of it being split.
      if (/^<p[\s>]/.test(tag) || /^<(h[1-6]|li|blockquote|td|figcaption)[\s>]/.test(tag)) depth++;
      else if (/^<\/(p|h[1-6]|li|blockquote|td|figcaption)>/.test(tag)) depth = Math.max(0, depth - 1);
      out += piece;
      continue;
    }

    if (depth > 0 || !piece.trim()) {
      out += piece;
      continue;
    }

    // A blank line is a paragraph break; a single newline inside a paragraph
    // is just how the client happened to wrap their text, so it becomes a
    // space rather than a break.
    const paragraphs = piece
      .split(/\n\s*\n+/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);

    out += paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  return out;
}
