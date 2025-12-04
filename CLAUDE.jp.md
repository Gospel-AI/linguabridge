# LinguaBridge - LLMアノテーションプラットフォーム

**バージョン**: v1.0 (2025-12-04)
**ステータス**: MVP開発フェーズ

> **言語バージョン**:
> - 英語: [CLAUDE.md](./CLAUDE.md) - ガーナ開発チーム向け
> - 日本語: [CLAUDE.jp.md](./CLAUDE.jp.md) - 日本企画チーム向け

---

## プロジェクト概要

LinguaBridgeは、AI企業と熟練アノテーターをつなぐ**専門LLMアノテーションプラットフォーム**です。**アフリカ・東南アジア言語**に特化し、競争力のある価格で提供します。

### ターゲット顧客

| セグメント | 説明 | 優先度 |
|-----------|------|--------|
| **AI/MLスタートアップ** | 多言語モデルを構築する小規模チーム | 最優先 |
| **研究機関** | 学習データを収集する大学 | 最優先 |
| **アノテーション会社** | オーバーフロー業務の外注パートナー | 次優先 |

### 主要バリュープロポジション

**顧客向け**:
- Scale AI、Appenと比較して50%低コスト
- アフリカ言語の専門カバレッジ（アカン語、ハウサ語、ヨルバ語、イボ語）
- バッチ処理（1,000〜10,000以上のタスク）
- API + Web UIによる柔軟なワークフロー
- IAAとゴールドスタンダードによる品質管理

**アノテーター向け**:
- 柔軟なリモートワーク機会
- LLMアノテーションの専門トレーニング
- パフォーマンスベースのティアシステム
- 競争力のある報酬

### 差別化要因

| 要素 | Scale AI | MTurk | LinguaBridge |
|------|----------|-------|--------------|
| **価格** | 高 | 低 | **低〜中** |
| **品質** | 高 | 低 | **中〜高** |
| **アフリカ言語** | 限定的 | なし | **専門特化** |
| **最小発注** | 大規模 | なし | **1,000タスク** |
| **ターゲット** | エンタープライズ | 個人 | **スタートアップ/研究機関** |

---

## サポート言語

### フェーズ1（ローンチ時）

| 言語 | 国 | 話者数 | ISOコード |
|------|-----|--------|----------|
| 英語 | グローバル | 15億人 | en |
| アカン語（トウィ/ファンテ） | ガーナ | 1,100万人 | ak |
| ハウサ語 | ナイジェリア | 7,000万人 | ha |
| ヨルバ語 | ナイジェリア | 4,500万人 | yo |
| イボ語 | ナイジェリア | 4,000万人 | ig |
| ナイジェリアン・ピジン | ナイジェリア | 7,500万人 | pcm |

### フェーズ2（予定）
- スワヒリ語（ケニア、タンザニア）
- アムハラ語（エチオピア）
- タイ語、ベトナム語、インドネシア語

---

## アノテーションタイプ

### テキスト分類
- **ユースケース**: 感情分析、トピック分類、安全性ラベル
- **UI**: 複数選択ボタン、単一選択ラジオ
- **出力**: ラベルフィールド付きJSONL

### 固有表現認識（NER）
- **ユースケース**: NLPモデル向けエンティティタグ付け
- **UI**: エンティティタイプ選択付きテキストハイライト
- **出力**: スパンとエンティティタイプ付きJSONL

### 比較ランキング（RLHF）
- **ユースケース**: 選好学習、回答ランキング
- **UI**: 横並び比較、ドラッグ＆ドロップランキング
- **出力**: ランク付きペアのJSONL

### テキスト評価
- **ユースケース**: AI出力品質評価
- **UI**: リッカート尺度（1-5）、ルーブリックベーススコアリング
- **出力**: スコアとオプションコメント付きJSONL

### 翻訳検証
- **ユースケース**: 機械翻訳品質チェック
- **UI**: ソース・ターゲット表示、エラーハイライト
- **出力**: 品質スコアとエラーアノテーション付きJSONL

---

## 技術スタック

### フロントエンド
- **React 18** + TypeScript + Tailwind CSS
- **ホスティング**: Vercel
- **主要ライブラリ**: react-hook-form, zod, axios

### バックエンド
- **Node.js 20** + Express + TypeScript
- **ホスティング**: Railway
- **主要ライブラリ**: stripe, swagger, helmet

### データベース & 認証
- **Supabase**（PostgreSQL + Auth）
- **Row Level Security**によるデータ分離

### 決済
- **Stripe Connect**（カスタムアカウント）
- **通貨**: USD建て

---

## API設計

### 認証
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### プロジェクト
```
GET    /api/projects                 # プロジェクト一覧
POST   /api/projects                 # プロジェクト作成
GET    /api/projects/:id             # プロジェクト詳細
PUT    /api/projects/:id             # プロジェクト更新
DELETE /api/projects/:id             # プロジェクト削除
```

### タスク（バッチ）
```
POST   /api/projects/:id/tasks/batch # タスクアップロード（CSV/JSON）
GET    /api/projects/:id/tasks       # タスク一覧（ページネーション付き）
GET    /api/projects/:id/export      # アノテーションエクスポート
```

### アノテーション
```
GET    /api/annotator/tasks          # 利用可能タスク取得
POST   /api/annotator/tasks/:id      # アノテーション送信
GET    /api/annotator/stats          # アノテーター統計
```

### 品質
```
GET    /api/projects/:id/quality     # 品質メトリクス（IAA、精度）
POST   /api/projects/:id/gold        # ゴールドスタンダードタスクアップロード
```

---

## データベーススキーマ（主要テーブル）

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  annotation_type TEXT NOT NULL, -- 'classification', 'ner', 'ranking', etc.
  config JSONB, -- ラベル、指示など
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  data JSONB NOT NULL, -- アノテーション用入力データ
  is_gold BOOLEAN DEFAULT FALSE,
  gold_answer JSONB, -- ゴールドスタンダードタスク用
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### annotations
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  annotator_id UUID REFERENCES users(id),
  annotation JSONB NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### annotator_profiles
```sql
CREATE TABLE annotator_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  languages JSONB, -- ["en", "ha", "yo"]
  tier TEXT DEFAULT 'standard', -- 'standard', 'pro'
  accuracy_score DECIMAL,
  tasks_completed INTEGER DEFAULT 0,
  certified_types TEXT[] -- ['classification', 'ner']
);
```

---

## 価格戦略

### タスク単価

| タスクタイプ | LinguaBridge | Scale AI | 削減率 |
|-------------|--------------|----------|--------|
| テキスト分類 | $0.03-0.08 | $0.10-0.30 | 60-70% |
| NER | $0.08-0.15 | $0.20-0.50 | 60-70% |
| RLHFランキング | $0.15-0.30 | $0.50-1.00 | 70% |
| 翻訳検証 | $0.10-0.20 | $0.30-0.60 | 60-70% |

### ボリュームディスカウント
- 1,000-4,999タスク: 基本価格
- 5,000-9,999タスク: 10%割引
- 10,000タスク以上: 15%割引
- 月額契約: カスタム価格

### 収益配分
- プラットフォーム手数料: 18%
- アノテーター: 76%
- Stripe: 6%

---

## 品質管理システム

### ゴールドスタンダード検証
- 5-10%の隠しテストタスクを挿入
- アノテーター精度を自動計算
- 低パフォーマーをレビュー用にフラグ

### 評価者間一致度（IAA）
- タスクの5-10%を複製
- コーエンのカッパ / フライスのカッパを計算
- クライアントに一致度スコアを報告

### アノテーターティア

| ティア | 要件 | 特典 |
|--------|------|------|
| スタンダード | 認定試験合格 | 基本レート |
| プロ | 20タスク以上、評価4.2以上 | +20%ボーナス |

---

## 開発ロードマップ

### 1-2ヶ月目: コアプラットフォーム
- [ ] プロジェクト作成UI
- [ ] バッチタスクアップロード（CSV/JSON）
- [ ] 分類アノテーションUI
- [ ] NERアノテーションUI
- [ ] エクスポート機能

### 3-4ヶ月目: 品質 & API
- [ ] ゴールドスタンダード挿入
- [ ] IAA計算
- [ ] クライアント向けREST API
- [ ] Python SDK

### 5-6ヶ月目: スケール & 成長
- [ ] RLHFランキングUI
- [ ] 月額サブスクリプション
- [ ] アノテータートレーニングシステム
- [ ] パフォーマンスダッシュボード

---

## プロジェクト構成

```
linguabridge/
├── CLAUDE.md              # このファイル（英語）
├── CLAUDE.jp.md           # このファイル（日本語）
├── README.md              # クイックスタートガイド（英語）
├── README.jp.md           # クイックスタートガイド（日本語）
├── frontend/              # Reactフロントエンド
│   ├── src/
│   │   ├── components/    # UIコンポーネント
│   │   ├── pages/         # ページルート
│   │   ├── services/      # APIクライアント
│   │   └── types/         # TypeScript型定義
├── backend/               # Node.jsバックエンド
│   ├── src/
│   │   ├── routes/        # APIルート
│   │   ├── controllers/   # ビジネスロジック
│   │   ├── middleware/    # 認証、バリデーション
│   │   └── services/      # 外部連携
├── claudedocs/            # プロジェクトドキュメント
└── database/              # Supabaseマイグレーション
```

---

## クイックスタート

### 開発環境セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/Gospel-AI/linguabridge.git
cd linguabridge

# フロントエンド
cd frontend
npm install
cp .env.example .env
npm run dev

# バックエンド（新しいターミナル）
cd backend
npm install
cp .env.example .env
npm run dev
```

### 環境変数

**フロントエンド (.env)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000
```

**バックエンド (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
PORT=3000
```

---

## チーム

| 役割 | 拠点 | 担当 |
|------|------|------|
| 企画・戦略 | 日本 | ビジネス、マーケティング、顧客獲得 |
| 開発 | ガーナ | フロントエンド、バックエンド、インフラ |

---

## お問い合わせ

- **GitHub Issues**: バグ報告、機能リクエスト
- **メール**: [連絡先メール]

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-12-04 | v1.0 | TaskBridgeフォークからLinguaBridge初期作成 |
