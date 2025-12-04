import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { TaskCard } from '../TaskCard'
import { renderWithProviders } from '../../test/testUtils'
import { mockTask } from '../../test/mockData'

describe('TaskCard', () => {
  it('should render task information correctly', () => {
    renderWithProviders(<TaskCard task={mockTask} />)

    // Check title
    expect(screen.getByText('Test Task')).toBeInTheDocument()

    // Check description
    expect(screen.getByText('Test task description')).toBeInTheDocument()

    // Check amount
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()

    // Check category
    expect(screen.getByText('translation')).toBeInTheDocument()
  })

  it('should format deadline correctly', () => {
    const taskWithDeadline = {
      ...mockTask,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
    }

    renderWithProviders(<TaskCard task={taskWithDeadline} />)

    expect(screen.getByText(/5 days left/i)).toBeInTheDocument()
  })

  it('should show "No deadline" when deadline is null', () => {
    const taskWithoutDeadline = {
      ...mockTask,
      deadline: null
    }

    renderWithProviders(<TaskCard task={taskWithoutDeadline} />)

    expect(screen.queryByText(/days left/i)).not.toBeInTheDocument()
  })

  it('should show "Expired" for past deadlines', () => {
    const expiredTask = {
      ...mockTask,
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }

    renderWithProviders(<TaskCard task={expiredTask} />)

    expect(screen.getByText(/Expired/i)).toBeInTheDocument()
  })

  it('should render as a link to task detail', () => {
    renderWithProviders(<TaskCard task={mockTask} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tasks/task-123')
  })

  it('should apply correct styling for different task categories', () => {
    const { container } = renderWithProviders(<TaskCard task={mockTask} />)

    // Check that category badge exists
    const categoryBadge = screen.getByText('translation')
    expect(categoryBadge).toHaveClass('bg-primary-100', 'text-primary-800')
  })

  it('should truncate long descriptions', () => {
    const taskWithLongDesc = {
      ...mockTask,
      description: 'This is a very long description that should be truncated to fit within the card. It contains a lot of text that would not fit in a single line and needs to be clipped for better presentation.'
    }

    const { container } = renderWithProviders(<TaskCard task={taskWithLongDesc} />)

    // Check that line-clamp class is applied
    const description = screen.getByText(taskWithLongDesc.description)
    expect(description).toHaveClass('line-clamp-3')
  })
})
