# TaskBridge - 技術仕様書

**バージョン**: v1.0
**最終更新**: 2025-10-30
**対象読者**: 開発者、技術アーキテクト

> **言語バージョン**:
> - 🇬🇧 English: [TECHNICAL.md](./TECHNICAL.md)
> - 🇯🇵 日本語: [TECHNICAL.jp.md](./TECHNICAL.jp.md)

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [技術スタック詳細](#技術スタック詳細)
3. [データベース設計](#データベース設計)
4. [API設計](#api設計)
5. [認証・認可](#認証認可)
6. [Stripe Connect統合](#stripe-connect統合)
7. [セキュリティ設計](#セキュリティ設計)
8. [デプロイ戦略](#デプロイ戦略)
9. [開発ワークフロー](#開発ワークフロー)
10. [パフォーマンス最適化](#パフォーマンス最適化)

---

## システムアーキテクチャ

### 全体構成図

```
┌─────────────────┐
│   User Browser  │
│  (React SPA)    │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│     Vercel      │ ← フロントエンドホスティング
│  (React Build)  │
└────────┬────────┘
         │ API Calls
         ↓
┌─────────────────┐
│    Railway      │ ← バックエンドホスティング
│ (Node.js/Express)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────┐
│ Supabase│ │  Stripe  │
│ (DB+Auth)│ │(Payment) │
└─────────┘ └──────────┘
```

### レイヤー構成

#### **プレゼンテーション層(Frontend)**
- React 18 + TypeScript
- Tailwind CSS
- React Router(ページルーティング)
- React Query(サーバーステート管理)
- Zustand(クライアントステート管理)

#### **アプリケーション層(Backend)**
- Node.js 20 + Express
- TypeScript
- RESTful API
- Webhook処理(Stripe)

#### **データ層**
- Supabase PostgreSQL(リレーショナルDB)
- Supabase Auth(認証)
- Stripe Connect(決済・送金)

---

## 技術スタック詳細

### フロントエンド

#### **Core Technologies**
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "vite": "^5.0.0",
  "react-router-dom": "^6.20.0"
}
```

#### **UI/Styling**
```json
{
  "tailwindcss": "^3.4.0",
  "headlessui": "^1.7.0",
  "heroicons": "^2.1.0",
  "react-hot-toast": "^2.4.0"
}
```

#### **State Management & Data Fetching**
```json
{
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0"
}
```

#### **Form & Validation**
```json
{
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.0"
}
```

#### **API Integrations**
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@stripe/stripe-js": "^2.4.0",
  "@stripe/react-stripe-js": "^2.4.0"
}
```

---

### バックエンド

#### **Core Technologies**
```json
{
  "node": "20.x",
  "express": "^4.18.0",
  "typescript": "^5.0.0"
}
```

#### **Stripe Integration**
```json
{
  "stripe": "^14.10.0"
}
```

#### **Utilities**
```json
{
  "dotenv": "^16.3.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.0"
}
```

#### **Development**
```json
{
  "tsx": "^4.7.0",
  "nodemon": "^3.0.0",
  "eslint": "^8.56.0",
  "prettier": "^3.1.0"
}
```

---

## データベース設計

### ER図

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐
│    users    │        │    tasks    │        │ applications │
├─────────────┤        ├─────────────┤        ├──────────────┤
│ id (PK)     │────┐   │ id (PK)     │────┐   │ id (PK)      │
│ email       │    │   │ creator_id  │    │   │ task_id (FK) │
│ role        │    └──→│   (FK)      │    └──→│ worker_id(FK)│
│ full_name   │        │ title       │        │ status       │
│ avatar_url  │        │ description │        │ cover_letter │
│ stripe_id   │        │ amount      │        │ created_at   │
│ created_at  │        │ status      │        └──────────────┘
└─────────────┘        │ created_at  │
                       │ deadline    │        ┌──────────────┐
                       └─────────────┘        │ transactions │
                                              ├──────────────┤
                                              │ id (PK)      │
                                              │ task_id (FK) │
                                              │ amount       │
                                              │ stripe_id    │
                                              │ status       │
                                              │ created_at   │
                                              └──────────────┘
```

### テーブル定義

#### **users テーブル**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'worker', 'both')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  stripe_account_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧・編集可能
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

#### **tasks テーブル**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 1.00),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'approved', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  requirements JSONB,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 公開タスクは全員閲覧可能
CREATE POLICY "Published tasks are viewable by all" ON tasks
  FOR SELECT USING (status != 'draft');

-- 作成者は自分のタスクを閲覧・編集可能
CREATE POLICY "Creators can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = creator_id);
```

#### **applications テーブル**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  proposed_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, worker_id)
);

-- Indexes
CREATE INDEX idx_applications_task ON applications(task_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ワーカーは自分の応募を管理
CREATE POLICY "Workers can manage own applications" ON applications
  FOR ALL USING (auth.uid() = worker_id);

-- タスク作成者は応募を閲覧・更新可能
CREATE POLICY "Task creators can view applications" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Task creators can update applications" ON applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );
```

#### **transactions テーブル**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  worker_payout DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'captured', 'transferred', 'refunded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_transactions_task ON transactions(task_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_worker ON transactions(worker_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- クライアントとワーカーは関連取引を閲覧可能
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = worker_id
  );
```

---

## API設計

### RESTful Endpoints

#### **認証関連(Supabase Auth経由)**

```
POST   /auth/signup          # ユーザー登録
POST   /auth/login           # ログイン
POST   /auth/logout          # ログアウト
POST   /auth/reset-password  # パスワードリセット
GET    /auth/me              # 現在のユーザー情報取得
```

#### **ユーザー管理**

```
GET    /api/users/:id        # ユーザー詳細取得
PUT    /api/users/:id        # ユーザー情報更新
GET    /api/users/:id/tasks  # ユーザーのタスク一覧
GET    /api/users/:id/stats  # ユーザー統計情報
```

#### **タスク管理**

```
GET    /api/tasks            # タスク一覧取得(フィルター、ソート対応)
POST   /api/tasks            # タスク作成
GET    /api/tasks/:id        # タスク詳細取得
PUT    /api/tasks/:id        # タスク更新
DELETE /api/tasks/:id        # タスク削除
POST   /api/tasks/:id/publish # タスク公開
POST   /api/tasks/:id/cancel  # タスクキャンセル
```

#### **応募管理**

```
GET    /api/applications              # 応募一覧(自分の応募)
POST   /api/tasks/:id/applications    # タスクへの応募
GET    /api/applications/:id          # 応募詳細
PUT    /api/applications/:id          # 応募更新
DELETE /api/applications/:id          # 応募取り下げ
POST   /api/applications/:id/accept   # 応募承認(タスク作成者のみ)
POST   /api/applications/:id/reject   # 応募却下(タスク作成者のみ)
```

#### **決済関連**

```
POST   /api/stripe/onboarding         # Stripe Connectオンボーディング開始
GET    /api/stripe/account-status     # Stripe Connectアカウント状態確認
POST   /api/stripe/create-payment     # 決済作成(仮決済)
POST   /api/stripe/capture-payment    # 決済確定
POST   /api/stripe/refund             # 返金処理
POST   /api/webhooks/stripe           # Stripe Webhook受信
```

### API リクエスト・レスポンス例

#### **タスク作成**

**Request**:
```http
POST /api/tasks
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "title": "Label 1000 product images",
  "description": "Classify product images into categories...",
  "category": "data_labeling",
  "amount": 50.00,
  "deadline": "2025-11-15T23:59:59Z",
  "requirements": {
    "skills": ["basic computer"],
    "experience": "beginner"
  }
}
```

**Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "creator_id": "user-id-123",
  "title": "Label 1000 product images",
  "description": "Classify product images into categories...",
  "category": "data_labeling",
  "amount": 50.00,
  "currency": "USD",
  "status": "draft",
  "deadline": "2025-11-15T23:59:59Z",
  "created_at": "2025-10-30T10:00:00Z",
  "updated_at": "2025-10-30T10:00:00Z"
}
```

#### **タスク一覧取得(フィルター付き)**

**Request**:
```http
GET /api/tasks?category=data_labeling&min_amount=20&max_amount=100&sort=created_at&order=desc&limit=20&offset=0
Authorization: Bearer <supabase-jwt-token>
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "tasks": [
    {
      "id": "task-id-1",
      "title": "Label 1000 product images",
      "amount": 50.00,
      "status": "published",
      "creator": {
        "id": "user-id",
        "full_name": "Company Name",
        "avatar_url": "https://..."
      },
      "created_at": "2025-10-30T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## 認証・認可

### Supabase Auth統合

#### **認証フロー**

```
1. ユーザーがメール/パスワードで登録
   ↓
2. Supabaseが確認メール送信
   ↓
3. ユーザーがメール内リンクをクリック
   ↓
4. メール確認完了、ログイン可能に
   ↓
5. ログイン時にJWT発行
   ↓
6. フロントエンドがJWTをlocalStorageに保存
   ↓
7. 以降のAPI呼び出しでAuthorizationヘッダーにJWT付与
```

#### **JWT構造**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1234567890,
  "iat": 1234567890
}
```

#### **Row Level Security (RLS)**

Supabaseの強力な機能。データベースレベルでアクセス制御を実装。

**例: タスクの閲覧権限**
```sql
-- 公開済みタスクは全員閲覧可能
CREATE POLICY "Public tasks viewable" ON tasks
  FOR SELECT USING (status = 'published');

-- 下書きタスクは作成者のみ閲覧可能
CREATE POLICY "Draft tasks viewable by creator" ON tasks
  FOR SELECT USING (
    status = 'draft' AND auth.uid() = creator_id
  );
```

### 認可ロジック

#### **ロール定義**

```typescript
enum UserRole {
  CLIENT = 'client',    // タスク発注側
  WORKER = 'worker',    // タスク受注側
  BOTH = 'both'         // 両方
}
```

#### **権限マトリクス**

| アクション | CLIENT | WORKER | BOTH |
|-----------|--------|--------|------|
| タスク作成 | ✅ | ❌ | ✅ |
| タスク閲覧 | ✅ | ✅ | ✅ |
| タスク応募 | ❌ | ✅ | ✅ |
| 応募承認 | ✅(自分のタスク) | ❌ | ✅(自分のタスク) |

---

## Stripe Connect統合

### アーキテクチャ

**使用するStripe機能**:
- **Stripe Connect** (Custom Accounts)
- **Payment Intents** (決済管理)
- **Transfers** (ワーカーへの送金)
- **Webhooks** (イベント通知)

### 決済フロー詳細

#### **フェーズ1: Connectアカウント作成**

```
1. ワーカーが初回応募時に「銀行口座登録」を促される
   ↓
2. バックエンドがStripe Connect Accountを作成
   POST /api/stripe/onboarding
   ↓
3. StripeがConnect Onboarding URLを返す
   ↓
4. ワーカーがStripeのフォームで銀行口座情報入力
   ↓
5. Stripe が account.updated webhook送信
   ↓
6. TaskBridgeがworkerのstripe_account_idを保存
```

**実装例**:
```typescript
// backend/src/services/stripeConnect.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createConnectAccount(userId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'custom',
    country: 'US', // ワーカーの国に応じて変更
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  });

  // Onboarding URLの生成
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.FRONTEND_URL}/onboarding/refresh`,
    return_url: `${process.env.FRONTEND_URL}/onboarding/complete`,
    type: 'account_onboarding',
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}
```

---

#### **フェーズ2: 決済処理**

```
1. タスク投稿時に仮決済(Authorization)
   ↓
2. $120(タスク$100 + 手数料18%)をカードで仮確保
   ↓
3. ワーカーがタスク完了・提出
   ↓
4. 企業が承認 or 7日間自動承認
   ↓
5. 本決済(Capture)実行
   ↓
6. $100をワーカーのConnectアカウントに自動送金(Transfer)
   ↓
7. $18(手数料) - $6.72(Stripe手数料) = $11.28がプラットフォーム収益
```

**実装例**:
```typescript
// backend/src/services/payment.ts

// ステップ1: 仮決済(Authorization)
export async function authorizePayment(
  taskId: string,
  amount: number,
  clientStripeCustomerId: string
) {
  const totalAmount = amount * 1.18; // 手数料18%追加

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // セント単位
    currency: 'usd',
    customer: clientStripeCustomerId,
    capture_method: 'manual', // 手動確定
    metadata: {
      task_id: taskId,
    },
  });

  // DBにtransaction記録
  await supabase.from('transactions').insert({
    task_id: taskId,
    amount: totalAmount,
    stripe_payment_intent_id: paymentIntent.id,
    status: 'authorized',
  });

  return paymentIntent;
}

// ステップ2: 本決済(Capture) + Transfer
export async function captureAndTransfer(
  paymentIntentId: string,
  workerAccountId: string,
  taskAmount: number
) {
  // 決済確定
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

  // ワーカーへ送金
  const transfer = await stripe.transfers.create({
    amount: Math.round(taskAmount * 100), // $100をワーカーへ
    currency: 'usd',
    destination: workerAccountId,
    transfer_group: paymentIntent.id,
  });

  // DB更新
  await supabase
    .from('transactions')
    .update({
      status: 'transferred',
      stripe_transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  return { paymentIntent, transfer };
}
```

---

#### **フェーズ3: Webhook処理**

Stripeからのイベントを受信して処理。

**主要イベント**:
- `payment_intent.succeeded`: 決済成功
- `payment_intent.payment_failed`: 決済失敗
- `account.updated`: Connectアカウント更新
- `transfer.created`: 送金作成
- `transfer.paid`: 送金完了

**実装例**:
```typescript
// backend/src/routes/webhooks.ts
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // イベント処理
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailure(failedPayment);
      break;

    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      await handleAccountUpdate(account);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
```

---

## セキュリティ設計

### 脅威モデル

| 脅威 | 対策 |
|------|------|
| SQLインジェクション | Supabase ORMを使用(パラメータ化クエリ) |
| XSS攻撃 | ReactのデフォルトエスケープPing、DOMPurify使用 |
| CSRF攻撃 | Supabase JWT認証(Cookie不使用) |
| 認証情報漏洩 | JWT短期有効期限、Refresh Token使用 |
| 不正アクセス | Row Level Security、API Rate Limiting |
| 決済詐欺 | Stripe Radarによる不正検知 |

### セキュリティベストプラクティス

#### **1. 環境変数管理**

```bash
# .env.example (Gitにコミット)
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# .env (Gitに絶対コミットしない)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... # 機密!
STRIPE_SECRET_KEY=sk_test_xxx # 機密!
STRIPE_WEBHOOK_SECRET=whsec_xxx # 機密!
```

#### **2. API Rate Limiting**

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'Too many requests, please try again later.',
});

// 特定エンドポイントに適用
app.use('/api/', apiLimiter);
```

#### **3. Input Validation**

```typescript
// Zodを使用した厳密なバリデーション
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  amount: z.number().min(1).max(10000),
  category: z.enum(['data_labeling', 'content_moderation', 'translation', 'other']),
  deadline: z.string().datetime().optional(),
});

// リクエストバリデーション
app.post('/api/tasks', async (req, res) => {
  try {
    const validated = taskSchema.parse(req.body);
    // 処理続行
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input', details: error.errors });
  }
});
```

---

## デプロイ戦略

### 環境構成

| 環境 | 用途 | ブランチ | URL |
|------|------|---------|-----|
| **Development** | ローカル開発 | - | localhost |
| **Staging** | テスト環境 | `develop` | staging.taskbridge.com |
| **Production** | 本番環境 | `main` | taskbridge.com |

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 開発ワークフロー

### ブランチ戦略(Git Flow簡易版)

```
main (本番)
  ↑
develop (開発統合)
  ↑
feature/task-posting (機能開発)
feature/stripe-integration
...
```

### コミットメッセージ規約

```
<type>(<scope>): <subject>

Types:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント変更
- style: フォーマット(コード動作に影響なし)
- refactor: リファクタリング
- test: テスト追加・修正
- chore: ビルド・補助ツール変更

例:
feat(tasks): Add task posting form
fix(auth): Resolve login redirect issue
docs(readme): Update installation instructions
```

### Pull Requestプロセス

```
1. feature/* ブランチで開発
   ↓
2. コミット、テスト実行
   ↓
3. Pull Request作成 → develop
   ↓
4. コードレビュー(相手開発者)
   ↓
5. 承認後、merge
   ↓
6. develop → staging自動デプロイ
   ↓
7. ステージングでテスト
   ↓
8. develop → main PR作成
   ↓
9. 本番デプロイ
```

---

## パフォーマンス最適化

### フロントエンド

#### **1. Code Splitting**
```typescript
// React.lazy()でルートごとに分割
const TaskList = React.lazy(() => import('./pages/TaskList'));
const TaskDetail = React.lazy(() => import('./pages/TaskDetail'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/tasks" element={<TaskList />} />
    <Route path="/tasks/:id" element={<TaskDetail />} />
  </Routes>
</Suspense>
```

#### **2. 画像最適化**
- WebP形式使用
- Lazy Loading(react-lazyload)
- CDN経由配信(Vercel自動対応)

#### **3. キャッシュ戦略**
```typescript
// React Queryでサーバーステートキャッシュ
const { data: tasks } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => fetchTasks(filters),
  staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  cacheTime: 10 * 60 * 1000, // 10分間保持
});
```

---

### バックエンド

#### **1. データベースクエリ最適化**
- 適切なインデックス作成
- N+1問題の回避(JOIN使用)
- ページネーション実装

#### **2. API レスポンスキャッシュ**
```typescript
// Redis等でAPIレスポンスをキャッシュ(将来的に)
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10分

app.get('/api/tasks', async (req, res) => {
  const cacheKey = JSON.stringify(req.query);
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const tasks = await fetchTasks(req.query);
  cache.set(cacheKey, tasks);
  res.json(tasks);
});
```

---

## モニタリング・ログ

### エラートラッキング

```typescript
// Sentry統合(オプション、Month 6以降)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### ログ管理

```typescript
// Winston等のロガー使用
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 使用例
logger.info('User logged in', { userId: 'xxx' });
logger.error('Payment failed', { error: err.message, taskId: 'xxx' });
```

---

## トラブルシューティング

### よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| Supabase接続エラー | 環境変数未設定 | `.env`ファイル確認 |
| Stripe webhook失敗 | Webhook secret不一致 | Stripeダッシュボードで再取得 |
| CORS エラー | バックエンド設定不足 | Express cors設定を確認 |
| 認証エラー | JWT期限切れ | Refresh token実装 |
| 決済失敗 | テストカード使用 | Stripeテストカードを使用 |

---

## 次のステップ

### Week 1の技術タスク

**ガーナ側(開発担当)**:
1. [ ] Supabaseプロジェクト作成、DB設計実装
2. [ ] React + TypeScript + Tailwind環境構築
3. [ ] Supabase Auth統合、認証フロー実装
4. [ ] Stripeテストモードで決済フロー検証

**参考リソース**:
- Supabase Docs: https://supabase.com/docs
- Stripe Connect Guide: https://stripe.com/docs/connect
- React Query: https://tanstack.com/query

---

**更新履歴**:
- 2025-10-30: v1.0 初版作成
