import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const useLocalMode = import.meta.env.VITE_USE_LOCAL_MODE === 'true'

let supabase: SupabaseClient<Database>

if (useLocalMode) {
  // ローカル開発モード: ダミーのSupabaseクライアントを作成
  // 認証はバックエンドAPIを通じて行う
  console.log('🔧 Running in local mode (Supabase disabled)')
  const dummyUrl = 'http://localhost:54321'
  const dummyKey = 'dummy-key-for-local-development'
  supabase = createClient<Database>(dummyUrl, dummyKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
} else {
  // 本番モード: Supabaseを使用
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    )
  }
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase, useLocalMode }
