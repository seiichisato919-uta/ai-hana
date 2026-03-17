"use client";

import Link from "next/link";

interface SearchResult {
  id: string;
  score: number;
  title: string;
  body: string;
  url: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
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

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-4">
      <h2 className="text-xl font-bold text-gray-700 mb-4">
        あなたへのおすすめコンテンツ
      </h2>
      {results.map((result, index) => (
        <Link
          key={result.id}
          href={`/contents/${result.id}`}
          className="block p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all group"
        >
          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
                {result.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {result.body}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
