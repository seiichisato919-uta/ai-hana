import { NextRequest, NextResponse } from "next/server";
import { fetchSheetData } from "@/lib/google-sheets";
import { getEmbedding } from "@/lib/openai";
import { ensureIndex, upsertVectors, UpsertRecord } from "@/lib/pinecone";

export async function POST(req: NextRequest) {
  // シンプルなシークレットキーによる認証
  const { secret } = await req.json();
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 0. Pineconeインデックスが存在しなければ作成
    await ensureIndex();

    // 1. Google Sheetsからデータ取得
    const rows = await fetchSheetData();
    if (rows.length === 0) {
      return NextResponse.json({ message: "No data found in sheet" });
    }

    // 2. 各行の本文をベクトル化してPineconeにupsert
    const records: UpsertRecord[] = [];
    for (const row of rows) {
      const embedding = await getEmbedding(row.body);
      records.push({
        id: row.id,
        values: embedding,
        metadata: {
          title: row.title,
          body: row.body,
          url: row.url,
        },
      });
    }

    await upsertVectors(records);

    return NextResponse.json({
      message: "Sync completed",
      count: records.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
