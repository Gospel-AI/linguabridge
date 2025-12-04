# Supabase Setup Guide

Complete guide for setting up Supabase for TaskBridge project.

## Prerequisites

- Supabase account (sign up at https://supabase.com)
- Basic understanding of PostgreSQL

## Step 1: Create Supabase Project

1. Navigate to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `taskbridge` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`, `eu-west-1`)
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning

## Step 2: Execute Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** to execute
6. Verify success: You should see "Success. No rows returned"

**Verify Tables Created:**
- Go to **Table Editor** (left sidebar)
- You should see: `users`, `tasks`, `applications`, `transactions`

## Step 3: Configure Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Enable **Email** provider:
   - Toggle "Enable Email provider" to ON
   - Enable "Confirm email" (recommended for production)
   - Set "Minimum password length" to 8
3. Click **"Save"**

**Email Templates (Optional but Recommended):**
- Go to **Authentication** → **Email Templates**
- Customize confirmation and password reset emails with TaskBridge branding

## Step 4: Get API Keys

1. Go to **Project Settings** → **API** (left sidebar)
2. Copy the following values:

**For Frontend (.env):**
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Backend (.env):**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Warning**:
- `SUPABASE_ANON_KEY` is safe to expose in frontend
- `SUPABASE_SERVICE_KEY` must remain secret (backend only)
- Never commit these to Git!

## Step 5: Update Environment Variables

### Frontend Environment Variables
Edit `/frontend/.env`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe (will configure later)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

### Backend Environment Variables
Edit `/backend/.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# Stripe (will configure later)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Step 6: Test Connection

### Test from Frontend

Create `frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Test from Backend

Create `backend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

### Run Connection Test

```bash
# Frontend test (in browser console after starting dev server)
cd frontend
npm run dev
# Open http://localhost:5173
# Open browser console and run:
# import { supabase } from './src/lib/supabase'
# const { data } = await supabase.from('users').select('count')
# console.log(data) // Should return { count: 0 }

# Backend test
cd backend
npm run dev
# Server should start without Supabase connection errors
```

## Step 7: Verify RLS (Row Level Security)

1. Go to **Authentication** → **Policies** in Supabase dashboard
2. For each table (`users`, `tasks`, `applications`, `transactions`):
   - Click on the table name
   - Verify that RLS is **enabled** (should show green checkmark)
   - Verify policies are listed

**Expected Policies:**
- **users**: 2 policies (view own, update own)
- **tasks**: 2 policies (view published, manage own)
- **applications**: 3 policies (manage own, creators view, creators update)
- **transactions**: 1 policy (view own)

## Troubleshooting

### Issue: "relation does not exist" error
**Solution**: Re-run the schema.sql file. Ensure all tables are created.

### Issue: "JWT expired" or authentication errors
**Solution**:
1. Check that `SUPABASE_URL` and keys are correct
2. Verify no extra spaces in .env file
3. Restart development servers

### Issue: "Row Level Security" blocking queries
**Solution**:
1. Verify RLS policies are created (Step 7)
2. Ensure user is authenticated when testing
3. For development, you can temporarily disable RLS:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
   ⚠️ Re-enable before production!

### Issue: Cannot connect from backend
**Solution**:
1. Use `SUPABASE_SERVICE_KEY`, not `ANON_KEY`
2. Service key bypasses RLS and has full access

## Next Steps

After Supabase setup is complete:

1. ✅ Test user registration and login
2. ✅ Create sample data for development
3. ✅ Set up Stripe Connect integration
4. ✅ Implement authentication flows in frontend
5. ✅ Build API endpoints in backend

## Useful Supabase Commands

```typescript
// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()

// Insert data (respects RLS)
const { data, error } = await supabase
  .from('tasks')
  .insert({ title: 'Test Task', description: 'Description', amount: 10.00 })

// Query data (respects RLS)
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('status', 'published')
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
