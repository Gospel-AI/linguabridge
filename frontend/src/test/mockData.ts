import { TaskWithCreator, ApplicationWithTask } from '../services'

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  email_confirmed_at: '2025-01-01T00:00:00Z'
}

export const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'both' as const,
  bio: 'Test bio',
  avatar_url: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

export const mockTask: TaskWithCreator = {
  id: 'task-123',
  title: 'Test Task',
  description: 'Test task description',
  category: 'translation',
  amount: 100,
  currency: 'USD',
  status: 'published',
  deadline: '2025-12-31T23:59:59Z',
  creator_id: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  creator: {
    id: 'user-123',
    full_name: 'Test User',
    email: 'test@example.com'
  }
}

export const mockTasks: TaskWithCreator[] = [
  mockTask,
  {
    ...mockTask,
    id: 'task-456',
    title: 'Second Task',
    category: 'ai_verification',
    amount: 50
  },
  {
    ...mockTask,
    id: 'task-789',
    title: 'Third Task',
    category: 'physical_data',
    amount: 75,
    status: 'completed'
  }
]

export const mockApplication: ApplicationWithTask = {
  id: 'app-123',
  task_id: 'task-123',
  worker_id: 'user-123',
  status: 'pending',
  cover_letter: 'Test cover letter',
  created_at: '2025-01-02T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  task: mockTask
}

export const mockApplications: ApplicationWithTask[] = [
  mockApplication,
  {
    ...mockApplication,
    id: 'app-456',
    task_id: 'task-456',
    status: 'accepted',
    task: mockTasks[1]
  }
]

export const mockDashboardStats = {
  postedTasks: 3,
  activeTasks: 2,
  appliedTasks: 2,
  acceptedApplications: 1
}
