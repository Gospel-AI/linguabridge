import { Request, Response } from 'express'
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../../controllers/tasks'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('Tasks Controller', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock
  let sendMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    sendMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock, send: sendMock }))

    mockRequest = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'client',
      },
    }

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
    }

    jest.clearAllMocks()
  })

  describe('listTasks', () => {
    it('タスク一覧取得成功', async () => {
      mockRequest.query = {
        status: 'published',
        limit: '20',
        offset: '0',
      }

      const mockTasks = [
        {
          id: 'task-1',
          title: 'Translation Task',
          category: 'translation',
          status: 'published',
          creator: {
            id: 'creator-id',
            full_name: 'Creator Name',
          },
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
        count: 1,
      })

      const queryChain: any = {
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
        then: (resolve: any) => resolve({ data: mockTasks, error: null, count: 1 }),
      }

      selectMock.mockReturnValue(queryChain)
      eqMock.mockReturnValue(queryChain)
      orderMock.mockReturnValue(queryChain)
      rangeMock.mockReturnValue(queryChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => queryChain)

      await listTasks(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockTasks,
        meta: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
    })

    it('カテゴリフィルタ付きでタスク一覧取得', async () => {
      mockRequest.query = {
        status: 'published',
        category: 'translation',
        limit: '20',
        offset: '0',
      }

      const mockTasks = [
        {
          id: 'task-1',
          category: 'translation',
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
        count: 1,
      })

      const queryChain: any = {
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
        then: (resolve: any) => resolve({ data: mockTasks, error: null, count: 1 }),
      }

      selectMock.mockReturnValue(queryChain)
      eqMock.mockReturnValue(queryChain)
      orderMock.mockReturnValue(queryChain)
      rangeMock.mockReturnValue(queryChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => queryChain)

      await listTasks(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockTasks,
        meta: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
    })

    it('エラー発生時は例外を投げる', async () => {
      mockRequest.query = {
        limit: '20',
        offset: '0',
      }

      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockReturnThis()

      const queryChain: any = {
        select: selectMock,
        eq: jest.fn().mockReturnThis(),
        order: orderMock,
        range: rangeMock,
        then: (resolve: any) => resolve({ data: null, error: new Error('Database error'), count: null }),
      }

      queryChain.eq.mockReturnValue(queryChain)
      selectMock.mockReturnValue(queryChain)
      orderMock.mockReturnValue(queryChain)
      rangeMock.mockReturnValue(queryChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => queryChain)

      await expect(
        listTasks(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Failed to fetch tasks')
    })
  })

  describe('getTask', () => {
    it('タスク詳細取得成功', async () => {
      mockRequest.params = { id: 'task-id' }

      const mockTask = {
        id: 'task-id',
        title: 'Test Task',
        description: 'Test Description',
        category: 'translation',
        amount: 50,
        status: 'published',
        creator: {
          id: 'creator-id',
          full_name: 'Creator Name',
        },
        applications: [],
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockTask,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await getTask(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      })
    })

    it('タスクが見つからない場合は例外を投げる', async () => {
      mockRequest.params = { id: 'non-existent-id' }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        getTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Task not found')
    })
  })

  describe('createTask', () => {
    it('タスク作成成功', async () => {
      mockRequest.body = {
        title: 'New Translation Task',
        description: 'Please translate this document',
        category: 'translation',
        amount: 100,
        currency: 'USD',
      }

      const mockCreatedTask = {
        id: 'new-task-id',
        ...mockRequest.body,
        creator_id: 'test-user-id',
        status: 'published',
      }

      const insertMock = jest.fn().mockReturnThis()
      const selectMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockCreatedTask,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      }))

      await createTask(mockRequest as Request, mockResponse as Response)

      expect(statusMock).toHaveBeenCalledWith(201)
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedTask,
      })
    })

    it('バリデーションエラー時は例外を投げる', async () => {
      mockRequest.body = {
        title: 'Short', // too short (min 5 chars)
        description: 'Test',
        category: 'invalid_category',
        amount: -10, // negative
      }

      await expect(
        createTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow()
    })

    it('データベースエラー時は例外を投げる', async () => {
      mockRequest.body = {
        title: 'New Translation Task',
        description: 'Please translate this document',
        category: 'translation',
        amount: 100,
        currency: 'USD',
      }

      const insertMock = jest.fn().mockReturnThis()
      const selectMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      }))

      await expect(
        createTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Failed to create task')
    })
  })

  describe('updateTask', () => {
    it('タスク更新成功', async () => {
      mockRequest.params = { id: 'task-id' }
      mockRequest.body = {
        title: 'Updated Title',
        description: 'Updated Description',
      }

      const mockExistingTask = {
        creator_id: 'test-user-id',
      }

      const mockUpdatedTask = {
        id: 'task-id',
        title: 'Updated Title',
        description: 'Updated Description',
        creator_id: 'test-user-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const updateMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockExistingTask, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedTask, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        update: updateMock,
        single: singleMock,
      }))

      await updateTask(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedTask,
      })
    })

    it('タスクが見つからない場合は例外を投げる', async () => {
      mockRequest.params = { id: 'non-existent-id' }
      mockRequest.body = {
        title: 'Updated Title',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        updateTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Task not found')
    })

    it('自分のタスク以外は更新できない', async () => {
      mockRequest.params = { id: 'task-id' }
      mockRequest.body = {
        title: 'Updated Title',
      }

      const mockExistingTask = {
        creator_id: 'different-user-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockExistingTask,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        updateTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('You can only update your own tasks')
    })
  })

  describe('deleteTask', () => {
    it('タスク削除成功', async () => {
      mockRequest.params = { id: 'task-id' }

      const mockExistingTask = {
        creator_id: 'test-user-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const deleteMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockExistingTask,
        error: null,
      })

      const deleteChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      deleteMock.mockReturnValue(deleteChain)

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        delete: deleteMock,
        single: singleMock,
      }))

      await deleteTask(mockRequest as Request, mockResponse as Response)

      expect(statusMock).toHaveBeenCalledWith(204)
      expect(sendMock).toHaveBeenCalled()
    })

    it('タスクが見つからない場合は例外を投げる', async () => {
      mockRequest.params = { id: 'non-existent-id' }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        deleteTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Task not found')
    })

    it('自分のタスク以外は削除できない', async () => {
      mockRequest.params = { id: 'task-id' }

      const mockExistingTask = {
        creator_id: 'different-user-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: mockExistingTask,
        error: null,
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        deleteTask(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('You can only delete your own tasks')
    })
  })
})
