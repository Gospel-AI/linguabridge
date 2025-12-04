# TaskBridge Database Migrations

このディレクトリには、TaskBridge データベースのすべてのマイグレーションファイルが含まれています。

## 📁 ディレクトリ構成

```
database/migrations/
├── README.md                                      # このファイル
├── run-migration.sh                               # Bash migration runner
├── run-migration.cjs                              # Node.js migration runner
├── 20251031140000_enable_extensions.sql          # PostGIS & 拡張機能
├── 20251031140100_create_worker_tables.sql       # Worker関連テーブル
├── 20251031140200_create_submission_tables.sql   # 応募・提出テーブル
├── 20251031140300_create_audit_tables.sql        # 監査ログテーブル
├── 20251031140400_update_existing_tables.sql     # 既存テーブル更新
├── 20251031140500_create_automation_functions.sql # 自動化関数
├── 20251031140600_create_postgis_functions.sql   # 位置情報関数
├── 20251031140700_setup_rls_policies.sql         # Row Level Security
├── 20251031140800_setup_cron_jobs.sql            # Cron ジョブ
└── 20251101000000_add_app_testing_domain.sql     # App Testing ドメイン追加
```

## 🚀 マイグレーションの実行方法

### 方法1: Bash スクリプト（推奨）

```bash
cd database/migrations

# デフォルトマイグレーション（最新）を実行
./run-migration.sh

# 特定のマイグレーションを実行
./run-migration.sh 20251101000000_add_app_testing_domain.sql
```

**必要なツール:**
- `psql` (PostgreSQL クライアント)
- `jq` (psqlがない場合のフォールバック)

**インストール方法:**
```bash
# macOS
brew install postgresql jq

# Linux
sudo apt-get install postgresql-client jq
```

---

### 方法2: Node.js スクリプト

```bash
cd database/migrations

# Node.js 依存関係のインストール（初回のみ）
cd ../../backend
npm install

cd ../database/migrations

# デフォルトマイグレーション（最新）を実行
node run-migration.cjs

# 特定のマイグレーションを実行
node run-migration.cjs 20251101000000_add_app_testing_domain.sql
```

**必要な依存関係:**
- Node.js 20+
- `pg` パッケージ（backend/package.jsonに含まれる）

---

## ⚙️ 環境変数の設定

マイグレーションスクリプトは `backend/.env` から以下の環境変数を読み込みます:

```bash
# backend/.env

# Supabase プロジェクトURL
SUPABASE_URL="https://your-project-ref.supabase.co"

# Supabase サービスロールキー（データベース操作用）
SUPABASE_SERVICE_KEY="your_service_role_key_here"
```

**環境変数の取得方法:**

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. プロジェクトを選択
3. **Settings** → **API** に移動
4. 以下をコピー:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (一番下にスクロール) → `SUPABASE_SERVICE_KEY`

---

## 📝 マイグレーション命名規則

```
YYYYMMDDHHmmss_description.sql
```

**例:**
- `20251031140000_enable_extensions.sql`
  - 日付: 2025年10月31日 14:00:00
  - 説明: enable_extensions

**新しいマイグレーションを作成する場合:**
```bash
# 現在の日時を取得
date +"%Y%m%d%H%M%S"

# 例: 20251101130000_add_new_feature.sql
```

---

## 📚 マイグレーション実行順序

マイグレーションは**ファイル名の昇順**で実行されます:

1. ✅ `20251031140000_enable_extensions.sql` - 拡張機能有効化
2. ✅ `20251031140100_create_worker_tables.sql` - Worker基盤
3. ✅ `20251031140200_create_submission_tables.sql` - 応募システム
4. ✅ `20251031140300_create_audit_tables.sql` - 監査ログ
5. ✅ `20251031140400_update_existing_tables.sql` - テーブル更新
6. ✅ `20251031140500_create_automation_functions.sql` - 自動化
7. ✅ `20251031140600_create_postgis_functions.sql` - 位置情報
8. ✅ `20251031140700_setup_rls_policies.sql` - セキュリティ
9. ✅ `20251031140800_setup_cron_jobs.sql` - スケジュール実行
10. ✅ `20251101000000_add_app_testing_domain.sql` - App Testing対応

---

## 🔍 マイグレーション内容の概要

### 初期セットアップ (20251031140000～140800)

**20251031140000_enable_extensions.sql**
- PostGIS 拡張機能
- UUID 生成関数
- その他必要な拡張機能

**20251031140100_create_worker_tables.sql**
- `workers` テーブル（ワーカープロフィール）
- `worker_certifications` テーブル（認定情報）
- `worker_skills` テーブル（スキル情報）

**20251031140200_create_submission_tables.sql**
- `applications` テーブル（タスク応募）
- `submissions` テーブル（タスク提出物）
- `task_assignments` テーブル（タスク割り当て）

**20251031140300_create_audit_tables.sql**
- `audit_logs` テーブル（全操作ログ）
- 自動ログ記録トリガー

**20251031140400_update_existing_tables.sql**
- 既存の `tasks`, `profiles` テーブルへのカラム追加
- インデックス最適化

**20251031140500_create_automation_functions.sql**
- ワーカーティア自動昇格関数
- タスク期限通知関数
- パフォーマンス評価自動計算

**20251031140600_create_postgis_functions.sql**
- 距離計算関数（物理データ収集タスク用）
- エリア検索関数

**20251031140700_setup_rls_policies.sql**
- すべてのテーブルの Row Level Security (RLS) ポリシー
- ロールベースアクセス制御

**20251031140800_setup_cron_jobs.sql**
- 定期実行ジョブ設定
- 自動ティア昇格（日次）
- タスク期限通知（1時間ごと）

---

### 追加機能 (20251101000000～)

**20251101000000_add_app_testing_domain.sql**
- `tasks` テーブルに `custom_fields` カラム追加（JSONB）
- App Testing ドメインを `training_modules` に追加
- App Testing 用のトレーニングモジュールデータ挿入
- GIN インデックス作成（custom_fields の高速検索用）

---

## 🛡️ セキュリティ注意事項

⚠️ **重要**: マイグレーションスクリプトはデータベースを直接変更します。

### 本番環境での実行前に:

1. ✅ **バックアップを取得**
   ```bash
   # Supabase Dashboard → Database → Backups
   ```

2. ✅ **開発環境でテスト**
   ```bash
   # テスト用プロジェクトで実行して確認
   ```

3. ✅ **変更内容を確認**
   ```bash
   # SQLファイルを読んで内容を理解
   cat 20251101000000_add_app_testing_domain.sql
   ```

4. ✅ **ロールバック計画**
   - 各マイグレーションの逆操作SQLを準備

### 機密情報の取り扱い:

- ❌ `SUPABASE_SERVICE_KEY` を公開リポジトリにコミットしない
- ❌ マイグレーションログをSlack/メールで共有しない
- ✅ `.env` ファイルは `.gitignore` に含まれている

---

## 🔄 ロールバック（巻き戻し）

マイグレーションに問題がある場合:

### 方法1: Supabase Dashboard から手動ロールバック

1. [Supabase Dashboard](https://app.supabase.com) → **Database** → **Backups**
2. 最新のバックアップから復元

### 方法2: 逆マイグレーションSQLを作成

```sql
-- 例: 20251101000000_add_app_testing_domain.sql のロールバック
-- rollback_20251101000000_add_app_testing_domain.sql

-- training_modulesからapp_testingを削除
DELETE FROM training_modules WHERE domain_type = 'app_testing';

-- constraintを元に戻す
ALTER TABLE training_modules
DROP CONSTRAINT IF EXISTS training_modules_domain_type_check;

ALTER TABLE training_modules
ADD CONSTRAINT training_modules_domain_type_check
CHECK (domain_type = ANY (ARRAY['translation'::text, 'ai_verification'::text, 'physical_data'::text]));

-- インデックスを削除
DROP INDEX IF EXISTS idx_tasks_custom_fields;

-- カラムを削除
ALTER TABLE tasks DROP COLUMN IF EXISTS custom_fields;
```

**実行:**
```bash
./run-migration.sh rollback_20251101000000_add_app_testing_domain.sql
```

---

## 🧪 マイグレーションのテスト

### ローカルテスト環境の構築:

1. **テスト用 Supabase プロジェクトを作成**
   - [Supabase Dashboard](https://app.supabase.com) で新規プロジェクト

2. **環境変数を設定**
   ```bash
   # backend/.env.test
   SUPABASE_URL="https://test-project.supabase.co"
   SUPABASE_SERVICE_KEY="test_service_key"
   ```

3. **マイグレーションを実行**
   ```bash
   # テスト環境用の.envを使用
   cp backend/.env.test backend/.env
   ./run-migration.sh
   ```

4. **検証**
   ```bash
   # Supabase Dashboard → Table Editor で確認
   # または psql で確認
   psql "postgresql://postgres.test-project:PASSWORD@db.test-project.supabase.co:5432/postgres"
   ```

---

## 📊 マイグレーション履歴の確認

### 実行済みマイグレーションの確認:

```sql
-- Supabase Dashboard → SQL Editor

-- すべてのテーブルを確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 最近の変更を確認
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🐛 トラブルシューティング

### エラー: `.env file not found`

```bash
# backend/.envが存在するか確認
ls -la ../../backend/.env

# なければ作成
cd ../../backend
cp .env.example .env
# .envを編集して SUPABASE_URL と SUPABASE_SERVICE_KEY を設定
```

---

### エラー: `SUPABASE_SERVICE_KEY not set`

```bash
# .envの内容を確認
cat ../../backend/.env | grep SUPABASE_SERVICE_KEY

# 値が設定されていない場合
# Supabase Dashboard → Settings → API → service_role key をコピー
```

---

### エラー: `psql: command not found`

```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client

# または Node.js版を使用
node run-migration.cjs
```

---

### エラー: `Migration failed`

1. **エラーメッセージを確認**
   - マイグレーション実行時のエラー出力を読む

2. **SQLファイルの内容を確認**
   ```bash
   cat 20251101000000_add_app_testing_domain.sql
   ```

3. **データベースの現在の状態を確認**
   ```sql
   -- Supabase Dashboard → SQL Editor
   \d tasks  -- テーブル構造を確認
   ```

4. **既に実行済みか確認**
   ```sql
   -- custom_fieldsカラムが存在するか確認
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'tasks' AND column_name = 'custom_fields';
   ```

---

## 📖 参考リンク

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [TaskBridge Database Schema](../schema.sql)
- [TaskBridge API Documentation](../../claudedocs/API.md)

---

## 🔧 新しいマイグレーションの作成方法

1. **ファイル名の決定**
   ```bash
   # 現在の日時を取得
   date +"%Y%m%d%H%M%S"
   # 例: 20251102093000

   # ファイル名
   # 20251102093000_add_new_feature.sql
   ```

2. **SQLファイルを作成**
   ```sql
   -- Migration: Add new feature
   -- Created: 2025-11-02
   -- Description: Brief description of what this migration does

   -- Step 1: ...
   ALTER TABLE ...

   -- Step 2: ...
   CREATE INDEX ...

   -- Migration complete
   ```

3. **テスト環境で実行**
   ```bash
   ./run-migration.sh 20251102093000_add_new_feature.sql
   ```

4. **本番環境で実行**
   - バックアップ取得後に実行
   - ロールバックSQLも準備

---

**最終更新**: 2025-11-01
