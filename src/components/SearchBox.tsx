"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/types";
import { detectSearch } from "@/lib/zodiac";

interface SearchBoxProps {
  onResults: (results: SearchResult[], query: string) => void;
  onLoading: (loading: boolean) => void;
  onError?: (errorMessage: string | null) => void;
  initialQuery?: string;
}

export default function SearchBox({
  onResults,
  onLoading,
  onError,
  initialQuery = "",
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = async (searchQuery?: string) => {
    const trimmed = (searchQuery ?? query).trim();
    if (!trimmed) return;

    // 検索モードと属性を判定（星座 / エレメント / クオリティ / 知りたいことのみ）
    const detected = detectSearch(trimmed);
    onError?.(null);

    onLoading(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        "http://localhost:5678/webhook";
      const res = await fetch(`${webhookUrl}/ai-hana-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: detected.query,
          mode: detected.mode, // zodiac / element / quality / topic
          zodiac: detected.zodiac, // 星座名（漢字）。なければ ""
          element: detected.element, // エレメント（火/地/風/水）。なければ ""
          quality: detected.quality, // クオリティ（活動宮/不動宮/柔軟宮）。なければ ""
        }),
      });
      const data = await res.json();
      onResults(data.results || [], trimmed);
    } catch {
      onResults([], trimmed);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder={
            "検索したい条件を最初に入れて、気持ちを教えてください…\n例：「乙女座 仕事のやる気が出ない」「風 最近人間関係に疲れている」「活動宮 やる気が出ない」"
          }
          className="w-full h-32 p-5 text-base sm:text-lg rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none resize-none bg-white/80 backdrop-blur-sm shadow-lg placeholder:text-sm sm:placeholder:text-base placeholder:text-gray-400 text-gray-700"
        />
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim()}
          className="absolute bottom-4 right-4 px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-medium hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          相談する
        </button>
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-pink-100 text-sm text-gray-600">
        <p className="font-medium text-pink-500 mb-2">💡 上手な検索のコツ</p>
        <p className="mb-2 text-gray-500">
          検索条件（星座・エレメント・クオリティ）は<span className="font-medium text-gray-700">文章のいちばん最初</span>に入れてください。
        </p>
        <ul className="space-y-1.5">
          <li>
            <span className="font-medium text-gray-700">星座で探す</span>　例：「<span className="text-pink-500">乙女座</span> 仕事のやる気が出ない」
          </li>
          <li>
            <span className="font-medium text-gray-700">エレメントで探す</span>　例：「<span className="text-pink-500">風</span> 最近人間関係に疲れている」（火・地・風・水）
          </li>
          <li>
            <span className="font-medium text-gray-700">クオリティで探す</span>　例：「<span className="text-pink-500">活動宮</span> 最近人間関係に疲れている」（活動宮・不動宮・柔軟宮）
          </li>
          <li>
            <span className="font-medium text-gray-700">知りたいことだけで探す</span>　例：「最近よく眠れない」
          </li>
        </ul>
      </div>
    </div>
  );
}
