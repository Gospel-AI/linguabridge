/**
 * 環境変数のバリデーション
 * サーバー起動時に必須の環境変数が設定されているか確認
 */

interface EnvConfig {
  // Server
  NODE_ENV: string
  PORT: string

  // Database
  USE_LOCAL_DB: boolean
  DATABASE_URL?: string

  // Supabase (optional in local mode)
  SUPABASE_URL?: string
  SUPABASE_SERVICE_KEY?: string
  SUPABASE_JWT_SECRET?: string

  // Stripe
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string

  // CORS
  CORS_ORIGIN?: string
}

export function validateEnvironment(): EnvConfig {
  const errors: string[] = []
  const warnings: string[] = []

  const useLocalDb = process.env.USE_LOCAL_DB === 'true'

  // ローカルDBモード以外の場合はSupabase環境変数が必須
  if (!useLocalDb) {
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'STRIPE_SECRET_KEY']
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    }
  } else {
    // ローカルDBモードではDATABASE_URLが推奨
    if (!process.env.DATABASE_URL) {
      console.log('ℹ️  DATABASE_URL not set, using default: postgresql://postgres:postgres@db:5432/linguabridge')
    }
  }

  // 推奨環境変数のチェック
  const recommendedVars = ['SUPABASE_JWT_SECRET', 'STRIPE_WEBHOOK_SECRET']
  for (const varName of recommendedVars) {
    if (!process.env[varName] && !useLocalDb) {
      warnings.push(`Missing recommended environment variable: ${varName}`)
    }
  }

  // エラーがあればプロセスを終了
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach(error => console.error(`   ${error}`))
    console.error('\n💡 Please check your .env file and ensure all required variables are set.')
    console.error('   See .env.example for reference.\n')
    process.exit(1)
  }

  // 警告を表示
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:')
    warnings.forEach(warning => console.warn(`   ${warning}`))
    console.warn('   These variables are recommended for production.\n')
  }

  const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',
    USE_LOCAL_DB: useLocalDb,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  }

  // 開発環境では設定を表示
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment validation passed')
    console.log(`   Environment: ${config.NODE_ENV}`)
    console.log(`   Port: ${config.PORT}`)
    if (useLocalDb) {
      console.log(`   Database: Local PostgreSQL`)
      console.log(`   DATABASE_URL: ${config.DATABASE_URL || 'default'}`)
    } else {
      console.log(`   Supabase: ${config.SUPABASE_URL}`)
    }
    console.log(`   CORS Origin: ${config.CORS_ORIGIN || 'http://localhost:5173'}\n`)
  }

  return config
}
