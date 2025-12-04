import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockTask, mockTasks } from '../../test/mockData'

// Mock the apiClient module
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('../apiClient', () => ({
  apiClient: mockApiClient
}))

// Import after mocking
const { tasksApi } = await import('../tasksApi')

describe('tasksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch tasks list successfully', async () => {
      const mockResponse = {
        tasks: mockTasks,
        total: mockTasks.length
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await tasksApi.list()

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tasks')
      expect(result).toEqual(mockResponse)
    })

    it('should handle list API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      await expect(tasksApi.list()).rejects.toThrow('Network error')
    })
  })

  describe('get', () => {
    it('should fetch task by ID successfully', async () => {
      const mockResponse = { task: mockTask }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await tasksApi.get('task-123')

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/tasks/task-123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('create', () => {
    it('should create task successfully', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Description',
        category: 'translation',
        amount: 100,
        currency: 'USD',
        deadline: '2025-12-31T23:59:59Z'
      }

      const mockResponse = { task: { ...mockTask, ...taskData } }

      mockApiClient.post.mockResolvedValue(mockResponse)

      const result = await tasksApi.create(taskData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/tasks', taskData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '',
        description: '',
        category: 'invalid'
      }

      mockApiClient.post.mockRejectedValue(
        new Error('Validation error')
      )

      await expect(tasksApi.create(invalidData as any)).rejects.toThrow(
        'Validation error'
      )
    })
  })

  describe('update', () => {
    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        amount: 150
      }

      const mockResponse = { task: { ...mockTask, ...updateData } }

      mockApiClient.put.mockResolvedValue(mockResponse)

      const result = await tasksApi.update('task-123', updateData)

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/tasks/task-123', updateData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('delete', () => {
    it('should delete task successfully', async () => {
      const mockResponse = { message: 'Task deleted successfully' }

      mockApiClient.delete.mockResolvedValue(mockResponse)

      const result = await tasksApi.delete('task-123')

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/tasks/task-123')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('batchGetApplications', () => {
    it('should fetch applications for multiple tasks', async () => {
      const mockResponse = {
        applications: {
          'task-123': [],
          'task-456': []
        }
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      const result = await tasksApi.batchGetApplications(['task-123', 'task-456'])

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/tasks/batch-applications?taskIds=task-123,task-456'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should return empty object for empty task IDs', async () => {
      const result = await tasksApi.batchGetApplications([])

      expect(mockApiClient.get).not.toHaveBeenCalled()
      expect(result).toEqual({ applications: {} })
    })
  })
})
