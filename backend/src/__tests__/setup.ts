/**
 * Jest テストセットアップファイル
 */

// 環境変数のモック設定
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PORT = '3001'

// タイムアウト設定
jest.setTimeout(10000)

// グローバルモック設定
beforeAll(() => {
  // 必要に応じてグローバルモックを設定
})

afterAll(() => {
  // テスト後のクリーンアップ
})

beforeEach(() => {
  // 各テストの前にモックをクリア
  jest.clearAllMocks()
})

afterEach(() => {
  // 各テストの後のクリーンアップ
})
