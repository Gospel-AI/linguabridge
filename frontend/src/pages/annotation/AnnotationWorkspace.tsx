import { useState, useEffect, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ClassificationAnnotator,
  NERAnnotator,
  RankingAnnotator,
  EvaluationAnnotator,
  TranslationValidationAnnotator
} from '../../components/annotation'
import type {
  AnnotationProject,
  AnnotationTask,
  AnnotationType,
  ClassificationConfig,
  NERConfig,
  RankingConfig,
  EvaluationConfig,
  TranslationValidationConfig,
  AnnotationResult
} from '../../types/database'
import { supabase } from '../../lib/supabase'

type TaskWithData = Omit<AnnotationTask, 'data'> & {
  data: Record<string, unknown>
}

export const AnnotationWorkspace = memo(function AnnotationWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const [project, setProject] = useState<AnnotationProject | null>(null)
  const [currentTask, setCurrentTask] = useState<TaskWithData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ completed: 0, total: 0 })

  // Load project and first task
  useEffect(() => {
    const loadProjectAndTask = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        setError(null)

        // Load project
        const { data: projectData, error: projectError } = await supabase
          .from('annotation_projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Load stats
        const { count: totalCount } = await supabase
          .from('annotation_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)

        const { count: completedCount } = await supabase
          .from('annotation_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('status', 'completed')

        setStats({
          total: totalCount || 0,
          completed: completedCount || 0
        })

        // Load next available task
        await loadNextTask(projectId)

      } catch (err) {
        console.error('Failed to load project:', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    loadProjectAndTask()
  }, [projectId])

  const loadNextTask = async (projId: string) => {
    const { data: taskData, error: taskError } = await supabase
      .from('annotation_tasks')
      .select('*')
      .eq('project_id', projId)
      .eq('status', 'pending')
      .order('sequence_number', { ascending: true })
      .limit(1)
      .single()

    if (taskError && taskError.code !== 'PGRST116') {
      throw taskError
    }

    setCurrentTask(taskData as TaskWithData | null)
  }

  const handleSubmit = async (annotation: AnnotationResult, timeSpent: number) => {
    if (!currentTask || !project) return

    try {
      setSubmitting(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Submit annotation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: annotationError } = await (supabase as any)
        .from('annotations')
        .insert({
          task_id: currentTask.id,
          annotator_id: user.id,
          annotation,
          time_spent_seconds: timeSpent,
          status: 'submitted'
        })

      if (annotationError) throw annotationError

      // Update stats
      setStats(prev => ({ ...prev, completed: prev.completed + 1 }))

      // Load next task
      await loadNextTask(project.id)

    } catch (err) {
      console.error('Failed to submit annotation:', err)
      setError('Failed to submit annotation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!project) return
    await loadNextTask(project.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="text-primary-600 hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    )
  }

  if (!currentTask) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              All Tasks Completed!
            </h2>
            <p className="text-gray-600 mb-6">
              You've completed all available tasks in this project.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              Completed: {stats.completed} / {stats.total} tasks
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAnnotator = () => {
    const annotationType = project.annotation_type as AnnotationType

    switch (annotationType) {
      case 'classification':
        return (
          <ClassificationAnnotator
            data={currentTask.data as { text: string }}
            config={project.config as ClassificationConfig}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )
      case 'ner':
        return (
          <NERAnnotator
            data={currentTask.data as { text: string }}
            config={project.config as NERConfig}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )
      case 'ranking':
        return (
          <RankingAnnotator
            data={currentTask.data as { prompt: string; responses: string[] }}
            config={project.config as RankingConfig}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )
      case 'evaluation':
        return (
          <EvaluationAnnotator
            data={currentTask.data as { text: string }}
            config={project.config as EvaluationConfig}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )
      case 'translation_validation':
        return (
          <TranslationValidationAnnotator
            data={currentTask.data as { source_text: string; target_text: string }}
            config={project.config as TranslationValidationConfig}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
          />
        )
      default:
        return <p className="text-red-600">Unknown annotation type: {annotationType}</p>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">
                {project.annotation_type.replace('_', ' ')} annotation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats.completed} / {stats.total}
                </div>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="max-w-5xl mx-auto py-6 px-4">
        {submitting ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Submitting...</span>
          </div>
        ) : (
          renderAnnotator()
        )}
      </div>
    </div>
  )
})

export default AnnotationWorkspace
