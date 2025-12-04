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
import { validateEnvironment } from './utils/validateEnv.js'
import { errorHandler } from './middleware/errorHandler.js'
import { swaggerSpec } from './config/swagger.js'

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
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ルートエンドポイント
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'TaskBridge API',
    version: '0.1.0',
    documentation: '/api/docs',
  })
})

// Swagger API ドキュメント
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TaskBridge API Documentation',
}))

// APIルート
app.use('/api/tasks', tasksRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/workers', workersRoutes)
app.use('/api/reports', reportsRoutes)

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})
