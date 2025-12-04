/**
 * 環境変数のバリデーション
 * サーバー起動時に必須の環境変数が設定されているか確認
 */

interface EnvConfig {
  // Server
  NODE_ENV: string
  PORT: string

  // Supabase
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  SUPABASE_JWT_SECRET?: string // Optional but recommended

  // Stripe
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET?: string // Optional

  // CORS
  CORS_ORIGIN?: string
}

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY',
]

const RECOMMENDED_ENV_VARS = [
  'SUPABASE_JWT_SECRET', // For JWT signature verification
  'STRIPE_WEBHOOK_SECRET', // For Stripe webhook validation
]

export function validateEnvironment(): EnvConfig {
  const errors: string[] = []
  const warnings: string[] = []

  // 必須環境変数のチェック
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  // 推奨環境変数のチェック
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
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

  // 環境変数の妥当性チェック
  const supabaseUrl = process.env.SUPABASE_URL!
  if (!supabaseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
    errors.push('SUPABASE_URL must use HTTPS in production')
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.warn('⚠️  SUPABASE_JWT_SECRET is not set.')
    console.warn('   JWT signature verification will be skipped.')
    console.warn('   This is NOT recommended for production!\n')
  }

  const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  }

  // 開発環境では設定を表示
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment validation passed')
    console.log(`   Environment: ${config.NODE_ENV}`)
    console.log(`   Port: ${config.PORT}`)
    console.log(`   Supabase: ${config.SUPABASE_URL}`)
    console.log(`   CORS Origin: ${config.CORS_ORIGIN || 'Not set (allowing all)'}\n`)
  }

  return config
}
