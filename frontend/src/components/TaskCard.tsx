import { Link } from 'react-router-dom'
import { memo } from 'react'

interface Task {
  id: string
  title: string
  description: string
  category: string
  amount: number
  currency: string
  deadline: string | null
  created_at: string
}

interface TaskCardProps {
  task: Task
}

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline'
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days left`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {task.category}
        </span>
        <span className="text-sm text-gray-500">
          {formatDate(task.created_at)}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {task.description}
      </p>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-primary-600">
            ${task.amount}
          </span>
          <span className="text-sm text-gray-500 ml-1">{task.currency}</span>
        </div>
        <div className="flex items-center text-sm">
          {task.deadline && (
            <span className={`${
              formatDeadline(task.deadline).includes('Expired') ||
              formatDeadline(task.deadline).includes('today')
                ? 'text-red-600'
                : 'text-gray-600'
            }`}>
              ⏰ {formatDeadline(task.deadline)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
})
