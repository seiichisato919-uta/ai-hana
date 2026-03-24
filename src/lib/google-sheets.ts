import { google } from "googleapis";

export interface SheetRow {
  id: string;
  title: string;
  body: string;
  url: string;
}

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getWriteAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendSearchLog(query: string): Promise<void> {
  const auth = getWriteAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // 日本時間 (JST = UTC+9) で現在日時を生成
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timestamp = jst
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, "")
    .replace(/-/g, "/");

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "検索ログ!A:B",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[timestamp, query]],
    },
  });
}

export async function fetchSheetData(): Promise<SheetRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "A:D",
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) return [];

  // 1行目がヘッダーの場合はスキップ、データ行のみ返す
  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => row[0] && row[1] && row[2])
    .map((row) => ({
      id: String(row[0]),
      title: String(row[1]),
      body: String(row[2]),
      url: row[3] ? String(row[3]) : "",
    }));
}
