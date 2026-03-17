"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ContentData {
  id: string;
  title: string;
  body: string;
  url: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch(`/api/contents/${id}`);
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
            href="/"
            className="text-pink-500 hover:text-pink-600 underline"
          >
            トップページに戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center px-4 py-12">
      <article className="w-full max-w-2xl">
        {/* 戻るリンク */}
        <Link
          href="/"
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

        {/* URL（将来用） */}
        {content.url && (
          <div className="mt-8 p-4 bg-pink-50 rounded-xl">
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700 underline"
            >
              元のコンテンツを見る
            </a>
          </div>
        )}
      </article>
    </main>
  );
}
