import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import tasksRoutes from './routes/tasks.js'
import applicationsRoutes from './routes/applications.js'
import workersRoutes from './routes/workers.js'
import reportsRoutes from './routes/reports.js'
import annotationsRoutes from './routes/annotations.js'
import { validateEnvironment } from './utils/validateEnv.js'
import { errorHandler } from './middleware/errorHandler.js'
import { swaggerSpec } from './config/swagger.js'
import { testConnection as testDbConnection } from './lib/database.js'

// 環境変数の読み込み
dotenv.config()

// 環境変数のバリデーション（サーバー起動前に実行）
const envConfig = validateEnvironment()

const app = express()
const PORT = envConfig.PORT

// ミドルウェア
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ヘルスチェック
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = envConfig.USE_LOCAL_DB ? await testDbConnection() : true
  res.json({
    status: dbStatus ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: envConfig.USE_LOCAL_DB ? (dbStatus ? 'connected' : 'disconnected') : 'supabase',
  })
})

// ルートエンドポイント
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'LinguaBridge API',
    version: '0.1.0',
    documentation: '/api/docs',
  })
})

// Swagger API ドキュメント
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LinguaBridge API Documentation',
}))

// APIルート
app.use('/api/tasks', tasksRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/workers', workersRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/annotations', annotationsRoutes)

// 404ハンドラー
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  })
})

// エラーハンドラー（すべてのルートの後に配置）
app.use(errorHandler)

// サーバー起動
async function startServer() {
  // ローカルDBモードの場合は接続テスト
  if (envConfig.USE_LOCAL_DB) {
    const connected = await testDbConnection()
    if (!connected) {
      console.error('❌ Failed to connect to database. Server starting anyway...')
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    if (envConfig.USE_LOCAL_DB) {
      console.log(`🗄️  Database: Local PostgreSQL`)
    }
  })
}

startServer()
