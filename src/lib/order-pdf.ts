import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ExcelOrder, ExcelPlacement } from "@/lib/order-excel";

/**
 * The same report as a PDF — the file a client forwards or prints, where the
 * spreadsheet is the one they sort. Both are built from order_placements, so
 * neither can claim a placement the other does not.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

/** "texas-express" reads as "Texas Express" in a document a client will read. */
function publicationName(slug: string): string {
  return (slug || "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function day(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
  });
}

/** The standard fonts cannot draw anything outside WinAnsi. */
function clip(s: string, max: number): string {
  const safe = (s || "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  return safe.length > max ? `${safe.slice(0, max - 1)}...` : safe;
}

export async function orderPdf(
  order: ExcelOrder,
  placements: ExcelPlacement[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Campaign report — ${order.client}`);
  doc.setProducer("Media Chief");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ink = rgb(0.07, 0.07, 0.07);
  const grey = rgb(0.45, 0.47, 0.5);
  const rule = rgb(0.88, 0.9, 0.92);
  const accent = rgb(0.04, 0.37, 0.66);

  let page = doc.addPage(A4);
  let y = A4[1] - MARGIN;

  const put = (
    s: string,
    o: { size?: number; font?: typeof regular; color?: typeof ink; x?: number } = {}
  ) =>
    page.drawText(s, {
      x: o.x ?? MARGIN,
      y,
      size: o.size ?? 10,
      font: o.font ?? regular,
      color: o.color ?? ink,
    });

  put("CAMPAIGN REPORT", { size: 9, font: bold, color: grey });
  y -= 26;
  put(clip(order.client, 60), { size: 20, font: bold });
  y -= 20;
  put(
    [
      order.package ? clip(order.package, 40) : null,
      `${placements.length} publication${placements.length === 1 ? "" : "s"}`,
      order.published_at ? `from ${day(order.published_at)}` : null,
    ]
      .filter(Boolean)
      .join("   ·   "),
    { size: 9, color: grey }
  );
  y -= 22;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 1, color: rule });
  y -= 20;

  put("#", { size: 8, font: bold, color: grey });
  put("PUBLICATION", { size: 8, font: bold, color: grey, x: MARGIN + 22 });
  put("ADDRESS", { size: 8, font: bold, color: grey, x: MARGIN + 150 });
  put("DATE", { size: 8, font: bold, color: grey, x: A4[0] - MARGIN - 60 });
  y -= 14;

  placements.forEach((p, i) => {
    if (y < 86) {
      page = doc.addPage(A4);
      y = A4[1] - MARGIN;
    }
    put(String(i + 1), { size: 9, color: grey });
    put(clip(publicationName(p.site_slug), 22), { size: 9, font: bold, x: MARGIN + 22 });
    put(clip(p.url || "", 58), { size: 7.5, color: accent, x: MARGIN + 150 });
    put(day(p.placed_at), { size: 8, color: grey, x: A4[0] - MARGIN - 60 });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.5, color: rule });
    y -= 12;
  });

  const note = [
    "Every placement is published as clearly labelled sponsored content, and the links to the",
    "client's site are marked rel=\"sponsored\", as search engines require of paid placements.",
    "The addresses above are permanent. We make no promise of traffic, rankings or customers.",
  ];
  doc.getPages().forEach((pg, idx, all) => {
    note.forEach((line, i) =>
      pg.drawText(clip(line, 118), { x: MARGIN, y: 54 - i * 9, size: 7, font: regular, color: grey })
    );
    pg.drawText(`page ${idx + 1} of ${all.length}`, {
      x: A4[0] - MARGIN - 50, y: 24, size: 7, font: regular, color: grey,
    });
  });

  return doc.save();
}

export function pdfFilename(client: string): string {
  const safe = (client || "campaign").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${safe || "campaign"}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
}
