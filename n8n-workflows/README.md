# AI-Hana n8n ワークフロー セットアップガイド

## 前提条件

- n8n がインストール・起動済み（ローカル or クラウド）
- OpenAI API キー
- Pinecone API キーとインデックスホストURL
- Google Cloud サービスアカウント（検索ログ・データ同期用）

## ワークフロー一覧

| ファイル | 用途 | トリガー |
|---------|------|---------|
| `01-search-workflow.json` | セマンティック検索API（カテゴリ別 2+2+2=6件） | Webhook (POST) |
| `02-sync-workflow.json` | 3シート → Pinecone データ同期 | Webhook (POST)（GAS連携） |
| `03-content-fetch-workflow.json` | コンテンツ詳細取得API | Webhook (POST) |
| `04-recommendations-workflow.json` | レコメンドAPI（不足カテゴリ補充） | Webhook (POST) |

## スプレッドシート構成（v3: 星座列追加）

| シート名 | カラム | 説明 |
|---------|--------|------|
| メルマガ | id, title, body, url, **エレメント**, **星座** | メールマガジンコンテンツ |
| ポッドキャスト | id, title, body, url, **audio_url**, **エレメント**, **星座** | ポッドキャストエピソード |
| 有料商品 | id, title, body, url, **エレメント**, **星座** | 有料コンテンツ |

### ⚠️ エレメント列・星座列について

各シートに「**エレメント**」と「**星座**」の2列を追加してください。

#### エレメント列の値
**火 / 地 / 風 / 水** のいずれか（複数該当はカンマ区切り、例: "地,水"）。空欄も可。

| 星座 | エレメント |
|------|-----------|
| 牡羊座、獅子座、射手座 | 火 |
| 牡牛座、乙女座、山羊座 | 地 |
| 双子座、天秤座、水瓶座 | 風 |
| 蟹座、蠍座、魚座 | 水 |

#### 星座列の値
**12星座のいずれか**（漢字表記、複数該当はカンマ区切り）。コンテンツが特定の星座を狙い撃ちしている場合のみ記入。空欄も可。

例:
- `乙女座` — 乙女座向けコンテンツ
- `牡牛座,獅子座` — 牡牛座と獅子座向け
- 空欄 — 特定の星座向けではない

### 🎯 表示優先度ロジック（マトリックス）

|  | 星座とエレメント合致 | エレメントだけ合致<br>(違う星座は除外) | 星座・エレメント未明記 |
|--|--|--|--|
| **相談内容と関連** | **第1優先** | **第2優先** | **第3優先** |
| 関連しない | 表示しない | 表示しない | 表示しない |

- **第1優先**: コンテンツの星座列にユーザーの星座が含まれている（element は不問）
- **第2優先**: コンテンツの星座列が空、かつ、エレメント列にユーザーのエレメントが含まれている
- **第3優先**: 星座列もエレメント列も空（汎用コンテンツ）
- **絶対NG**: コンテンツの星座列に「ユーザーと違う星座」が指定されている → Pinecone フィルタで除外

### 💡 星座優先ロジック（v3.1: 寛容モード）

**コンテンツの「星座」列が指定されていれば、エレメント列の値は無視されます**。
これにより、クライアントが両方の列に値を書いても、誤入力で事故が起きません。

例（ユーザーが牡牛座=地で検索）：

| コンテンツの星座 | コンテンツのエレメント | 表示される？ |
|----------------|---------------------|------------|
| 牡牛座 | 地 | ✅ |
| 牡牛座 | 火（誤入力） | ✅ **星座優先で表示** |
| 牡牛座 | 空 | ✅ |
| 空 | 地 | ✅ |
| 空 | 空 | ✅ |
| 乙女座 | 地 | ❌ 違う星座向けは除外 |
| 空 | 火 | ❌ |

### 🌟 ユーザー検索時の動作

- 入力例：「乙女座 仕事のやる気が出ない」「おとめ座で出会いがない」
- 星座を**ひらがな・カタカナ・漢字**いずれの表記でも認識
- 星座が認識できない場合はエラーメッセージを表示

## セットアップ手順

### 1. n8n にワークフローをインポート

1. n8n エディターを開く
2. 左メニュー → **Workflows** → **Import from File**
3. 4つの JSON ファイルを順番にインポート

### 2. クレデンシャルの作成

n8n の **Settings → Credentials** で以下の2つを作成します。

#### OpenAI API Key（HTTP Header Auth）
1. **Add Credential** → **Header Auth** を選択
2. 以下を入力:
   - **Name**: `Authorization`
   - **Value**: `Bearer sk-proj-xxxxxxxx`（自分のOpenAI APIキー）
3. 保存して、わかりやすい名前（例: `OpenAI API Key`）をつける

#### Pinecone API Key（HTTP Header Auth）
1. **Add Credential** → **Header Auth** を選択
2. 以下を入力:
   - **Name**: `Api-Key`
   - **Value**: `pcsk_xxxxxxxx`（自分のPinecone APIキー）
3. 保存して、わかりやすい名前（例: `Pinecone API Key`）をつける

### 3. 各ワークフローでクレデンシャルを選択

各ワークフローの **HTTP Request ノード** を開き:

1. **Authentication** が「Header Auth」になっていることを確認
2. **Credential for Header Auth** で、作成したクレデンシャルを選択
   - OpenAI系のノード → `OpenAI API Key`
   - Pinecone系のノード → `Pinecone API Key`

### 4. Pinecone ホストURLの書き換え

各ワークフローの Pinecone 系 HTTP Request ノードの URL を実際のホストに書き換え:

```
https://YOUR_PINECONE_HOST/query
↓
https://ai-hana-xxxxx.svc.xxxxx.pinecone.io/query
```

Pinecone ホストURLは **Pinecone コンソール → Indexes → ai-hana → Host** で確認できます。

### 5. Google Sheets の設定

#### Google Sheets クレデンシャル
1. n8n で **Google Sheets のクレデンシャル** を作成（サービスアカウント or OAuth2）

#### 検索ワークフロー（01）の Google Sheets Log ノード
- クレデンシャルを選択
- `YOUR_GOOGLE_SHEET_ID` → 検索ログ用スプレッドシートのID

#### データ同期ワークフロー（02）の 3つの Google Sheets Read ノード
- 各ノードにクレデンシャルを選択
- `YOUR_GOOGLE_SHEET_ID` → コンテンツデータのスプレッドシートのID
- 3つのシートが自動で読み分けられます: メルマガ(A:D)、ポッドキャスト(A:E)、有料商品(A:D)

### 6. ワークフローを有効化

1. 各ワークフローを開く
2. 右上の **Active** トグルをONにする
3. Webhook URL が発行される

### 7. Next.js フロントエンドの設定

`.env.local` を設定:

```bash
# n8n Webhook URL
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Google Tag Manager（任意）
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### 8. GAS（Google Apps Script）の設定

GAS の「★AI連携メニュー」ボタンが押された際のリクエスト先を変更:

```
旧: https://your-vercel.vercel.app/api/sync
新: https://your-n8n-host/webhook/ai-hana-sync
```

### 9. 初回データ同期

方法A: GAS から同期
- スプレッドシートの「★AI連携メニュー」ボタンをクリック

方法B: n8n から手動テスト
- n8n エディター → `AI-Hana データ同期` → **Test workflow**

## ワークフロー構成図

### 検索API（01-search-workflow）
```
Webhook (POST /ai-hana-search)
  ├→ OpenAI Embedding → Prepare Pinecone Query (topK=20)
  │    → Pinecone Query
  │      → Format Results (カテゴリ別2件ずつ = 合計6件)
  │        → Respond to Webhook
  └→ Prepare Log → Google Sheets Log（検索ログ）
```

### データ同期（02-sync-workflow）
```
Webhook (POST /ai-hana-sync)  ← GAS からトリガー
  ├→ Read Newsletter (メルマガ) → Tag Newsletter (category付与 + IDプレフィックス)
  ├→ Read Podcast (ポッドキャスト) → Tag Podcast (category + audio_url付与)
  └→ Read PaidProduct (有料商品) → Tag PaidProduct (category付与)
       ↓
  Merge All Data (3シート結合)
    → Prepare Embedding Inputs → OpenAI Embedding
      → Prepare Upsert (category, audio_url をメタデータに追加)
        → Pinecone Upsert → Prepare Response → Respond to Webhook
```

### コンテンツ取得API（03-content-fetch-workflow）
```
Webhook (POST /ai-hana-content)
  → Extract ID → Pinecone Fetch
    → Format Response (category, audio_url 含む)
      → Respond to Webhook
```

### レコメンドAPI（04-recommendations-workflow）
```
Webhook (POST /ai-hana-recommend)
  → Extract Params (id, excludeIds, needCategory)
    → Pinecone Fetch Vector (現コンテンツのベクトル取得)
      → Prepare Similarity Query (カテゴリフィルタ付き)
        → Pinecone Query Similar
          → Format Recommendations (excludeIds除外, 上位1件)
            → Respond to Webhook
```

## Pinecone メタデータ構造

同期後、各ベクトルには以下のメタデータが格納されます:

```json
{
  "title": "コンテンツタイトル",
  "body": "本文テキスト",
  "url": "https://...",
  "category": "newsletter | podcast | paid_product",
  "audio_url": "https://... (ポッドキャストのみ)"
}
```

IDはカテゴリプレフィックス付き: `newsletter_1`, `podcast_3`, `paid_product_5`

## 注意事項

- **Pinecone 再同期必須**: 既存データにはカテゴリ情報がないため、アップデート後にフル同期を実行してください
- **既存インデックスのクリア推奨**: IDプレフィックス変更により旧ベクトルが残ります。可能であれば Pinecone インデックスをクリアしてから再同期してください

## トラブルシューティング

### CORS エラーが出る場合
Respond to Webhook ノードの Options → Response Headers に以下が設定されていることを確認:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type`

### Webhook テスト時の URL
- **本番 URL**: `http://localhost:5678/webhook/ai-hana-search`
- **テスト URL**: `http://localhost:5678/webhook-test/ai-hana-search`

n8n エディターで「Test workflow」を使う場合は `-test` がつきます。

### クレデンシャルが見つからない場合
HTTP Request ノードを開いて Authentication が「Header Auth」になっているか確認してください。
