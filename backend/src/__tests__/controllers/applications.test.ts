import { Request, Response } from 'express'
import {
  createApplication,
  listMyApplications,
  getApplication,
  updateApplicationStatus,
  listTaskApplications,
  batchGetTaskApplications,
} from '../../controllers/applications'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

describe('Applications Controller', () => {
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
        role: 'worker',
      },
    }

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      send: sendMock,
    }

    jest.clearAllMocks()
  })

  describe('createApplication', () => {
    it('タスク応募成功', async () => {
      mockRequest.body = {
        task_id: '123e4567-e89b-12d3-a456-426614174000',
        submission_text: 'This is my application cover letter with enough characters.',
        metadata: { experience: '5 years' },
      }

      const mockTask = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        creator_id: 'different-user-id',
        status: 'published',
      }

      const mockWorker = {
        id: 'worker-id',
      }

      const mockApplication = {
        id: 'app-id',
        task_id: '123e4567-e89b-12d3-a456-426614174000',
        worker_id: 'worker-id',
        status: 'submitted',
        task: { id: '123e4567-e89b-12d3-a456-426614174000', title: 'Test Task' },
        worker: { id: 'worker-id', user: { full_name: 'Test Worker' } },
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const insertMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockTask, error: null })
        .mockResolvedValueOnce({ data: mockWorker, error: null })
        .mockResolvedValueOnce({ data: null, error: null }) // existing check
        .mockResolvedValueOnce({ data: mockApplication, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
        insert: insertMock,
      }))

      await createApplication(mockRequest as Request, mockResponse as Response)

      expect(statusMock).toHaveBeenCalledWith(201)
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApplication,
      })
    })

    it('タスクが見つからない場合は例外を投げる', async () => {
      mockRequest.body = {
        task_id: '123e4567-e89b-12d3-a456-426614174999',
        submission_text: 'Application text with enough characters for validation.',
      }

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
        createApplication(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Task not found')
    })

    it('自分のタスクには応募できない', async () => {
      mockRequest.body = {
        task_id: '123e4567-e89b-12d3-a456-426614174001',
        submission_text: 'Application text with enough characters for validation.',
      }

      const mockTask = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        creator_id: 'test-user-id', // same as request user
        status: 'published',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: mockTask, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        createApplication(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Cannot apply to your own task')
    })

    it('既に応募済みの場合はエラー', async () => {
      mockRequest.body = {
        task_id: '123e4567-e89b-12d3-a456-426614174002',
        submission_text: 'Application text with enough characters for validation.',
      }

      const mockTask = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        creator_id: 'different-user-id',
        status: 'published',
      }

      const mockWorker = {
        id: 'worker-id',
      }

      const mockExisting = {
        id: 'existing-app-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockTask, error: null })
        .mockResolvedValueOnce({ data: mockWorker, error: null })
        .mockResolvedValueOnce({ data: mockExisting, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        createApplication(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('You have already applied to this task')
    })
  })

  describe('listMyApplications', () => {
    it('自分の応募一覧取得成功', async () => {
      mockRequest.query = {
        limit: '20',
        offset: '0',
      }

      const mockWorker = {
        id: 'worker-id',
      }

      const mockApplications = [
        {
          id: 'app-1',
          task_id: 'task-1',
          status: 'submitted',
          task: { id: 'task-1', title: 'Task 1' },
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockApplications,
        error: null,
        count: 1,
      })
      const singleMock = jest.fn()
        .mockResolvedValue({ data: mockWorker, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
        single: singleMock,
      }))

      await listMyApplications(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApplications,
        meta: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
    })

    it('workerプロフィールがない場合は空配列を返す', async () => {
      mockRequest.query = {
        limit: '20',
        offset: '0',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: null, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await listMyApplications(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      })
    })
  })

  describe('getApplication', () => {
    it('応募詳細取得成功（応募者本人）', async () => {
      mockRequest.params = { id: 'app-id' }

      const mockWorker = {
        id: 'worker-id',
      }

      const mockApplication = {
        id: 'app-id',
        worker_id: 'worker-id',
        task: {
          id: 'task-id',
          creator_id: 'creator-id',
        },
        worker: {
          id: 'worker-id',
          user: { full_name: 'Test Worker' },
        },
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockApplication, error: null })
        .mockResolvedValueOnce({ data: mockWorker, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await getApplication(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApplication,
      })
    })

    it('応募が見つからない場合は例外を投げる', async () => {
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
        getApplication(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Application not found')
    })
  })

  describe('updateApplicationStatus', () => {
    it('応募ステータス更新成功（タスク作成者）', async () => {
      mockRequest.params = { id: 'app-id' }
      mockRequest.body = {
        status: 'approved',
        client_feedback: 'Great application!',
      }

      const mockApplication = {
        id: 'app-id',
        task: {
          id: 'task-id',
          creator_id: 'test-user-id', // same as request user
        },
        worker: {
          id: 'worker-id',
          user_id: 'worker-user-id',
        },
      }

      const mockUpdated = {
        id: 'app-id',
        status: 'approved',
        client_feedback: 'Great application!',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const updateMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({ data: mockApplication, error: null })
        .mockResolvedValueOnce({ data: mockUpdated, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        update: updateMock,
        single: singleMock,
      }))

      await updateApplicationStatus(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUpdated,
      })
    })

    it('タスク作成者以外は更新できない', async () => {
      mockRequest.params = { id: 'app-id' }
      mockRequest.body = {
        status: 'approved',
      }

      const mockApplication = {
        id: 'app-id',
        task: {
          id: 'task-id',
          creator_id: 'different-user-id', // different from request user
        },
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: mockApplication, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        updateApplicationStatus(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Only task creator can update application status')
    })
  })

  describe('listTaskApplications', () => {
    it('タスクの応募一覧取得成功', async () => {
      mockRequest.params = { taskId: 'task-id' }
      mockRequest.query = {
        limit: '50',
        offset: '0',
      }

      const mockTask = {
        id: 'task-id',
        creator_id: 'test-user-id',
      }

      const mockApplications = [
        {
          id: 'app-1',
          task_id: 'task-id',
          worker: {
            id: 'worker-id',
            user: { full_name: 'Worker 1' },
          },
        },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const rangeMock = jest.fn().mockResolvedValue({
        data: mockApplications,
        error: null,
        count: 1,
      })
      const singleMock = jest.fn()
        .mockResolvedValue({ data: mockTask, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
        range: rangeMock,
        single: singleMock,
      }))

      await listTaskApplications(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockApplications,
        meta: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      })
    })

    it('タスク作成者以外はアクセスできない', async () => {
      mockRequest.params = { taskId: 'task-id' }
      mockRequest.query = {
        limit: '50',
        offset: '0',
      }

      const mockTask = {
        id: 'task-id',
        creator_id: 'different-user-id',
      }

      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValue({ data: mockTask, error: null })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }))

      await expect(
        listTaskApplications(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Only task creator can view applications')
    })
  })

  describe('batchGetTaskApplications', () => {
    it('複数タスクの応募一覧取得成功', async () => {
      mockRequest.query = {
        taskIds: 'task-1,task-2',
      }

      const mockTasks = [
        { id: 'task-1', creator_id: 'test-user-id' },
        { id: 'task-2', creator_id: 'test-user-id' },
      ]

      const mockApplications = [
        { id: 'app-1', task_id: 'task-1', worker: { id: 'worker-1' } },
        { id: 'app-2', task_id: 'task-2', worker: { id: 'worker-2' } },
      ]

      const selectMock = jest.fn().mockReturnThis()
      const orderMock = jest.fn().mockReturnThis()
      const inMock = jest.fn()
        .mockReturnValueOnce({
          data: mockTasks,
          error: null,
        })
        .mockReturnValueOnce({
          order: jest.fn().mockResolvedValue({
            data: mockApplications,
            error: null,
          }),
        })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        in: inMock,
        order: orderMock,
      }))

      await batchGetTaskApplications(mockRequest as Request, mockResponse as Response)

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          applications: {
            'task-1': [mockApplications[0]],
            'task-2': [mockApplications[1]],
          },
        },
      })
    })

    it('taskIdsが未指定の場合は例外を投げる', async () => {
      mockRequest.query = {}

      await expect(
        batchGetTaskApplications(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('taskIds query parameter is required')
    })

    it('100件を超えるリクエストは拒否', async () => {
      const taskIds = Array.from({ length: 101 }, (_, i) => `task-${i}`).join(',')
      mockRequest.query = { taskIds }

      await expect(
        batchGetTaskApplications(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Maximum 100 task IDs allowed per request')
    })
  })
})
