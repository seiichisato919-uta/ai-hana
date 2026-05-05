"use client";

import Link from "next/link";
import type { SearchResult, Category } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORIES } from "@/lib/types";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
}

export default function SearchResults({
  results,
  loading,
  query,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8">
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="w-5 h-5 rounded-full bg-pink-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-5 h-5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-5 h-5 rounded-full bg-pink-400 animate-bounce" />
        </div>
        <p className="text-center text-gray-500">
          あなたにぴったりのコンテンツを探しています…
        </p>
      </div>
    );
  }

  if (results.length === 0) return null;

  // カテゴリ別にグループ化
  const grouped: Record<Category, SearchResult[]> = {
    newsletter: [],
    podcast: [],
    paid_product: [],
  };
  for (const result of results) {
    const cat = result.category as Category;
    if (grouped[cat]) {
      grouped[cat].push(result);
    }
  }

  // sessionStorage に保存するハンドラ
  const handleCardClick = () => {
    sessionStorage.setItem("searchResults", JSON.stringify(results));
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-8">
      <h2 className="text-xl font-bold text-gray-700">
        あなたへのおすすめコンテンツ
      </h2>

      {CATEGORIES.map((category) => {
        const items = grouped[category];
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            {/* カテゴリヘッダー */}
            <h3 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
              <span>{CATEGORY_ICONS[category]}</span>
              <span>{CATEGORY_LABELS[category]}</span>
            </h3>

            {/* カテゴリ内のカード */}
            {items.map((result) => (
              <Link
                key={result.id}
                href={`/contents/${result.id}?q=${encodeURIComponent(query)}`}
                onClick={handleCardClick}
                className="block p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-xs font-medium text-purple-600">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
                      {result.title}
                    </h4>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {result.body}
                    </p>

                    {/* ポッドキャスト: 音声リンクボタン（audio_url > url の優先順） */}
                    {category === "podcast" &&
                      (result.audio_url || result.url) && (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(
                              result.audio_url || result.url,
                              "_blank"
                            );
                          }}
                          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          🎧 エピソードを聴く
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
