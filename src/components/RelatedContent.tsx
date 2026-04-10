"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResult, Category } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORIES,
} from "@/lib/types";

interface RelatedContentProps {
  currentId: string;
  query: string;
}

export default function RelatedContent({
  currentId,
  query,
}: RelatedContentProps) {
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const stored = sessionStorage.getItem("searchResults");
        if (!stored) {
          setLoading(false);
          return;
        }

        const allResults: SearchResult[] = JSON.parse(stored);
        // 現在のコンテンツを除外
        const remaining = allResults.filter((r) => r.id !== currentId);

        // 不足カテゴリを判定
        const presentCategories = new Set(remaining.map((r) => r.category));
        const missingCategory = CATEGORIES.find(
          (c) => !presentCategories.has(c)
        );

        let finalRecs = remaining.slice(0, 5);

        // 不足カテゴリがあれば n8n API で補充
        if (missingCategory && finalRecs.length < 6) {
          try {
            const webhookUrl =
              process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
              "http://localhost:5678/webhook";
            const excludeIds = [
              currentId,
              ...finalRecs.map((r) => r.id),
            ];
            const res = await fetch(`${webhookUrl}/ai-hana-recommend`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: currentId,
                excludeIds,
                needCategory: missingCategory,
              }),
            });
            const data = await res.json();
            if (data.recommendations && data.recommendations.length > 0) {
              finalRecs = [...finalRecs, ...data.recommendations].slice(0, 6);
            }
          } catch {
            // API エラー時は残り5件のみ表示
          }
        }

        setRecommendations(finalRecs);
      } catch {
        // sessionStorage のパースエラー等
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [currentId]);

  // カード遷移時に現在のレコメンドを sessionStorage に保存
  const handleCardClick = () => {
    sessionStorage.setItem("searchResults", JSON.stringify(recommendations));
  };

  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-pink-100">
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-4 h-4 rounded-full bg-pink-300 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-4 h-4 rounded-full bg-purple-300 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-4 h-4 rounded-full bg-pink-300 animate-bounce" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-pink-100">
      <h2 className="text-xl font-bold text-gray-700 mb-6">
        こちらもおすすめ
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const cat = rec.category as Category;
          return (
            <Link
              key={rec.id}
              href={`/contents/${rec.id}?q=${encodeURIComponent(query)}`}
              onClick={handleCardClick}
              className="block p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">
                  {CATEGORY_ICONS[cat] || "📄"}
                </span>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-pink-600 transition-colors line-clamp-2">
                {rec.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                {rec.body}
              </p>

              {/* ポッドキャスト: 音声リンク */}
              {cat === "podcast" && rec.audio_url && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(rec.audio_url, "_blank");
                  }}
                  className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  🎧 聴く
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
