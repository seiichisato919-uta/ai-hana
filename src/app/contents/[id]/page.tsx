"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ContentData, Category } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/types";
import RelatedContent from "@/components/RelatedContent";

function ContentDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const query = searchParams.get("q") || "";

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        const webhookUrl =
          process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
          "http://localhost:5678/webhook";
        const res = await fetch(`${webhookUrl}/ai-hana-content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setContent(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <main className="flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-pink-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !content) {
    return (
      <main className="flex flex-col items-center px-4 py-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">
            コンテンツが見つかりませんでした
          </p>
          <Link
            href={query ? `/?q=${encodeURIComponent(query)}` : "/"}
            className="text-pink-500 hover:text-pink-600 underline"
          >
            トップページに戻る
          </Link>
        </div>
      </main>
    );
  }

  const category = content.category as Category;

  return (
    <main className="flex flex-col items-center px-4 py-12">
      <article className="w-full max-w-2xl">
        {/* 戻るリンク（検索クエリ保持） */}
        <Link
          href={query ? `/?q=${encodeURIComponent(query)}` : "/"}
          className="inline-flex items-center text-pink-500 hover:text-pink-600 mb-6 group"
        >
          <svg
            className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          検索に戻る
        </Link>

        {/* カテゴリバッジ */}
        {category && CATEGORY_LABELS[category] && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-sm font-medium text-purple-600">
              <span>{CATEGORY_ICONS[category]}</span>
              <span>{CATEGORY_LABELS[category]}</span>
            </span>
          </div>
        )}

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6 leading-relaxed">
          {content.title}
        </h1>

        {/* 本文 */}
        <div className="prose prose-gray max-w-none">
          {content.body.split("\n").map((paragraph, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* ポッドキャスト: 音声リンク */}
        {category === "podcast" && content.audio_url && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl">
            <a
              href={content.audio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-800 font-medium"
            >
              🎧 エピソードを聴く
            </a>
          </div>
        )}

        {/* 関連コンテンツ（回遊UI） */}
        <RelatedContent currentId={id} query={query} />
      </article>
    </main>
  );
}

export default function ContentDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center px-4 py-12">
          <div className="w-full max-w-2xl">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-pink-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        </main>
      }
    >
      <ContentDetail />
    </Suspense>
  );
}
