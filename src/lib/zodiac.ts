// 星座とエレメントの対応関係
// 火: 牡羊座, 獅子座, 射手座
// 地: 牡牛座, 乙女座, 山羊座
// 風: 双子座, 天秤座, 水瓶座
// 水: 蟹座, 蠍座, 魚座

export type Element = "fire" | "earth" | "air" | "water";

export const ZODIAC_KANJI = [
  "牡羊座",
  "牡牛座",
  "双子座",
  "蟹座",
  "獅子座",
  "乙女座",
  "天秤座",
  "蠍座",
  "射手座",
  "山羊座",
  "水瓶座",
  "魚座",
] as const;

export type ZodiacKanji = (typeof ZODIAC_KANJI)[number];

export const ELEMENT_LABELS: Record<Element, string> = {
  fire: "火",
  earth: "地",
  air: "風",
  water: "水",
};

export const ELEMENT_KANJI: Record<Element, string> = {
  fire: "火",
  earth: "地",
  air: "風",
  water: "水",
};

export const ZODIAC_TO_ELEMENT: Record<ZodiacKanji, Element> = {
  牡羊座: "fire",
  獅子座: "fire",
  射手座: "fire",
  牡牛座: "earth",
  乙女座: "earth",
  山羊座: "earth",
  双子座: "air",
  天秤座: "air",
  水瓶座: "air",
  蟹座: "water",
  蠍座: "water",
  魚座: "water",
};

// 星座名のパターン（ひらがな・カタカナ・漢字すべて対応）
const ZODIAC_PATTERNS: Array<{ pattern: RegExp; zodiac: ZodiacKanji }> = [
  { pattern: /牡羊座|おひつじ座|オヒツジ座|おひつじざ|オヒツジザ/, zodiac: "牡羊座" },
  { pattern: /獅子座|しし座|シシ座|ししざ|シシザ/, zodiac: "獅子座" },
  { pattern: /射手座|いて座|イテ座|いてざ|イテザ/, zodiac: "射手座" },
  { pattern: /牡牛座|おうし座|オウシ座|おうしざ|オウシザ/, zodiac: "牡牛座" },
  { pattern: /乙女座|おとめ座|オトメ座|おとめざ|オトメザ/, zodiac: "乙女座" },
  { pattern: /山羊座|やぎ座|ヤギ座|やぎざ|ヤギザ/, zodiac: "山羊座" },
  { pattern: /双子座|ふたご座|フタゴ座|ふたござ|フタゴザ/, zodiac: "双子座" },
  { pattern: /天秤座|てんびん座|テンビン座|てんびんざ|テンビンザ/, zodiac: "天秤座" },
  { pattern: /水瓶座|みずがめ座|ミズガメ座|みずがめざ|ミズガメザ/, zodiac: "水瓶座" },
  { pattern: /蟹座|かに座|カニ座|かにざ|カニザ/, zodiac: "蟹座" },
  { pattern: /蠍座|さそり座|サソリ座|さそりざ|サソリザ/, zodiac: "蠍座" },
  { pattern: /魚座|うお座|ウオ座|うおざ|ウオザ/, zodiac: "魚座" },
];

/**
 * 入力テキストから星座を検出して、星座名（漢字）とエレメントを返す
 * 検出できなかった場合は null を返す
 */
export function detectZodiac(text: string): {
  zodiac: ZodiacKanji;
  element: Element;
} | null {
  for (const { pattern, zodiac } of ZODIAC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        zodiac,
        element: ZODIAC_TO_ELEMENT[zodiac],
      };
    }
  }
  return null;
}

/**
 * 後方互換: エレメントだけ取り出すヘルパー
 */
export function detectElement(
  text: string
): { element: Element; zodiacName: string } | null {
  const result = detectZodiac(text);
  if (!result) return null;
  return { element: result.element, zodiacName: result.zodiac };
}

/**
 * エレメントを Pinecone メタデータ用の漢字1文字に変換
 */
export function elementToKanji(element: Element): string {
  return ELEMENT_KANJI[element];
}

// ===== エレメント / クオリティ / モード判定 =====

// 検索モード
//  zodiac : 星座 + 知りたいこと
//  element: エレメント + 知りたいこと
//  quality: クオリティ + 知りたいこと
//  topic  : 知りたいことのみ
export type SearchMode = "zodiac" | "element" | "quality" | "topic";

// 先頭トークンとして許可するエレメント1文字（火/地/風/水）
const ELEMENT_TOKENS: Record<string, string> = {
  火: "火",
  地: "地",
  風: "風",
  水: "水",
};

// 「エレメントそのものを尋ねる言い回し」を先頭で検出するパターン。
// 例:「水の特徴を教えて」「火について」「風のエレメント」「地タイプ」「エレメントの水」
// 誤検出防止: 助詞や特定語が続くときだけ反応させ、「水曜」「水道」「風邪」「火事」「地元」等は除外する。
const ELEMENT_PHRASE_PATTERNS: RegExp[] = [
  /^(火|地|風|水)(?:の特徴|の性質|の人|のエレメント|というエレメント|エレメント|タイプ|について|とは)/,
  /^エレメントの(火|地|風|水)/,
];

// 先頭が「エレメント語＋説明的表現」のとき、そのエレメント（火/地/風/水）を返す。該当しなければ null
function detectLeadingElement(text: string): string | null {
  for (const pattern of ELEMENT_PHRASE_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1];
  }
  return null;
}

// クオリティ（活動宮/不動宮/柔軟宮）。別名（運動星座/定着星座/変通星座）も許可。
// 「活動宮の特徴を教えて」のように説明的表現が続いても拾えるよう、先頭一致（末尾$なし）で判定する。
// 末尾が「宮」で終わる固有語のため、「活動的」「柔軟に」等を誤検出することはない。
const QUALITY_PATTERNS: Array<{ pattern: RegExp; quality: string }> = [
  { pattern: /^(活動宮|運動星座)/, quality: "活動宮" },
  { pattern: /^(不動宮|定着星座)/, quality: "不動宮" },
  { pattern: /^(柔軟宮|変通星座)/, quality: "柔軟宮" },
];

export interface DetectedSearch {
  mode: SearchMode;
  query: string; // 埋め込み・トピック用テキスト（入力全文）
  zodiac: string; // 漢字。なければ ""
  element: string; // 火/地/風/水。なければ ""
  quality: string; // 活動宮/不動宮/柔軟宮。なければ ""
}

/**
 * 入力テキストから検索モードと属性を判定する。
 * - エレメントは誤検出防止のため「先頭トークン（最初の空白までの語）」が
 *   火/地/風/水 のときのみ採用する
 * - クオリティも先頭トークンで判定（複数文字なので安全）
 * - 星座は従来通りテキスト全体から検出（後方互換）
 * - いずれも該当しなければ topic（知りたいことのみ）
 */
export function detectSearch(text: string): DetectedSearch {
  const trimmed = text.trim();
  const first = trimmed.split(/[\s　]+/)[0] ?? "";

  // 1. エレメント:
  //   (a) 先頭トークンが火/地/風/水 単独（例:「水 最近疲れた」）
  //   (b) 先頭が「エレメント語＋説明的表現」（例:「水の特徴を教えて」「火について」）
  //   いずれも、字面が似た「水瓶座」（実エレメントは風）を誤って拾わないための明示判定
  const elementFromToken = ELEMENT_TOKENS[first];
  const elementFromPhrase = detectLeadingElement(trimmed);
  const element = elementFromToken || elementFromPhrase;
  if (element) {
    return {
      mode: "element",
      query: trimmed,
      zodiac: "",
      element,
      quality: "",
    };
  }

  // 2. クオリティ: 先頭が活動宮/不動宮/柔軟宮（説明的表現が続いてもOK）
  for (const { pattern, quality } of QUALITY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        mode: "quality",
        query: trimmed,
        zodiac: "",
        element: "",
        quality,
      };
    }
  }

  // 3. 星座: テキスト全体から検出（後方互換）
  const z = detectZodiac(trimmed);
  if (z) {
    return {
      mode: "zodiac",
      query: trimmed,
      zodiac: z.zodiac,
      element: ELEMENT_KANJI[z.element],
      quality: "",
    };
  }

  // 4. 知りたいことのみ
  return { mode: "topic", query: trimmed, zodiac: "", element: "", quality: "" };
}
