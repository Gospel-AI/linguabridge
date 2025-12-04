import { useState, useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { annotationsApi } from '../../services'
import type { AnnotationProject, AnnotationType } from '../../types/database'

const TYPE_LABELS: Record<AnnotationType, { label: string; color: string }> = {
  classification: { label: 'Classification', color: 'bg-blue-100 text-blue-800' },
  ner: { label: 'NER', color: 'bg-green-100 text-green-800' },
  ranking: { label: 'Ranking', color: 'bg-purple-100 text-purple-800' },
  evaluation: { label: 'Evaluation', color: 'bg-orange-100 text-orange-800' },
  translation_validation: { label: 'Translation', color: 'bg-pink-100 text-pink-800' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600' },
}

export const ProjectList = memo(function ProjectList() {
  useAuth() // Ensure user is authenticated
  const [projects, setProjects] = useState<AnnotationProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active'>('active')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)

        const params = filter === 'active' ? { status: 'active' } : undefined
        const { projects: data } = await annotationsApi.listProjects(params)
        setProjects(data || [])

      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [filter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Annotation Projects</h1>
            <p className="mt-1 text-gray-600">
              Select a project to start annotating
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects available
            </h3>
            <p className="text-gray-600">
              {filter === 'active'
                ? 'There are no active projects at the moment.'
                : 'No projects have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const typeInfo = TYPE_LABELS[project.annotation_type as AnnotationType] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
              const statusInfo = STATUS_LABELS[project.status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
              const totalTasks = project.total_tasks ?? 0
              const completedTasks = project.completed_tasks ?? 0
              const progress = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0

              return (
                <Link
                  key={project.id}
                  to={`/annotate/${project.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Type Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-900">
                          {completedTasks} / {totalTasks}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Per task</span>
                      <span className="text-lg font-semibold text-primary-600">
                        ${Number(project.price_per_task ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

export default ProjectList
