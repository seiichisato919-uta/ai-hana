"use client";

import { useState } from "react";
import SearchBox from "@/components/SearchBox";
import SearchResults from "@/components/SearchResults";

interface SearchResult {
  id: string;
  score: number;
  title: string;
  body: string;
  url: string;
}

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleResults = (newResults: SearchResult[]) => {
    setResults(newResults);
    setSearched(true);
  };

  return (
    <main className="flex flex-col items-center px-4 py-12">
      {/* ヘッダー */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
          AI-Hana
        </h1>
        <p className="text-gray-600 text-lg">
          あなたの悩みに寄り添うコンテンツを見つけます
        </p>
        <p className="text-gray-400 text-sm mt-2">
          お気軽にあなたの気持ちを入力してください
        </p>
      </div>

      {/* 検索窓 */}
      <SearchBox onResults={handleResults} onLoading={setLoading} />

      {/* 検索結果 */}
      <SearchResults results={results} loading={loading} />

      {/* 検索後に結果が0件の場合 */}
      {searched && !loading && results.length === 0 && (
        <div className="mt-8 text-center text-gray-500">
          <p>該当するコンテンツが見つかりませんでした。</p>
          <p className="text-sm mt-1">
            別の言葉で悩みを表現してみてください。
          </p>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-20 text-center text-sm text-gray-400">
        <p>AI-Hana Demo Version</p>
      </footer>
    </main>
  );
}
