export interface SearchResult {
  id: string;
  score: number;
  title: string;
  body: string;
  url: string;
  category: "newsletter" | "podcast" | "paid_product";
  audio_url?: string;
}

export interface ContentData {
  id: string;
  title: string;
  body: string;
  url: string;
  category: string;
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
