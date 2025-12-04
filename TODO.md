# LinguaBridge - 開発TODO

**最終更新**: 2025-12-04

---

## 完了タスク ✅

### フェーズ1: プロジェクトセットアップ
- [x] TaskBridgeからフォーク
- [x] GitHubリポジトリ作成 (kazoo0104/linguabridge)
- [x] ブランディング更新 (LinguaBridge)
- [x] TaskBridge固有ファイルのクリーンアップ (46ファイル削除)
- [x] package.json名の更新
- [x] 新規CLAUDE.mdドキュメント作成

### フェーズ2: データベーススキーマ
- [x] アノテーションスキーママイグレーション作成
  - `annotation_projects` テーブル
  - `annotation_tasks` テーブル
  - `annotations` テーブル
  - `annotator_profiles` テーブル
  - `supported_languages` テーブル
- [x] 統計更新用トリガー追加
- [x] RLSポリシー追加
- [x] TypeScript型定義更新 (`frontend/src/types/database.ts`)

### フェーズ3: アノテーションUI
- [x] ClassificationAnnotatorコンポーネント (単一/複数ラベル)
- [x] NERAnnotatorコンポーネント (テキストハイライト)
- [x] RankingAnnotatorコンポーネント (RLHF比較)
- [x] EvaluationAnnotatorコンポーネント (1-5スケール)
- [x] TranslationValidationAnnotatorコンポーネント (エラーマーキング)
- [x] ProjectListページ
- [x] AnnotationWorkspaceページ
- [x] App.tsxルート更新
- [x] Navbar更新

---

## 進行中 🔄

### フェーズ4: バッチアップロード
- [ ] CSVアップロードエンドポイント (バックエンド)
- [ ] JSONアップロードエンドポイント (バックエンド)
- [ ] アップロードUIコンポーネント (フロントエンド)
- [ ] 進捗インジケーター
- [ ] バリデーションとエラーハンドリング

---

## 保留中タスク 📋

### フェーズ5: 品質管理
- [ ] ゴールドスタンダードタスク挿入
- [ ] アノテーター精度の自動計算
- [ ] IAA (評価者間一致度) 計算
- [ ] クライアント向け品質ダッシュボード

### フェーズ6: API開発
- [ ] クライアント向けREST API
  - `POST /api/projects` - プロジェクト作成
  - `POST /api/projects/:id/tasks/batch` - タスクアップロード
  - `GET /api/projects/:id/export` - アノテーションエクスポート
- [ ] APIドキュメント (Swagger)
- [ ] Python SDK (オプション)

### フェーズ7: アノテーターシステム
- [ ] アノテータープロフィールページ
- [ ] 言語能力設定
- [ ] 認定システム
- [ ] ティア昇格 (スタンダード → プロ)
- [ ] パフォーマンスダッシュボード

### フェーズ8: クライアント機能
- [ ] プロジェクト作成ウィザード
- [ ] プロジェクト分析ダッシュボード
- [ ] エクスポート機能 (JSONL, CSV)
- [ ] 課金連携 (Stripe)

### フェーズ9: トレーニングシステム
- [ ] トレーニング動画連携
- [ ] クイズエンジン
- [ ] 自動採点認定テスト
- [ ] トレーニング完了追跡

---

## 技術的負債 🔧

- [ ] テストファイルのTypeScriptエラー修正 (TaskCard.test.tsx, useProfile.test.ts)
- [ ] 新スキーマ用mockData.ts更新
- [ ] 適切なSupabase型生成の追加
- [ ] アノテーションコンポーネントのフロントエンドテスト追加

---

## データベースマイグレーション状況

| マイグレーション | ステータス | 説明 |
|-----------------|----------|------|
| `20251204000000_linguabridge_annotation_schema.sql` | 準備完了 | アノテーションテーブルとトリガー |

**注意**: アノテーション機能を使用する前にSupabaseでマイグレーションを実行してください。

---

## ファイル構成

```
frontend/src/
├── components/
│   └── annotation/
│       ├── ClassificationAnnotator.tsx  ✅
│       ├── NERAnnotator.tsx             ✅
│       ├── RankingAnnotator.tsx         ✅
│       ├── EvaluationAnnotator.tsx      ✅
│       ├── TranslationValidationAnnotator.tsx ✅
│       └── index.ts                     ✅
├── pages/
│   └── annotation/
│       ├── ProjectList.tsx              ✅
│       ├── AnnotationWorkspace.tsx      ✅
│       └── index.ts                     ✅
└── types/
    └── database.ts                      ✅ (更新済み)

database/migrations/
└── 20251204000000_linguabridge_annotation_schema.sql ✅
```

---

## クイックコマンド

```bash
# フロントエンド開発
cd frontend && npm run dev

# バックエンド開発
cd backend && npm run dev

# ビルドチェック
cd frontend && npm run build

# テスト実行
npm test
```

---

## メモ

- サポート言語: 英語、アカン語、ハウサ語、ヨルバ語、イボ語、ナイジェリアン・ピジン、トルコ語
- 価格設定: Scale AIの50%以下
- ターゲット: AI/MLスタートアップ、研究機関
