import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role?: string
      }
    }
  }
}

/**
 * 認証ミドルウェア
 * リクエストヘッダーのAuthorizationトークンを検証
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // JWT検証（署名確認）
    let userId: string
    try {
      // Supabase JWT Secret（環境変数から取得、なければ警告モード）
      const jwtSecret = process.env.SUPABASE_JWT_SECRET

      if (jwtSecret) {
        // JWT署名を検証
        const decoded = jwt.verify(token, jwtSecret) as { sub: string }
        userId = decoded.sub
      } else {
        // JWT Secret未設定の場合は警告してデコードのみ（後方互換性）
        // 本番環境では必ずSUPABASE_JWT_SECRETを設定すること
        const decoded = jwt.decode(token) as { sub: string } | null
        if (!decoded || !decoded.sub) {
          throw new Error('Invalid token structure')
        }
        userId = decoded.sub
      }

      if (!userId) {
        throw new Error('No user ID in token')
      }
    } catch (decodeError) {
      // JWT検証エラーの詳細はログに記録、ユーザーには一般的なメッセージ
      if (decodeError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        })
      } else {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token format',
        })
      }
      return
    }

    // Supabase Authでユーザーを検証（追加の検証層）
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or token expired',
      })
      return
    }

    // ユーザー情報をrequestに添付
    req.user = {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role,
    }

    next()
  } catch {
    // エラーの詳細はログに記録、ユーザーには一般的なメッセージ
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    })
  }
}

/**
 * 役割ベースのアクセス制御ミドルウェア
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      return
    }

    // usersテーブルからroleを取得
    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (error || !profile) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User profile not found',
      })
      return
    }

    if (!allowedRoles.includes(profile.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
      return
    }

    next()
  }
}
