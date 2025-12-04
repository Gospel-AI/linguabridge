# TaskBridge v2.0 - 技術的変更点サマリー

**作成日**: 2025-10-31
**対象**: v1.0 → v2.0への技術的アップグレード要件

---

## 📋 概要

CLAUDE.mdとBUSINESS.mdのv2.0への更新に伴い、以下の技術的実装が必要になります。
現在のTECHNICAL.md、API.md、DATABASE.mdは**v1.0のまま**で、これらのドキュメントも更新が必要です。

---

## 🎯 主要な技術的変更点

### 1. フォーカスドメイン特化機能 (新規実装)

#### Domain 1: 翻訳・ローカライゼーション検証 🌍

**必要な実装**:
- [ ] **特化タスク投稿フォーム**
  - ソース言語/ターゲット言語選択UI
  - 評価基準テンプレート（正確性、自然さ、文化的適切性）
  - ドメイン固有のフィールド（業界、文書タイプ）

- [ ] **構造化評価テンプレート**
  - 評価フォームコンポーネント
  - スコアリングシステム（1-5スケール × 3カテゴリー）
  - コメント入力フィールド

- [ ] **自動ワーカーマッチング**
  - 言語ペアマッチングアルゴリズム
  - 言語能力レベルフィルタリング
  - 利用可能ワーカー検索API

**データベース変更**:
```sql
-- tasks テーブルに追加カラム
ALTER TABLE tasks ADD COLUMN domain_type VARCHAR(50); -- 'translation', 'ai_verification', 'physical', 'generic'
ALTER TABLE tasks ADD COLUMN source_language VARCHAR(10);
ALTER TABLE tasks ADD COLUMN target_language VARCHAR(10);
ALTER TABLE tasks ADD COLUMN evaluation_criteria JSONB;

-- workers テーブルに追加カラム
ALTER TABLE workers ADD COLUMN language_pairs JSONB; -- [{"source": "en", "target": "ja", "proficiency": "native"}]
ALTER TABLE workers ADD COLUMN specialized_domains TEXT[]; -- ['translation', 'ai_verification']
```

**新規APIエンドポイント**:
```
POST   /api/tasks/translation          # 翻訳タスク専用投稿
GET    /api/workers/by-language-pair   # 言語ペアでワーカー検索
POST   /api/evaluations/translation    # 翻訳評価提出
```

---

#### Domain 2: AI検証・改善 🤖

**必要な実装**:
- [ ] **AI品質チェックフォーム**
  - テキスト/画像/レスポンスの品質評価UI
  - バイアス検出チェックリスト
  - ハルシネーション（幻覚）検出フィールド

- [ ] **文化的適切性評価**
  - 地域別適切性スコアリング
  - 文化的配慮チェック項目
  - 改善提案入力欄

**データベース変更**:
```sql
ALTER TABLE tasks ADD COLUMN ai_content_type VARCHAR(50); -- 'text', 'image', 'response'
ALTER TABLE tasks ADD COLUMN bias_check_required BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN cultural_regions TEXT[]; -- ['north_america', 'asia', 'europe']

-- 新テーブル: AI検証結果
CREATE TABLE ai_verification_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  worker_id UUID REFERENCES workers(id),
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  bias_detected BOOLEAN,
  bias_details TEXT,
  hallucination_detected BOOLEAN,
  hallucination_details TEXT,
  cultural_appropriateness JSONB, -- {"region": "score"}
  improvement_suggestions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**新規APIエンドポイント**:
```
POST   /api/tasks/ai-verification      # AI検証タスク投稿
POST   /api/evaluations/ai-quality     # AI品質評価提出
GET    /api/tasks/ai-verification/:id/results  # 検証結果取得
```

---

#### Domain 3: 物理的データ収集・検証 📍

**必要な実装**:
- [ ] **位置情報ベースタスク割り当て**
  - 地理的エリアフィルタリング
  - 距離計算アルゴリズム（ワーカー位置 ↔ タスク位置）
  - エリア内ワーカー検索

- [ ] **GPS検証システム**
  - GPS座標取得（フロントエンド）
  - 位置情報検証API
  - 偽装検出ロジック（時間・距離整合性チェック）

- [ ] **写真品質自動チェック**
  - 画像解像度検証
  - ファイルサイズチェック
  - 画像鮮明度スコアリング（オプション: AI使用）
  - EXIFデータ検証（位置情報、撮影時刻）

**データベース変更**:
```sql
ALTER TABLE tasks ADD COLUMN location_required BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN task_location GEOGRAPHY(POINT, 4326); -- PostGIS
ALTER TABLE tasks ADD COLUMN radius_meters INTEGER; -- 許容範囲（メートル）
ALTER TABLE tasks ADD COLUMN photo_required BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN min_photo_resolution INTEGER; -- 最小解像度（ピクセル）

ALTER TABLE workers ADD COLUMN current_location GEOGRAPHY(POINT, 4326);
ALTER TABLE workers ADD COLUMN location_updated_at TIMESTAMP;

-- 新テーブル: タスク提出物（写真含む）
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  worker_id UUID REFERENCES workers(id),
  submission_location GEOGRAPHY(POINT, 4326),
  submission_time TIMESTAMP DEFAULT NOW(),
  photos JSONB, -- [{"url": "...", "resolution": "...", "exif": {...}}]
  gps_verified BOOLEAN DEFAULT false,
  photo_quality_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**新規APIエンドポイント**:
```
POST   /api/tasks/physical-data        # 物理データ収集タスク投稿
POST   /api/submissions/verify-gps     # GPS検証
POST   /api/submissions/upload-photo   # 写真アップロード＆品質チェック
GET    /api/workers/nearby/:taskId     # タスク近辺のワーカー検索
```

**技術スタック追加**:
- **PostGIS**: PostgreSQL地理空間拡張（位置情報クエリ）
- **Sharp/Jimp**: 画像処理ライブラリ（品質チェック）
- **EXIF Parser**: EXIF情報抽出

---

#### 汎用タスクカテゴリー（既存機能）

**実装要件**:
- [ ] **標準タスク投稿フォーム** - 既存のまま
- [ ] **基本評価システム** - 既存のまま
- [ ] **汎用トレーニング（オプション）** - 軽量版

**データベース**:
```sql
-- domain_type = 'generic' を使用
-- 既存のtasksテーブル構造で対応可能
```

---

### 2. 自動ワーカー認証システム 🎓

#### Step 1: オンライン申請（自動承認）

**実装不要**: 既存の会員登録フローを使用

#### Step 2: セルフペーストレーニング

**必要な実装**:
- [ ] **ビデオ学習システム**
  - Loom埋め込みコンポーネント
  - 視聴進捗トラッキング
  - ドメイン別ビデオリスト管理

- [ ] **インタラクティブ演習**
  - プラットフォーム統合演習UI
  - ドラッグ&ドロップ、選択式、記述式問題対応
  - リアルタイム正誤フィードバック

- [ ] **自動採点クイズエンジン**
  - 問題データベース（ドメイン別）
  - 自動採点ロジック（正答率70%判定）
  - 24時間再受験制限
  - 即時結果表示

**データベース変更**:
```sql
-- 新テーブル: トレーニングコンテンツ
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_type VARCHAR(50) NOT NULL,
  module_order INTEGER,
  video_url TEXT,
  video_duration_minutes INTEGER,
  exercises JSONB, -- [{"type": "multiple_choice", "question": "...", "options": [...], "correct": "..."}]
  quiz_questions JSONB, -- クイズ問題セット
  created_at TIMESTAMP DEFAULT NOW()
);

-- 新テーブル: ワーカー学習進捗
CREATE TABLE worker_training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES workers(id),
  domain_type VARCHAR(50),
  video_completed BOOLEAN DEFAULT false,
  video_watched_at TIMESTAMP,
  exercises_completed BOOLEAN DEFAULT false,
  exercises_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  quiz_passed BOOLEAN DEFAULT false,
  quiz_score DECIMAL(5,2),
  last_quiz_attempt_at TIMESTAMP,
  certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMP,
  UNIQUE(worker_id, domain_type)
);
```

**新規APIエンドポイント**:
```
GET    /api/training/:domain           # トレーニング内容取得
POST   /api/training/video-progress    # ビデオ視聴記録
POST   /api/training/submit-exercise   # 演習提出＆自動採点
POST   /api/training/submit-quiz       # クイズ提出＆自動採点
GET    /api/training/my-progress       # 進捗確認
```

#### Step 3: 認定テスト

**必要な実装**:
- [ ] **実サンプルタスク型テスト**
  - 過去の実タスクデータベース（匿名化）
  - 正解データベース
  - 自動採点（70%合格ライン）
  - 即時認定発行

**データベース**:
```sql
-- certification_tests は worker_training_progress の quiz_* フィールドで管理
ALTER TABLE workers ADD COLUMN certifications TEXT[]; -- ['translation', 'ai_verification', 'physical']
```

---

### 3. 2層パフォーマンスシステム（完全自動化）

**必要な実装**:
- [ ] **自動昇格システム**
  - Supabase Database Functions（定期実行）
  - 昇格条件チェック（完了タスク20+、平均評価4.2+）
  - 自動ティア変更＆通知メール送信

- [ ] **自動降格システム**
  - 月次評価集計Function
  - 降格条件チェック（2ヶ月連続4.0未満）
  - 自動ティア変更＆警告メール送信

- [ ] **支払い報酬計算**
  - ティア2ワーカーに自動20%ボーナス適用
  - Stripe Connect支払い額自動計算

**データベース変更**:
```sql
ALTER TABLE workers ADD COLUMN tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2));
ALTER TABLE workers ADD COLUMN tier_updated_at TIMESTAMP;
ALTER TABLE workers ADD COLUMN total_completed_tasks INTEGER DEFAULT 0;
ALTER TABLE workers ADD COLUMN average_rating DECIMAL(3,2);
ALTER TABLE workers ADD COLUMN last_month_rating DECIMAL(3,2);
ALTER TABLE workers ADD COLUMN prev_month_rating DECIMAL(3,2);

-- 新テーブル: ティア変更履歴
CREATE TABLE tier_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES workers(id),
  old_tier INTEGER,
  new_tier INTEGER,
  reason TEXT, -- 'auto_promotion', 'auto_demotion'
  trigger_conditions JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

**Supabase Functions**:
```sql
-- 関数1: 自動昇格チェック（日次実行）
CREATE OR REPLACE FUNCTION auto_promote_workers()
RETURNS void AS $$
BEGIN
  UPDATE workers
  SET tier = 2, tier_updated_at = NOW()
  WHERE tier = 1
    AND total_completed_tasks >= 20
    AND average_rating >= 4.2;

  -- tier_changesに記録
  -- メール通知トリガー
END;
$$ LANGUAGE plpgsql;

-- 関数2: 自動降格チェック（月次実行）
CREATE OR REPLACE FUNCTION auto_demote_workers()
RETURNS void AS $$
BEGIN
  UPDATE workers
  SET tier = 1, tier_updated_at = NOW()
  WHERE tier = 2
    AND last_month_rating < 4.0
    AND prev_month_rating < 4.0;

  -- tier_changesに記録
  -- メール通知トリガー
END;
$$ LANGUAGE plpgsql;
```

**新規APIエンドポイント**:
```
GET    /api/workers/tier-status        # 現在のティアステータス
GET    /api/workers/tier-progress      # 昇格までの進捗
```

---

### 4. 品質管理自動化

**必要な実装**:
- [ ] **自動品質チェック**
  - 必須フィールド検証（フロントエンド＆バックエンド）
  - 写真品質チェック（サイズ、解像度、鮮明度）
  - GPS位置検証（距離整合性）
  - 極端評価バイアス検出（全5星 or 全1星）

- [ ] **顧客評価システム**
  - 1-5星評価（必須）
  - フィードバック（任意）
  - 問題報告ボタン

- [ ] **手動介入フロー（例外処理のみ）**
  - 問題報告ダッシュボード
  - 不正疑惑フラグ管理
  - 低評価ワーカー警告システム

**データベース変更**:
```sql
-- 新テーブル: 品質チェック結果
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES task_submissions(id),
  required_fields_ok BOOLEAN,
  photo_quality_ok BOOLEAN,
  gps_verified_ok BOOLEAN,
  rating_bias_detected BOOLEAN,
  overall_status VARCHAR(20), -- 'passed', 'flagged', 'failed'
  check_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 新テーブル: 問題報告
CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  reporter_id UUID, -- 顧客ID
  reported_worker_id UUID REFERENCES workers(id),
  issue_type VARCHAR(50), -- 'quality', 'fraud', 'inappropriate'
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved'
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

**新規APIエンドポイント**:
```
POST   /api/submissions/quality-check  # 自動品質チェック実行
POST   /api/reports/problem            # 問題報告
GET    /api/admin/reports              # 問題報告一覧（管理者）
PATCH  /api/admin/reports/:id          # 問題解決
```

---

### 5. その他の技術的追加要件

#### API for Enterprise Customers (Phase 2)

**実装時期**: Month 10-12

**必要な実装**:
- [ ] **RESTful API**
  - API Key認証
  - タスク一括投稿エンドポイント
  - Webhook通知（タスク完了時）
  - レート制限

**データベース**:
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_secret VARCHAR(128) NOT NULL,
  rate_limit INTEGER DEFAULT 100, -- リクエスト/分
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  event_type VARCHAR(50), -- 'task.completed', 'task.failed'
  webhook_url TEXT NOT NULL,
  secret VARCHAR(128),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 技術ドキュメント更新が必要なファイル

### 1. TECHNICAL.md / TECHNICAL.jp.md
**更新内容**:
- [ ] バージョンをv2.0に更新
- [ ] システムアーキテクチャにフォーカスドメイン追加
- [ ] 自動化システム（ワーカー認証、ティア管理）の技術詳細
- [ ] PostGIS、画像処理ライブラリの追加
- [ ] Supabase Functions設計

### 2. API.md
**更新内容**:
- [ ] バージョンをv2.0に更新
- [ ] フォーカスドメイン別APIエンドポイント追加
- [ ] トレーニング関連API追加
- [ ] GPS検証、写真アップロードAPI追加
- [ ] Enterprise API仕様（Phase 2）

### 3. DATABASE.md
**更新内容**:
- [ ] バージョンをv2.0に更新
- [ ] 新規テーブル追加（10テーブル以上）
- [ ] 既存テーブルへのカラム追加
- [ ] Supabase Functions定義
- [ ] RLSポリシー更新

---

## 🚀 実装優先順位

### Month 1 (Week 1-4)

**Week 1: フォーカスドメイン基盤**
1. データベーススキーマ更新（domain_type追加）
2. Domain 1: 翻訳特化フォーム実装
3. Domain 2: AI検証フォーム実装
4. Domain 3: 物理データフォーム実装

**Week 2: トレーニングシステム**
1. トレーニングモジュールDB設計
2. ビデオ埋め込み＆進捗トラッキング
3. クイズエンジン実装（自動採点）
4. 認証システム実装

**Week 3: 自動化＆品質管理**
1. 2層システム自動化（Supabase Functions）
2. 品質チェック自動化
3. GPS検証実装
4. 写真品質チェック実装

**Week 4: テスト＆統合**
1. 内部テスト
2. バグ修正
3. ドキュメント更新

---

## ⚠️ 技術的リスクと対策

### リスク1: PostGIS導入の複雑性
**対策**:
- Supabaseは標準でPostGIS対応
- 簡単なクエリから開始（ST_Distance）
- 複雑な地理空間クエリは後回し

### リスク2: 画像処理パフォーマンス
**対策**:
- Sharp（高速画像処理ライブラリ）使用
- 解像度チェックのみ実装、詳細分析は後回し
- 非同期処理で対応

### リスク3: Supabase Functions初体験
**対策**:
- シンプルなFunction（昇格チェック）から開始
- PostgreSQL標準関数の知識活用
- テスト環境で十分検証

---

## 📝 次のアクション

1. **このドキュメントのレビュー**: 技術的変更点の妥当性確認
2. **TECHNICAL.md v2.0更新**: システムアーキテクチャ全体の更新
3. **API.md v2.0更新**: 新規エンドポイント詳細仕様
4. **DATABASE.md v2.0更新**: スキーマ変更とSupabase Functions定義
5. **実装開始**: Week 1から順次実装

---

## 📞 質問・確認事項

1. GPS検証の精度要件は？（例: 100m以内、500m以内）
2. 写真品質の最小解像度は？（例: 1280x720以上）
3. トレーニングビデオは誰が作成？（日本側 or Ghana側）
4. クイズ問題は誰が作成？（日本側が初期セット提供？）
5. Supabase Functions実装経験は？（サポートが必要か）

---

**このドキュメント作成者**: Claude (AI Assistant)
**次のステップ**: 技術リード（Ghana側）とのレビュー会議
