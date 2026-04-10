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

## スプレッドシート構成

| シート名 | カラム | 説明 |
|---------|--------|------|
| メルマガ | id, title, body, url | メールマガジンコンテンツ |
| ポッドキャスト | id, title, body, url, **audio_url** | ポッドキャストエピソード |
| 有料商品 | id, title, body, url | 有料コンテンツ |

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
