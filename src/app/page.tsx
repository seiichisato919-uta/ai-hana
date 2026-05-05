"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import SearchResults from "@/components/SearchResults";
import type { SearchResult } from "@/lib/types";
import { detectZodiac, elementToKanji } from "@/lib/zodiac";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [zodiacError, setZodiacError] = useState<string | null>(null);
  const autoSearchDone = useRef(false);

  const handleResults = useCallback(
    (newResults: SearchResult[], query: string) => {
      setResults(newResults);
      setSearched(true);
      setCurrentQuery(query);
      // URL にクエリを反映
      router.replace(`/?q=${encodeURIComponent(query)}`, { scroll: false });
    },
    [router]
  );

  // URL に ?q= がある場合、初回のみ自動検索
  useEffect(() => {
    if (initialQuery && !autoSearchDone.current) {
      autoSearchDone.current = true;

      // 星座検出（星座名 + エレメント）
      const detected = detectZodiac(initialQuery);
      if (!detected) {
        setZodiacError(
          "星座を認識できませんでした。例：『乙女座』『おとめ座』『オトメ座』などを含めて入力してください。"
        );
        setSearched(true);
        setCurrentQuery(initialQuery);
        return;
      }

      const doAutoSearch = async () => {
        setLoading(true);
        try {
          const webhookUrl =
            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
            "http://localhost:5678/webhook";
          const res = await fetch(`${webhookUrl}/ai-hana-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: initialQuery,
              zodiac: detected.zodiac,
              element: elementToKanji(detected.element),
            }),
          });
          const data = await res.json();
          setResults(data.results || []);
          setSearched(true);
          setCurrentQuery(initialQuery);
        } catch {
          setResults([]);
          setSearched(true);
        } finally {
          setLoading(false);
        }
      };
      doAutoSearch();
    }
  }, [initialQuery]);

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
          あなたの星座と、あなたの気持ちを入力してください
        </p>
      </div>

      {/* 検索窓 */}
      <SearchBox
        onResults={handleResults}
        onLoading={setLoading}
        onError={setZodiacError}
        initialQuery={initialQuery}
      />

      {/* 星座未検出エラー */}
      {zodiacError && (
        <div className="mt-6 w-full max-w-2xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ {zodiacError}
        </div>
      )}

      {/* 検索結果 */}
      <SearchResults
        results={results}
        loading={loading}
        query={currentQuery}
      />

      {/* 検索後に結果が0件の場合 */}
      {searched && !loading && !zodiacError && results.length === 0 && (
        <div className="mt-8 text-center text-gray-500">
          <p>該当するコンテンツが見つかりませんでした。</p>
          <p className="text-sm mt-1">
            別の言葉で悩みを表現してみてください。
          </p>
        </div>
      )}

      {/* フッター */}
      <footer className="mt-20 text-center text-sm text-gray-400">
        <p>AI-Hana</p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-3">
              AI-Hana
            </h1>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
