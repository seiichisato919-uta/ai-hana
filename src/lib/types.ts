export interface SearchResult {
  id: string;
  score: number;
  title: string;
  body: string;
  url: string;
  category: "newsletter" | "podcast" | "paid_product";
  zodiac?: string; // 星座（カンマ区切り。例: "牡牛座" / "牡牛座,獅子座" / ""）
  element?: string; // エレメント（火/地/風/水。カンマ区切り）
  audio_url?: string;
}

export interface ContentData {
  id: string;
  title: string;
  body: string;
  url: string;
  category: string;
  zodiac?: string;
  element?: string;
  audio_url?: string;
}

export type Category = "newsletter" | "podcast" | "paid_product";

export const CATEGORY_LABELS: Record<Category, string> = {
  newsletter: "メルマガ",
  podcast: "ポッドキャスト",
  paid_product: "有料商品",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  newsletter: "📧",
  podcast: "🎧",
  paid_product: "💎",
};

export const CATEGORIES: Category[] = [
  "newsletter",
  "podcast",
  "paid_product",
];
