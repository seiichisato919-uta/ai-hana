import { NextRequest, NextResponse } from "next/server";
import { getEmbedding } from "@/lib/openai";
import { queryVectors } from "@/lib/pinecone";
import { appendSearchLog } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    // 検索ログをスプレッドシートに記録（レスポンスをブロックしない）
    appendSearchLog(query).catch((err) =>
      console.error("Failed to append search log:", err)
    );

    // 1. ユーザーの入力をベクトル化
    const embedding = await getEmbedding(query);

    // 2. Pineconeで類似度検索（上位5件）
    const matches = await queryVectors(embedding, 5);

    // 3. 結果を整形して返す
    const results = matches.map((match) => ({
      id: match.id,
      score: match.score,
      title: (match.metadata as { title: string })?.title || "",
      body: (match.metadata as { body: string })?.body || "",
      url: (match.metadata as { url: string })?.url || "",
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
