import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 環境変数を読み込む
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const useLocalDb = process.env.USE_LOCAL_DB === 'true'

// ローカルDBモードの場合はダミークライアントを作成
let supabase: SupabaseClient
let supabaseAuth: SupabaseClient

if (useLocalDb) {
  console.log('🔧 Using local database mode (Supabase disabled)')
  // ローカルモード用のダミークライアント
  // 実際のDB操作はPostgreSQL直接接続で行う
  const dummyUrl = 'http://localhost:54321'
  const dummyKey = 'dummy-key-for-local-development'
  supabase = createClient(dummyUrl, dummyKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  supabaseAuth = supabase
} else {
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.',
    )
  }

  // Backend uses service key for full access (bypasses RLS)
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Auth client uses anon key for token verification
  supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export { supabase, supabaseAuth, useLocalDb }
