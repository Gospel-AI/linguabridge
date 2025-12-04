import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDashboard } from '../useDashboard'
import { tasksApi, applicationsApi } from '../../services'
import { mockTasks, mockApplications, mockUser } from '../../test/mockData'

// Mock the services
vi.mock('../../services', () => ({
  tasksApi: {
    list: vi.fn(),
    batchGetApplications: vi.fn()
  },
  applicationsApi: {
    listMy: vi.fn()
  }
}))

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}))

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch dashboard data successfully', async () => {
    // Setup mocks
    vi.mocked(tasksApi.list).mockResolvedValue({
      tasks: mockTasks,
      total: mockTasks.length
    })
    
    vi.mocked(applicationsApi.listMy).mockResolvedValue({
      applications: mockApplications
    })
    
    vi.mocked(tasksApi.batchGetApplications).mockResolvedValue({
      applications: {
        'task-123': [],
        'task-456': [],
        'task-789': []
      }
    })

    const { result } = renderHook(() => useDashboard())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Check stats
    expect(result.current.stats.postedTasks).toBe(3)
    expect(result.current.stats.appliedTasks).toBe(2)
    expect(result.current.stats.acceptedApplications).toBe(1)

    // Check tasks
    expect(result.current.postedTasks).toHaveLength(3)
    expect(result.current.appliedTasks).toHaveLength(2)
  })

  it('should handle API errors gracefully', async () => {
    // Setup mock to fail
    vi.mocked(tasksApi.list).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.postedTasks).toEqual([])
  })

  it('should filter tasks by creator', async () => {
    const otherUserTask = {
      ...mockTasks[0],
      id: 'task-999',
      creator_id: 'other-user'
    }

    vi.mocked(tasksApi.list).mockResolvedValue({
      tasks: [...mockTasks, otherUserTask],
      total: 4
    })
    
    vi.mocked(applicationsApi.listMy).mockResolvedValue({
      applications: []
    })
    
    vi.mocked(tasksApi.batchGetApplications).mockResolvedValue({
      applications: {}
    })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only show tasks created by current user
    expect(result.current.postedTasks).toHaveLength(3)
    expect(result.current.postedTasks.every(t => t.creator_id === mockUser.id)).toBe(true)
  })

  it('should calculate active tasks correctly', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue({
      tasks: mockTasks,
      total: mockTasks.length
    })
    
    vi.mocked(applicationsApi.listMy).mockResolvedValue({
      applications: []
    })
    
    vi.mocked(tasksApi.batchGetApplications).mockResolvedValue({
      applications: {}
    })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 2 tasks are published, 1 is completed
    expect(result.current.stats.activeTasks).toBe(2)
  })

  it('should handle batch API failure gracefully', async () => {
    vi.mocked(tasksApi.list).mockResolvedValue({
      tasks: mockTasks,
      total: mockTasks.length
    })
    
    vi.mocked(applicationsApi.listMy).mockResolvedValue({
      applications: mockApplications
    })
    
    // Batch API fails
    vi.mocked(tasksApi.batchGetApplications).mockRejectedValue(new Error('Batch API Error'))

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Core functionality should still work
    expect(result.current.error).toBeNull()
    expect(result.current.postedTasks).toHaveLength(3)
    expect(result.current.stats.postedTasks).toBe(3)
  })
})
