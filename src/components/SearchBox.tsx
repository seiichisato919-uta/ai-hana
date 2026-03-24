"use client";

import { useState } from "react";

interface SearchResult {
  id: string;
  score: number;
  title: string;
  body: string;
  url: string;
}

interface SearchBoxProps {
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
}

export default function SearchBox({ onResults, onLoading }: SearchBoxProps) {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    onLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      onResults(data.results || []);
    } catch {
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="あなたのお悩みを教えてください…&#10;例：「最近出会いがなくて…」「仕事のやる気が出ない」"
          className="w-full h-32 p-5 text-lg rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none resize-none bg-white/80 backdrop-blur-sm shadow-lg placeholder:text-gray-400 text-gray-700"
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="absolute bottom-4 right-4 px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-medium hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          相談する
        </button>
      </div>
    </div>
  );
}
