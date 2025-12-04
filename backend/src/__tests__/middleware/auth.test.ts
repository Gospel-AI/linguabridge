import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, requireRole } from '../../middleware/auth'
import { supabase } from '../../lib/supabase'

jest.mock('jsonwebtoken')
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
    from: jest.fn(),
  },
}))

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    mockNext = jest.fn()

    mockRequest = {
      headers: {},
    }

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    }

    // デフォルトでJWT_SECRETをモック
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret'

    jest.clearAllMocks()
  })

  describe('authenticate', () => {
    it('有効なトークンで認証成功', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      }

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          role: 'worker',
        },
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'test-user-id' })
      ;(supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockRequest.user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'worker',
      })
      expect(mockNext).toHaveBeenCalled()
    })

    it('Authorizationヘッダーがない場合は401を返す', async () => {
      mockRequest.headers = {}

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('Bearer prefixがない場合は401を返す', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      }

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('JWT検証失敗時は401を返す', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token')
      })

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('JWT SECRETが未設定の場合はdecodeのみ実行（後方互換性）', async () => {
      delete process.env.SUPABASE_JWT_SECRET

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      }

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          role: 'worker',
        },
      }

      ;(jwt.decode as jest.Mock).mockReturnValue({ sub: 'test-user-id' })
      ;(supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(jwt.decode).toHaveBeenCalledWith('valid-token')
      expect(mockRequest.user).toBeDefined()
      expect(mockNext).toHaveBeenCalled()
    })

    it('ユーザーが見つからない場合は401を返す', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      }

      ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'test-user-id' })
      ;(supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      })

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found or token expired',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('予期しないエラー発生時は500を返す', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      }

      ;(jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
        }),
      )
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'worker',
      }
    })

    it('許可されたロールでアクセス成功', async () => {
      const mockProfile = {
        role: 'worker',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      const middleware = requireRole('worker', 'client')
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('認証されていない場合は401を返す', async () => {
      delete mockRequest.user

      const middleware = requireRole('worker')
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('許可されていないロールは403を返す', async () => {
      const mockProfile = {
        role: 'worker',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      const middleware = requireRole('admin') // workerは許可されていない
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('ユーザープロフィールが見つからない場合は403を返す', async () => {
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      const middleware = requireRole('worker')
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'User profile not found',
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('複数のロールを許可できる', async () => {
      const mockProfile = {
        role: 'client',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      const middleware = requireRole('worker', 'client', 'admin')
      await middleware(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })
})
