"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResult, Category } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import { detectSearch, getRecommendMatch } from "@/lib/zodiac";

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

      // クエリ（知りたいこと）がない場合はレコメンドを出さない
      if (!query.trim()) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      try {
        // 開いたコンテンツ（= 二度とおすすめに出さない）
        const OPENED_KEY = "openedIds";
        let openedIds: string[] = [];
        try {
          const v = sessionStorage.getItem(OPENED_KEY);
          if (v) openedIds = JSON.parse(v);
        } catch {
          openedIds = [];
        }
        // 今まさに開いているコンテンツを追加
        if (!openedIds.includes(currentId)) {
          openedIds.push(currentId);
          try {
            sessionStorage.setItem(OPENED_KEY, JSON.stringify(openedIds));
          } catch {
            // 無視
          }
        }

        // 過去に表示されたが開かれていないコンテンツ（第3優先で再表示可）
        let shownIds: string[] = [];
        try {
          const v = sessionStorage.getItem("shownIds");
          if (v) shownIds = JSON.parse(v);
        } catch {
          shownIds = [];
        }

        // 検索モードを判定し、レコメンドで「一致」とみなす属性集合を算出
        const detected = detectSearch(query);
        const match = getRecommendMatch(detected);

        const webhookUrl =
          process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
          "http://localhost:5678/webhook";

        const res = await fetch(`${webhookUrl}/ai-hana-recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: detected.query,
            mode: detected.mode,
            currentId,
            zodiac: detected.zodiac,
            matchZodiacs: match.zodiacs,
            matchElements: match.elements,
            matchQualities: match.qualities,
            openedIds,
            shownIds,
            perCategory: 2,
          }),
        });
        const data = await res.json();
        const recs: SearchResult[] = data.recommendations || [];

        // 表示するレコメンドのIDを shownIds に追加（次回以降の第3優先で活用）
        if (recs.length > 0) {
          try {
            const set = new Set(shownIds);
            for (const r of recs) set.add(r.id);
            sessionStorage.setItem("shownIds", JSON.stringify(Array.from(set)));
          } catch {
            // 無視
          }
        }

        setRecommendations(recs);
      } catch {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [currentId, query]);

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

              {/* ポッドキャスト: 音声リンク（audio_url > url の優先順） */}
              {cat === "podcast" && (rec.audio_url || rec.url) && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(rec.audio_url || rec.url, "_blank");
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
