"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResult, Category } from "@/lib/types";
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORIES,
} from "@/lib/types";
import { detectZodiac, elementToKanji } from "@/lib/zodiac";

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
        // 既読履歴を取得＆現在の ID を追加（セッション中ずっと保持）
        const VIEWED_KEY = "viewedIds";
        let viewedIds: string[] = [];
        try {
          const v = sessionStorage.getItem(VIEWED_KEY);
          if (v) viewedIds = JSON.parse(v);
        } catch {
          // 破損 → 空配列で初期化
        }
        if (!viewedIds.includes(currentId)) {
          viewedIds.push(currentId);
          sessionStorage.setItem(VIEWED_KEY, JSON.stringify(viewedIds));
        }

        const stored = sessionStorage.getItem("searchResults");
        const allResults: SearchResult[] = stored ? JSON.parse(stored) : [];

        // 現在のコンテンツ＋既読を除外
        const viewedSet = new Set(viewedIds);
        const remaining = allResults.filter(
          (r) => r.id !== currentId && !viewedSet.has(r.id)
        );

        // カテゴリ別に最大2件ずつ集める（既存分・既読除外済み）
        const byCategory: Record<Category, SearchResult[]> = {
          newsletter: [],
          podcast: [],
          paid_product: [],
        };
        for (const r of remaining) {
          const cat = r.category as Category;
          if (byCategory[cat] && byCategory[cat].length < 2) {
            byCategory[cat].push(r);
          }
        }

        // 不足分（各カテゴリで2件未満）を recommend API で補充
        const detected = detectZodiac(query);
        const zodiacName = detected ? detected.zodiac : "";
        const elementKanji = detected
          ? elementToKanji(detected.element)
          : "";

        const webhookUrl =
          process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
          "http://localhost:5678/webhook";

        // 除外リスト = 現在ID + 既読履歴 + 既に表示中の候補
        const excludeIds = new Set<string>([
          currentId,
          ...viewedIds,
          ...allResults.map((r) => r.id),
        ]);

        for (const cat of CATEGORIES) {
          // 各カテゴリで2件揃うまで API を呼び続ける
          // ただし、関連コンテンツが尽きたら break（無関係なものは出さない）
          let safetyCount = 0;
          while (byCategory[cat].length < 2 && safetyCount < 3) {
            safetyCount++;
            try {
              const res = await fetch(`${webhookUrl}/ai-hana-recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: currentId,
                  excludeIds: Array.from(excludeIds),
                  needCategory: cat,
                  zodiac: zodiacName,
                  element: elementKanji,
                }),
              });
              const data = await res.json();
              const recs: SearchResult[] = data.recommendations || [];
              if (recs.length === 0) break; // 該当コンテンツが尽きた

              const newRec = recs[0];
              if (excludeIds.has(newRec.id)) break; // 重複（無限ループ防止）

              byCategory[cat].push(newRec);
              excludeIds.add(newRec.id);
            } catch {
              break;
            }
          }
        }

        // 最終結果（カテゴリ順に並べる）
        const finalRecs = [
          ...byCategory.newsletter,
          ...byCategory.podcast,
          ...byCategory.paid_product,
        ];

        setRecommendations(finalRecs);
      } catch {
        // sessionStorage のパースエラー等
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [currentId, query]);

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
