import { Request, Response } from 'express'
import {
  getMyProfile,
  updateMyProfile,
  getWorkerProfile,
  listWorkers,
} from '../../controllers/workers'
import { supabase } from '../../lib/supabase'

// Supabaseクライアントのモック
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
    },
  },
}))

describe('Workers Controller', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))

    mockRequest = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'worker',
      },
    }

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    }

    jest.clearAllMocks()
  })

  describe('getMyProfile', () => {
    it('ユーザープロフィール取得成功（workerレコード存在）', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
      }

      const mockWorker = {
        id: 'worker-id',
        user_id: 'test-user-id',
        tier: 1,
        average_rating: 4.5,
        total_completed_tasks: 10,
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockWorker, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await getMyProfile(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockUser,
          worker: mockWorker,
        },
      })
    })

    it('workerレコードがない場合は自動作成', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
      }

      const mockNewWorker = {
        id: 'new-worker-id',
        user_id: 'test-user-id',
        tier: 1,
        average_rating: 0,
        total_completed_tasks: 0,
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const insertMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockNewWorker, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
        insert: insertMock,
      }))

      await getMyProfile(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockUser,
          worker: mockNewWorker,
        },
      })
    })

    it('エラー発生時は例外を投げる', async () => {
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: null, error: new Error('Database error') })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        getMyProfile(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Failed to fetch user profile')
    })
  })

  describe('updateMyProfile', () => {
    it('プロフィール更新成功', async () => {
      mockRequest.body = {
        profile: {
          full_name: 'Updated Name',
          bio: 'Updated bio',
        },
        worker: {
          language_pairs: [{ source: 'en', target: 'ja' }],
          specialized_domains: ['translation'],
        },
      }

      const mockUpdatedUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Updated Name',
        bio: 'Updated bio',
      }

      const mockUpdatedWorker = {
        id: 'worker-id',
        user_id: 'test-user-id',
        language_pairs: [{ source: 'en', target: 'ja' }],
        specialized_domains: ['translation'],
      }

      const updateMock = jest.fn().mockResolvedValue({ data: null, error: null })
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null })
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: { id: 'worker-id' }, error: null }) // check worker exists
        .mockResolvedValueOnce({ data: mockUpdatedUser, error: null }) // get updated user
        .mockResolvedValueOnce({ data: mockUpdatedWorker, error: null }) // get updated worker

      const updateChain = {
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
      updateMock.mockReturnValue(updateChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        update: updateMock,
        insert: insertMock,
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await updateMyProfile(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockUpdatedUser,
          worker: mockUpdatedWorker,
        },
      })
    })

    it('バリデーションエラー時は例外を投げる', async () => {
      mockRequest.body = {
        profile: {
          full_name: '', // too short
        },
      }

      await expect(
        updateMyProfile(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow()
    })
  })

  describe('getWorkerProfile', () => {
    it('公開プロフィール取得成功', async () => {
      mockRequest.params = { id: 'worker-user-id' }

      const mockUser = {
        id: 'worker-user-id',
        email: 'worker@example.com',
        full_name: 'Worker Name',
        avatar_url: null,
        created_at: '2024-01-01',
      }

      const mockWorker = {
        tier: 2,
        average_rating: 4.8,
        total_completed_tasks: 50,
        language_pairs: [],
        specialized_domains: ['translation'],
        certifications: [],
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockWorker, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await getWorkerProfile(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockUser,
          worker: mockWorker,
        },
      })
    })

    it('ワーカーが見つからない場合は例外を投げる', async () => {
      mockRequest.params = { id: 'non-existent-id' }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        getWorkerProfile(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Worker not found')
    })
  })

  describe('listWorkers', () => {
    it('ワーカー一覧取得成功', async () => {
      mockRequest.query = {
        limit: '10',
        offset: '0',
      }

      const mockWorkers = [
        {
          id: 'worker-1',
          user_id: 'user-1',
          tier: 2,
          average_rating: 4.8,
          user: {
            id: 'user-1',
            email: 'worker1@example.com',
            full_name: 'Worker 1',
          },
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockWorkers,
        error: null,
        count: 1,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        order: orderMock,
        range: rangeMock,
      }))

      await listWorkers(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockWorkers,
        meta: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      })
    })

    it('フィルタ条件付きでワーカー一覧取得', async () => {
      mockRequest.query = {
        domain: 'translation',
        tier: '2',
        minRating: '4.5',
        limit: '20',
        offset: '0',
      }

      const mockWorkers = [
        {
          id: 'worker-1',
          specialized_domains: ['translation'],
          tier: 2,
          average_rating: 4.8,
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const gteMock = jest.fn().mockReturnThis()
      const containsMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockWorkers,
        error: null,
        count: 1,
      })

      const queryChain: any = {
        select: selectMock,
        order: orderMock,
        eq: eqMock,
        gte: gteMock,
        contains: containsMock,
        range: rangeMock,
        then: (resolve: any) => resolve({ data: mockWorkers, error: null, count: 1 }),
      }

      selectMock.mockReturnValue(queryChain)
      eqMock.mockReturnValue(queryChain)
      gteMock.mockReturnValue(queryChain)
      containsMock.mockReturnValue(queryChain)
      orderMock.mockReturnValue(queryChain)
      rangeMock.mockReturnValue(queryChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => queryChain)

      await listWorkers(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockWorkers,
        meta: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
    })
  })
})
