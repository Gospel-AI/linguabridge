# TaskBridge v2.0 データベースマイグレーションガイド

**バージョン**: v2.0
**作成日**: 2025-10-31
**対象**: 開発者（ガーナ側 + 日本側）

---

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [マイグレーション実行手順](#マイグレーション実行手順)
4. [検証方法](#検証方法)
5. [トラブルシューティング](#トラブルシューティング)
6. [ロールバック手順](#ロールバック手順)

---

## 概要

TaskBridge v1.0 から v2.0 へのデータベースマイグレーションガイドです。

### v2.0の主な変更点

**新規テーブル（8個）**:
- `workers` - ワーカープロフィールとティアシステム
- `training_modules` - トレーニングコンテンツ
- `worker_training_progress` - トレーニング進捗
- `task_submissions` - タスク提出物
- `ai_verification_results` - AI検証結果
- `quality_checks` - 品質チェック
- `tier_changes` - ティア変更履歴
- `problem_reports` - 問題報告

**既存テーブルの更新**:
- `tasks` - ドメイン固有フィールド追加（翻訳、AI検証、物理データ）
- `transactions` - ティアボーナス追加

**新機能**:
- PostGIS geospatial クエリ
- 自動ティア昇格/降格
- pg_cron スケジュールジョブ
- GPS検証と不正検出
- RLS（Row Level Security）ポリシー

---

## 前提条件

### 必要なツール
- Supabase プロジェクト（既存または新規）
- PostgreSQL 14+ （Supabaseに含まれる）
- Supabase CLI または SQL Editor

### 必要な権限
- データベース管理者権限
- Extension 作成権限（PostGIS, pg_cron）

### バックアップ
⚠️ **重要**: マイグレーション前に必ずデータベースのバックアップを取得してください。

```bash
# Supabase CLI を使用する場合
supabase db dump -f backup_before_v2_migration.sql

# または Supabase Dashboard から手動でバックアップ
```

---

## マイグレーション実行手順

### 実行順序

以下の順序で **必ず** 実行してください。順序を間違えるとエラーが発生します。

| 順序 | ファイル名 | 説明 | 実行時間目安 |
|------|-----------|------|-------------|
| 1 | `20251031140000_enable_extensions.sql` | PostGIS & pg_cron 拡張を有効化 | ~5秒 |
| 2 | `20251031140100_create_worker_tables.sql` | Worker関連テーブル作成 | ~10秒 |
| 3 | `20251031140200_create_submission_tables.sql` | Submission関連テーブル作成 | ~10秒 |
| 4 | `20251031140300_create_audit_tables.sql` | Audit関連テーブル作成 | ~5秒 |
| 5 | `20251031140400_update_existing_tables.sql` | 既存テーブル更新 | ~10秒 |
| 6 | `20251031140500_create_automation_functions.sql` | 自動化関数作成 | ~5秒 |
| 7 | `20251031140600_create_postgis_functions.sql` | PostGIS関数作成 | ~5秒 |
| 8 | `20251031140700_setup_rls_policies.sql` | RLSポリシー設定 | ~10秒 |
| 9 | `20251031140800_setup_cron_jobs.sql` | pg_cronジョブ設定 | ~5秒 |

**合計実行時間**: 約 1-2分

---

### 実行方法

#### オプション1: Supabase Dashboard（推奨）

1. Supabase Dashboard にログイン
2. プロジェクトを選択
3. 左メニューから **SQL Editor** を開く
4. **New Query** をクリック
5. マイグレーションファイルの内容をコピー&ペースト
6. **Run** をクリック
7. 成功メッセージを確認
8. 次のファイルに進む

#### オプション2: Supabase CLI

```bash
# Supabase CLI がインストールされている場合

cd /path/to/taskbridge

# プロジェクトにリンク（初回のみ）
supabase link --project-ref your-project-ref

# マイグレーション実行（1つずつ）
supabase db execute -f database/migrations/20251031140000_enable_extensions.sql
supabase db execute -f database/migrations/20251031140100_create_worker_tables.sql
supabase db execute -f database/migrations/20251031140200_create_submission_tables.sql
# ... 残りも同様に実行
```

#### オプション3: psql（直接接続）

```bash
# Supabase の Database Settings から接続文字列を取得

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# psql プロンプトで
\i database/migrations/20251031140000_enable_extensions.sql
\i database/migrations/20251031140100_create_worker_tables.sql
# ... 残りも同様に実行
```

---

### 各ステップの詳細

#### Phase 0: 拡張機能の有効化
```sql
-- 実行内容
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 確認
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('postgis', 'pg_cron');
```

**期待される出力**:
```
   extname   | extversion
-------------+------------
 postgis     | 3.3.2
 pg_cron     | 1.5
```

---

#### Phase 1-3: 新規テーブル作成

```sql
-- 確認（すべてのテーブルが作成されたか）
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**期待される出力** (v2.0 テーブルを含む):
```
tablename
--------------------------
applications
ai_verification_results
problem_reports
quality_checks
task_submissions
tasks
tier_changes
training_modules
transactions
users
worker_training_progress
workers
```

---

#### Phase 4: 既存テーブル更新

```sql
-- tasks テーブルに新しいカラムが追加されたか確認
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('domain_type', 'translation_source_lang', 'ai_content_type', 'physical_location');
```

**期待される出力**:
```
column_name
------------------------
domain_type
translation_source_lang
ai_content_type
physical_location
```

---

#### Phase 5-6: 関数作成

```sql
-- 作成された関数を確認
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'auto_promote_workers',
  'auto_demote_workers',
  'update_worker_ratings',
  'tasks_within_radius',
  'verify_gps_location'
)
ORDER BY proname;
```

**期待される出力**:
```
proname
------------------------
auto_demote_workers
auto_promote_workers
tasks_within_radius
update_worker_ratings
verify_gps_location
```

---

#### Phase 7: RLSポリシー

```sql
-- RLSポリシーが作成されたか確認
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**期待される出力**:
```
tablename                | policy_count
-------------------------+-------------
applications             | 3
workers                  | 3
worker_training_progress | 3
task_submissions         | 5
...
```

---

#### Phase 8: Cronジョブ

```sql
-- スケジュールされたジョブを確認
SELECT jobname, schedule, active FROM cron.job;
```

**期待される出力**:
```
jobname                     | schedule    | active
----------------------------+-------------+--------
auto-promote-workers        | 0 0 * * *   | t
auto-demote-workers         | 30 0 * * *  | t
update-monthly-ratings      | 0 1 1 * *   | t
cleanup-old-quality-checks  | 0 2 * * 0   | t
archive-resolved-reports    | 0 3 15 * *  | t
```

---

## 検証方法

### 完全な検証チェックリスト

```sql
-- ========================================
-- 1. 拡張機能の確認
-- ========================================
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('postgis', 'pg_cron');

-- 期待: 2行（postgis, pg_cron）

-- ========================================
-- 2. テーブル数の確認
-- ========================================
SELECT COUNT(*) as table_count FROM pg_tables
WHERE schemaname = 'public';

-- 期待: 12テーブル

-- ========================================
-- 3. インデックス作成確認
-- ========================================
SELECT COUNT(*) as index_count FROM pg_indexes
WHERE schemaname = 'public';

-- 期待: 60+ インデックス

-- ========================================
-- 4. 関数作成確認
-- ========================================
SELECT COUNT(*) as function_count FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'auto_promote_workers',
  'auto_demote_workers',
  'update_worker_ratings',
  'update_monthly_ratings',
  'calculate_tier_bonus',
  'tasks_within_radius',
  'workers_within_radius',
  'calculate_distance_meters',
  'verify_gps_location',
  'detect_gps_spoofing',
  'update_worker_location'
);

-- 期待: 11関数

-- ========================================
-- 5. RLSポリシー確認
-- ========================================
SELECT COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public';

-- 期待: 30+ ポリシー

-- ========================================
-- 6. Cronジョブ確認
-- ========================================
SELECT COUNT(*) as job_count FROM cron.job WHERE active = TRUE;

-- 期待: 5ジョブ

-- ========================================
-- 7. トリガー確認
-- ========================================
SELECT COUNT(*) as trigger_count FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 期待: 10+ トリガー
```

---

### 機能テスト

#### 1. PostGIS 動作確認

```sql
-- 距離計算テスト（東京 → ロンドン）
SELECT calculate_distance_meters(
  139.6917, 35.6895,  -- Tokyo
  -0.1278, 51.5074    -- London
) AS distance_meters;

-- 期待: 約 9,585,000 メートル（9,585km）
```

#### 2. 自動化関数テスト

```sql
-- テスト用ワーカーを作成（手動テスト）
-- 注: 実際のユーザーIDに置き換えてください

INSERT INTO workers (user_id, tier, total_completed_tasks, average_rating)
VALUES ('test-user-id', 1, 25, 4.5);

-- 昇格関数を手動実行
SELECT auto_promote_workers();

-- 確認
SELECT id, tier, tier_updated_at FROM workers WHERE user_id = 'test-user-id';

-- 期待: tier = 2 に昇格
```

#### 3. GPS検証テスト

```sql
-- GPS検証テスト（サンプルタスク作成）
INSERT INTO tasks (
  creator_id,
  title,
  description,
  category,
  domain_type,
  amount,
  physical_location,
  physical_verification_radius
) VALUES (
  'test-client-id',
  'Test Physical Task',
  'Test GPS verification',
  'data_collection',
  'physical_data',
  10.00,
  ST_MakePoint(139.6917, 35.6895)::geography,  -- Tokyo
  100
);

-- 検証テスト（100m以内）
SELECT * FROM verify_gps_location(
  'task-id-here',
  139.6927,  -- 100m east
  35.6895
);

-- 期待: verified = TRUE, within_radius = TRUE
```

---

## トラブルシューティング

### よくあるエラーと解決方法

#### エラー1: `extension "postgis" does not exist`

**原因**: PostGIS拡張が利用できない

**解決方法**:
```sql
-- Supabase では通常自動的に利用可能
-- 手動で有効化
CREATE EXTENSION postgis;

-- それでもエラーの場合は Supabase サポートに連絡
```

---

#### エラー2: `permission denied to create extension`

**原因**: 拡張作成権限がない

**解決方法**:
- Supabase Dashboard の SQL Editor から実行
- `service_role` キーを使用
- または Supabase サポートに連絡

---

#### エラー3: `relation "workers" already exists`

**原因**: テーブルが既に存在する（マイグレーション再実行）

**解決方法**:
```sql
-- テーブルを削除してから再実行
DROP TABLE IF EXISTS workers CASCADE;

-- または、マイグレーションをスキップ
```

---

#### エラー4: `column "domain_type" of relation "tasks" already exists`

**原因**: カラムが既に追加されている

**解決方法**:
```sql
-- カラムの存在を確認
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'domain_type';

-- 存在する場合はスキップして次に進む
```

---

#### エラー5: `function auto_promote_workers() already exists`

**原因**: 関数が既に作成されている

**解決方法**:
```sql
-- 関数を置き換え（CREATE OR REPLACE を使用）
-- マイグレーションスクリプトは既に OR REPLACE を使用しているので
-- 単に再実行すれば上書きされる
```

---

#### エラー6: Cronジョブが実行されない

**原因**: pg_cron拡張が正しく設定されていない

**解決方法**:
```sql
-- pg_cron が有効か確認
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ジョブを確認
SELECT * FROM cron.job;

-- 実行履歴を確認
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ジョブを手動実行してテスト
SELECT auto_promote_workers();
```

---

### デバッグクエリ

```sql
-- ========================================
-- すべてのテーブルとカラムを表示
-- ========================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ========================================
-- すべての制約を表示
-- ========================================
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, contype;

-- ========================================
-- すべてのインデックスを表示
-- ========================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## ロールバック手順

⚠️ **警告**: ロールバックはデータ損失を引き起こす可能性があります。慎重に実行してください。

### 完全ロールバック（v1.0に戻す）

```sql
-- ========================================
-- Phase 1: Cronジョブ削除
-- ========================================
SELECT cron.unschedule('auto-promote-workers');
SELECT cron.unschedule('auto-demote-workers');
SELECT cron.unschedule('update-monthly-ratings');
SELECT cron.unschedule('cleanup-old-quality-checks');
SELECT cron.unschedule('archive-resolved-reports');

-- ========================================
-- Phase 2: 関数削除
-- ========================================
DROP FUNCTION IF EXISTS auto_promote_workers();
DROP FUNCTION IF EXISTS auto_demote_workers();
DROP FUNCTION IF EXISTS update_worker_ratings();
DROP FUNCTION IF EXISTS update_monthly_ratings();
DROP FUNCTION IF EXISTS calculate_tier_bonus(UUID, DECIMAL);
DROP FUNCTION IF EXISTS tasks_within_radius(FLOAT, FLOAT, INT);
DROP FUNCTION IF EXISTS workers_within_radius(FLOAT, FLOAT, INT);
DROP FUNCTION IF EXISTS calculate_distance_meters(FLOAT, FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS verify_gps_location(UUID, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS detect_gps_spoofing(UUID, FLOAT, FLOAT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS update_worker_location(UUID, FLOAT, FLOAT);

-- ========================================
-- Phase 3: 新規テーブル削除（CASCADE）
-- ========================================
DROP TABLE IF EXISTS problem_reports CASCADE;
DROP TABLE IF EXISTS tier_changes CASCADE;
DROP TABLE IF EXISTS quality_checks CASCADE;
DROP TABLE IF EXISTS ai_verification_results CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS worker_training_progress CASCADE;
DROP TABLE IF EXISTS training_modules CASCADE;
DROP TABLE IF EXISTS workers CASCADE;

-- ========================================
-- Phase 4: 既存テーブルから新規カラム削除
-- ========================================

-- tasks テーブル
ALTER TABLE tasks DROP COLUMN IF EXISTS domain_type;
ALTER TABLE tasks DROP COLUMN IF EXISTS required_tier;
ALTER TABLE tasks DROP COLUMN IF EXISTS translation_source_lang;
ALTER TABLE tasks DROP COLUMN IF EXISTS translation_target_lang;
ALTER TABLE tasks DROP COLUMN IF EXISTS translation_content_type;
ALTER TABLE tasks DROP COLUMN IF EXISTS translation_evaluation_criteria;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_content_type;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_check_hallucinations;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_check_bias;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_check_cultural;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_sample_content;
ALTER TABLE tasks DROP COLUMN IF EXISTS ai_context_info;
ALTER TABLE tasks DROP COLUMN IF EXISTS physical_location;
ALTER TABLE tasks DROP COLUMN IF EXISTS physical_location_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS physical_required_photos;
ALTER TABLE tasks DROP COLUMN IF EXISTS physical_verification_radius;
ALTER TABLE tasks DROP COLUMN IF EXISTS physical_data_points;

-- transactions テーブル
ALTER TABLE transactions DROP COLUMN IF EXISTS worker_tier;
ALTER TABLE transactions DROP COLUMN IF EXISTS tier_bonus;
ALTER TABLE transactions DROP COLUMN IF EXISTS base_amount;

-- ========================================
-- Phase 5: 拡張機能の無効化（オプション）
-- ========================================
-- 注意: 他のプロジェクトで使用している可能性があるため慎重に
-- DROP EXTENSION IF EXISTS pg_cron CASCADE;
-- DROP EXTENSION IF EXISTS postgis CASCADE;

-- ========================================
-- 確認
-- ========================================
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- 期待: users, tasks, applications, transactions のみ
```

---

### 部分ロールバック（特定のフィーチャーのみ）

#### Cronジョブのみ無効化

```sql
-- ジョブを無効化（削除せず）
UPDATE cron.job SET active = FALSE WHERE jobname IN (
  'auto-promote-workers',
  'auto-demote-workers',
  'update-monthly-ratings'
);

-- 確認
SELECT jobname, active FROM cron.job;
```

#### RLSポリシーのみ無効化

```sql
-- 特定のテーブルのRLSを無効化
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;
-- ...
```

---

## 次のステップ

マイグレーション完了後:

1. ✅ **バックエンドAPI実装**
   - Focus domain endpoints を実装
   - Training & certification API を実装
   - GPS verification を実装

2. ✅ **フロントエンド実装**
   - Worker application flow
   - Training system UI
   - Task submission forms

3. ✅ **テストデータ作成**
   - サンプルワーカー
   - サンプルタスク
   - トレーニングモジュール

4. ✅ **統合テスト**
   - End-to-end testing
   - 自動化機能の検証
   - パフォーマンステスト

---

## サポート

問題が発生した場合:

1. このガイドの「トラブルシューティング」セクションを確認
2. GitHub Issues で報告
3. チーム内で相談（週次ミーティング）

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-10-31 | 1.0 | 初版作成、v2.0マイグレーション手順 |

---

**重要なリマインダー**:
- ✅ 必ずバックアップを取得してから実行
- ✅ 開発環境で先にテスト
- ✅ 実行順序を厳守
- ✅ 各ステップ後に検証
- ✅ エラーが発生したら即座に停止して調査
