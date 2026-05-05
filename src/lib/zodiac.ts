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
