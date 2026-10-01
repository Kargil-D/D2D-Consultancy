import { JWT } from "google-auth-library";
import { ApiError } from "@/lib/apiError";

/**
 * Minimal Google Sheets v4 REST client, authenticated as a Google Cloud service account.
 * Either share the target spreadsheet with GOOGLE_SHEETS_CLIENT_EMAIL as an Editor, or — when the
 * company Workspace blocks sharing outside the domain — set GOOGLE_SHEETS_IMPERSONATE to a company
 * user who can edit the sheet, and grant the service account domain-wide delegation for the
 * spreadsheets scope in the Workspace Admin console.
 * Server-only — the private key must never reach a "use client" file.
 */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

export type CellValue = string | number | null;

/** Column display format applied to every data row (header row stays plain bold text). */
export type ColumnFormat = "text" | "number" | "percent" | "date";

let client: JWT | null = null;

export function isGoogleSheetsConfigured(): boolean {
  return !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY);
}

function getClient(): JWT {
  if (client) return client;
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !key) throw new ApiError(500, "Google Sheets credentials are not configured");
  client = new JWT({
    email,
    // Env UIs (Vercel, .env files) store the PEM's newlines as literal "\n".
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    subject: process.env.GOOGLE_SHEETS_IMPERSONATE || undefined,
  });
  return client;
}

async function sheetsRequest<T>(spreadsheetId: string, path: string, method: "GET" | "POST" | "PUT", data?: unknown): Promise<T> {
  const res = await getClient().request<T>({
    url: `${SHEETS_API}/${encodeURIComponent(spreadsheetId)}${path}`,
    method,
    data: data as object | undefined,
  });
  return res.data;
}

/** A1 reference for a tab name — quoted, with embedded quotes doubled, so names with spaces work. */
function tabRef(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

/** 1-based column number → letters (1 → A, 27 → AA). */
function columnLetter(n: number): string {
  let s = "";
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

/** Google Sheets date serial (days since 1899-12-30) for a Date's calendar day in Asia/Kolkata. */
export function toSheetDate(date: Date | null | undefined): number | null {
  if (!date) return null;
  const [y, m, d] = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000 + 25_569;
}

const NUMBER_FORMATS: Record<Exclude<ColumnFormat, "text">, { type: string; pattern: string }> = {
  number: { type: "NUMBER", pattern: "#,##0" },
  percent: { type: "NUMBER", pattern: "0.00" },
  date: { type: "DATE", pattern: "dd-mmm-yyyy" },
};

interface SpreadsheetMeta {
  sheets: { properties: { sheetId: number; title: string } }[];
}

/** Returns each requested tab's numeric sheetId, creating any tab that doesn't exist yet. */
async function ensureTabs(spreadsheetId: string, titles: string[]): Promise<Record<string, number>> {
  const meta = await sheetsRequest<SpreadsheetMeta>(spreadsheetId, "?fields=sheets.properties(sheetId,title)", "GET");
  const ids: Record<string, number> = {};
  for (const s of meta.sheets) ids[s.properties.title] = s.properties.sheetId;

  const missing = titles.filter((t) => ids[t] === undefined);
  if (missing.length > 0) {
    const res = await sheetsRequest<{ replies: { addSheet: { properties: { sheetId: number; title: string } } }[] }>(
      spreadsheetId,
      ":batchUpdate",
      "POST",
      { requests: missing.map((title) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } })) },
    );
    for (const r of res.replies) ids[r.addSheet.properties.title] = r.addSheet.properties.sheetId;
  }
  return ids;
}

export interface TabSnapshot {
  title: string;
  headers: string[];
  formats: ColumnFormat[];
  rows: CellValue[][];
}

/**
 * Overwrites a tab with a full snapshot: header + rows written from A1, then everything below the
 * last row (within these columns) is cleared. Writing before clearing means the tab is never
 * momentarily empty for someone looking at it. Values go in RAW so text like "=..." from a
 * customer name or remark is stored as text, never evaluated as a formula.
 */
export async function writeTabSnapshot(spreadsheetId: string, tab: TabSnapshot): Promise<void> {
  const ids = await ensureTabs(spreadsheetId, [tab.title]);
  const sheetId = ids[tab.title];
  const lastCol = columnLetter(tab.headers.length);
  const ref = tabRef(tab.title);
  const values = [tab.headers, ...tab.rows.map((r) => r.map((v) => v ?? ""))];

  await sheetsRequest(spreadsheetId, "/values:batchUpdate", "POST", {
    valueInputOption: "RAW",
    data: [{ range: `${ref}!A1:${lastCol}${values.length}`, values }],
  });
  await sheetsRequest(spreadsheetId, "/values:batchClear", "POST", {
    ranges: [`${ref}!A${values.length + 1}:${lastCol}`],
  });

  // Re-applied every sync (cheap, idempotent) so formatting holds even if the tab was created by hand.
  const requests: unknown[] = [
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: tab.headers.length },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
  ];
  tab.formats.forEach((format, i) => {
    if (format === "text") return;
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
        cell: { userEnteredFormat: { numberFormat: NUMBER_FORMATS[format] } },
        fields: "userEnteredFormat.numberFormat",
      },
    });
  });
  await sheetsRequest(spreadsheetId, ":batchUpdate", "POST", { requests });
}
