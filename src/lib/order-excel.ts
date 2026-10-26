import { zipSync, strToU8 } from "fflate";

/**
 * The client's report as a real .xlsx — a ZIP of XML written here, with no
 * Office library. Ported from the Romanian network, which added it because a
 * client asked to download the report as a spreadsheet and not only read it
 * on a page.
 *
 * What it keeps from that original, because each part answers a complaint:
 *   - every address is a link you click, not text you copy;
 *   - the publication date is a real date cell, so it sorts and filters;
 *   - the header row is frozen and carries an autofilter;
 *   - a second sheet summarises the campaign, which is what gets forwarded.
 *
 * Dates render in New York time. Excel has no timezone of its own: it shows
 * whatever number it is handed, so the conversion happens here.
 */

type Cell =
  | { t: "text"; v: string }
  | { t: "link"; v: string; url: string }
  | { t: "date"; v: number }
  | { t: "number"; v: number }
  | { t: "blank" };

interface Sheet {
  name: string;
  head: string[] | null;
  widths: number[];
  rows: Cell[][];
}

const text = (v: string | null | undefined): Cell => (v ? { t: "text", v } : { t: "blank" });
const link = (url: string | null | undefined, label?: string): Cell =>
  url ? { t: "link", v: label || url, url } : { t: "blank" };

/** Characters XML will not accept at all (ASCII control, except tab/newline). */
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
function x(s: string): string {
  return String(s)
    .replace(INVALID_XML, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function column(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** A date as an Excel serial number, read in New York time. */
function excelSerial(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    })
      .formatToParts(d)
      .map((q) => [q.type, q.value])
  );
  const utc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return utc / 86_400_000 + 25569;
}

// Styles, by index into cellXfs: 0 normal, 1 header, 2 date, 3 link, 4 bold.
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="mm/dd/yyyy hh:mm"/></numFmts>
<fonts count="3">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF5F6F7"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFE3E5E8"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="left"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function sheetXml(f: Sheet): { xml: string; rels: string | null } {
  const rows: string[] = [];
  const links: Array<{ ref: string; url: string }> = [];
  const all: Array<Array<Cell & { head?: boolean }>> = [];
  if (f.head) all.push(f.head.map((v) => ({ t: "text" as const, v, head: true })));
  for (const r of f.rows) all.push(r);
  const colCount = Math.max(f.widths.length, ...all.map((r) => r.length), 1);

  all.forEach((row, i) => {
    const n = i + 1;
    const cells = row
      .map((c, j) => {
        const ref = `${column(j)}${n}`;
        const head = (c as { head?: boolean }).head;
        if (c.t === "blank") return "";
        if (c.t === "date") return `<c r="${ref}" s="2"><v>${c.v}</v></c>`;
        if (c.t === "number") return `<c r="${ref}"><v>${c.v}</v></c>`;
        const style = head ? 1 : c.t === "link" ? 3 : f.head === null && j === 0 ? 4 : 0;
        if (c.t === "link") links.push({ ref, url: c.url });
        const keep = /^\s|\s$/.test(c.v) ? ' xml:space="preserve"' : "";
        return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t${keep}>${x(c.v)}</t></is></c>`;
      })
      .join("");
    rows.push(`<row r="${n}">${cells}</row>`);
  });

  const last = `${column(colCount - 1)}${Math.max(1, all.length)}`;
  const cols = f.widths
    .map((w, j) => `<col min="${j + 1}" max="${j + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  const frozen = f.head
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>`
    : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
  const filter = f.head && all.length > 1 ? `<autoFilter ref="A1:${last}"/>` : "";
  const hyper = links.length
    ? `<hyperlinks>${links.map((l, k) => `<hyperlink ref="${l.ref}" r:id="rId${k + 1}"/>`).join("")}</hyperlinks>`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="A1:${last}"/>${frozen}<sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ""}
<sheetData>${rows.join("")}</sheetData>${filter}${hyper}
<pageMargins left="0.5" right="0.5" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;

  const rels = links.length
    ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${links
        .map(
          (l, k) =>
            `<Relationship Id="rId${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${x(l.url)}" TargetMode="External"/>`
        )
        .join("")}</Relationships>`
    : null;

  return { xml, rels };
}

/** Excel's own rule: at most 31 characters, and none of []:*?/\ */
function sheetName(s: string): string {
  return s.replace(/[[\]:*?/\\]/g, " ").slice(0, 31).trim() || "Sheet";
}

function xlsx(sheets: Sheet[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const types: string[] = [];
  const wbRels: string[] = [];
  const entries: string[] = [];
  const names: string[] = [];
  const defined: string[] = [];

  sheets.forEach((f, i) => {
    const n = i + 1;
    const { xml, rels } = sheetXml(f);
    files[`xl/worksheets/sheet${n}.xml`] = strToU8(xml);
    if (rels) files[`xl/worksheets/_rels/sheet${n}.xml.rels`] = strToU8(rels);
    types.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    wbRels.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`);
    let nm = sheetName(f.name);
    while (names.includes(nm)) nm = sheetName(`${nm.slice(0, 28)} ${n}`);
    names.push(nm);
    entries.push(`<sheet name="${x(nm)}" sheetId="${n}" r:id="rId${n}"/>`);
    if (f.head && f.rows.length) {
      const cols = Math.max(f.widths.length, f.head.length, ...f.rows.map((r) => r.length));
      defined.push(
        `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(nm.replace(/'/g, "''"))}'!$A$1:$${column(cols - 1)}$${f.rows.length + 1}</definedName>`
      );
    }
  });

  const stylesId = sheets.length + 1;
  files["[Content_Types].xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${types.join("\n")}
</Types>`);
  files["_rels/.rels"] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  files["xl/workbook.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView/></bookViews>
<sheets>${entries.join("")}</sheets>${defined.length ? `<definedNames>${defined.join("")}</definedNames>` : ""}
</workbook>`);
  files["xl/_rels/workbook.xml.rels"] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${wbRels.join("\n")}
<Relationship Id="rId${stylesId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  files["xl/styles.xml"] = strToU8(STYLES);

  return zipSync(files, { level: 6 });
}

// ─── the report itself ───────────────────────────────────────────────────────

export interface ExcelPlacement {
  site_slug: string;
  url: string | null;
  placed_at: string | null;
  title?: string | null;
}

export interface ExcelOrder {
  client: string;
  title?: string | null;
  client_url?: string | null;
  package?: string | null;
  created_at?: string | null;
  published_at?: string | null;
}

/** "texas-express" reads as "Texas Express" in a column a client will read. */
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
    month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York",
  });
}

function summary(order: ExcelOrder, placements: ExcelPlacement[]): Sheet {
  const dates = placements
    .map((p) => p.placed_at)
    .filter((v): v is string => Boolean(v))
    .sort();
  const rows: Cell[][] = [[text("Client"), text(order.client)]];
  if (order.client_url) {
    rows.push([text("Client website"), link(order.client_url, order.client_url)]);
  }
  if (order.package) rows.push([text("Package"), text(order.package)]);
  rows.push([text("Report date"), text(day(new Date().toISOString()))]);
  rows.push([text("Articles published"), { t: "number", v: placements.length }]);
  if (dates.length > 1 && dates[0] !== dates[dates.length - 1]) {
    rows.push([text("Publication period"), text(`${day(dates[0])} – ${day(dates[dates.length - 1])}`)]);
  } else if (dates.length) {
    rows.push([text("Published"), text(day(dates[0]))]);
  }
  rows.push([{ t: "blank" }]);
  rows.push([
    text(
      "The table lists only the articles published so far. Every address can be opened and checked."
    ),
  ]);
  rows.push([
    text(
      "Each placement is labelled sponsored content and its links are marked rel=\"sponsored\"."
    ),
  ]);
  return { name: "Summary", head: null, widths: [24, 70], rows };
}

/** One order's report, as a .xlsx file. */
export function orderExcel(order: ExcelOrder, placements: ExcelPlacement[]): Uint8Array {
  const articles: Sheet = {
    name: "Articles",
    head: ["Publication", "Published", "Headline", "Article"],
    widths: [26, 18, 60, 70],
    rows: placements.map((p) => {
      const serial = excelSerial(p.placed_at);
      return [
        text(publicationName(p.site_slug)),
        serial === null ? { t: "blank" as const } : { t: "date" as const, v: serial },
        text(p.title || order.title || ""),
        link(p.url),
      ];
    }),
  };
  return xlsx([articles, summary(order, placements)]);
}

/** A filename a client can find again on their desktop. */
export function excelFilename(client: string): string {
  const safe = (client || "campaign").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const today = new Date().toISOString().slice(0, 10);
  return `${safe || "campaign"}-report-${today}.xlsx`;
}
