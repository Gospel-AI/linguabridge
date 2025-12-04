// Database type definitions for Supabase
// LinguaBridge - LLM Annotation Platform

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Annotation Types
export type AnnotationType =
  | 'classification'
  | 'ner'
  | 'ranking'
  | 'evaluation'
  | 'translation_validation'

export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
export type TaskStatus = 'pending' | 'assigned' | 'completed' | 'reviewed'
export type AnnotationStatus = 'submitted' | 'accepted' | 'rejected' | 'revised'
export type AnnotatorTier = 'standard' | 'pro'

// Configuration types for different annotation types
export interface ClassificationConfig {
  labels: string[]
  multi_select: boolean
  instructions: string
}

export interface NERConfig {
  entity_types: string[]
  instructions: string
  allow_overlapping?: boolean
}

export interface RankingConfig {
  num_responses: number
  instructions: string
  criteria?: string[]
}

export interface EvaluationConfig {
  scale_min: number
  scale_max: number
  criteria: string[]
  instructions: string
}

export interface TranslationValidationConfig {
  error_types: string[]
  instructions: string
  scoring_rubric?: string
}

export type ProjectConfig =
  | ClassificationConfig
  | NERConfig
  | RankingConfig
  | EvaluationConfig
  | TranslationValidationConfig

// Annotation result types
export interface ClassificationAnnotation {
  label?: string
  labels?: string[]
}

export interface NEREntity {
  text: string
  start: number
  end: number
  type: string
}

export interface NERAnnotation {
  entities: NEREntity[]
}

export interface RankingAnnotation {
  ranking: number[]
  preferred?: number
}

export interface EvaluationAnnotation {
  score: number
  comment?: string
}

export interface TranslationValidationAnnotation {
  quality_score: number
  errors?: Array<{
    type: string
    start: number
    end: number
    comment?: string
  }>
  comment?: string
}

export type AnnotationResult =
  | ClassificationAnnotation
  | NERAnnotation
  | RankingAnnotation
  | EvaluationAnnotation
  | TranslationValidationAnnotation

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'client' | 'worker' | 'both'
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'client' | 'worker' | 'both'
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'client' | 'worker' | 'both'
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      annotation_projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          annotation_type: AnnotationType
          config: ProjectConfig
          source_language: string
          target_languages: string[]
          annotations_per_task: number
          gold_standard_ratio: number
          price_per_task: number
          currency: string
          status: ProjectStatus
          total_tasks: number
          completed_tasks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          annotation_type: AnnotationType
          config: ProjectConfig
          source_language?: string
          target_languages?: string[]
          annotations_per_task?: number
          gold_standard_ratio?: number
          price_per_task: number
          currency?: string
          status?: ProjectStatus
          total_tasks?: number
          completed_tasks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          annotation_type?: AnnotationType
          config?: ProjectConfig
          source_language?: string
          target_languages?: string[]
          annotations_per_task?: number
          gold_standard_ratio?: number
          price_per_task?: number
          currency?: string
          status?: ProjectStatus
          total_tasks?: number
          completed_tasks?: number
          created_at?: string
          updated_at?: string
        }
      }
      annotation_tasks: {
        Row: {
          id: string
          project_id: string
          data: Json
          is_gold: boolean
          gold_answer: Json | null
          status: TaskStatus
          assigned_count: number
          completed_count: number
          batch_id: string | null
          sequence_number: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          data: Json
          is_gold?: boolean
          gold_answer?: Json | null
          status?: TaskStatus
          assigned_count?: number
          completed_count?: number
          batch_id?: string | null
          sequence_number?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          data?: Json
          is_gold?: boolean
          gold_answer?: Json | null
          status?: TaskStatus
          assigned_count?: number
          completed_count?: number
          batch_id?: string | null
          sequence_number?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      annotations: {
        Row: {
          id: string
          task_id: string
          annotator_id: string
          annotation: AnnotationResult
          time_spent_seconds: number | null
          is_correct: boolean | null
          status: AnnotationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          annotator_id: string
          annotation: AnnotationResult
          time_spent_seconds?: number | null
          is_correct?: boolean | null
          status?: AnnotationStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          annotator_id?: string
          annotation?: AnnotationResult
          time_spent_seconds?: number | null
          is_correct?: boolean | null
          status?: AnnotationStatus
          created_at?: string
          updated_at?: string
        }
      }
      annotator_profiles: {
        Row: {
          id: string
          user_id: string
          native_languages: string[]
          fluent_languages: string[]
          certified_types: AnnotationType[]
          tier: AnnotatorTier
          total_annotations: number
          accepted_annotations: number
          accuracy_score: number | null
          average_time_seconds: number | null
          is_available: boolean
          max_daily_tasks: number
          training_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          native_languages?: string[]
          fluent_languages?: string[]
          certified_types?: AnnotationType[]
          tier?: AnnotatorTier
          total_annotations?: number
          accepted_annotations?: number
          accuracy_score?: number | null
          average_time_seconds?: number | null
          is_available?: boolean
          max_daily_tasks?: number
          training_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          native_languages?: string[]
          fluent_languages?: string[]
          certified_types?: AnnotationType[]
          tier?: AnnotatorTier
          total_annotations?: number
          accepted_annotations?: number
          accuracy_score?: number | null
          average_time_seconds?: number | null
          is_available?: boolean
          max_daily_tasks?: number
          training_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      supported_languages: {
        Row: {
          code: string
          name: string
          native_name: string | null
          region: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          name: string
          native_name?: string | null
          region?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          name?: string
          native_name?: string | null
          region?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      // Legacy tables (to be deprecated)
      tasks: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          category: string
          amount: number
          currency: string
          status: 'draft' | 'published' | 'in_progress' | 'completed' | 'approved' | 'cancelled'
          deadline: string | null
          requirements: Json | null
          attachments: string[] | null
          created_at: string
          updated_at: string
          published_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          category: string
          amount: number
          currency?: string
          status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'approved' | 'cancelled'
          deadline?: string | null
          requirements?: Json | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          category?: string
          amount?: number
          currency?: string
          status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'approved' | 'cancelled'
          deadline?: string | null
          requirements?: Json | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          completed_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          task_id: string
          worker_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          cover_letter: string | null
          proposed_delivery: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          worker_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          proposed_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          worker_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
          cover_letter?: string | null
          proposed_delivery?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          task_id: string
          client_id: string
          worker_id: string
          amount: number
          platform_fee: number
          worker_payout: number
          currency: string
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          status: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed'
          created_at: string
          updated_at: string
          captured_at: string | null
          transferred_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          client_id: string
          worker_id: string
          amount: number
          platform_fee: number
          worker_payout: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          status?: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed'
          created_at?: string
          updated_at?: string
          captured_at?: string | null
          transferred_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          client_id?: string
          worker_id?: string
          amount?: number
          platform_fee?: number
          worker_payout?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          status?: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed'
          created_at?: string
          updated_at?: string
          captured_at?: string | null
          transferred_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for components
export type AnnotationProject = Database['public']['Tables']['annotation_projects']['Row']
export type AnnotationTask = Database['public']['Tables']['annotation_tasks']['Row']
export type Annotation = Database['public']['Tables']['annotations']['Row']
export type AnnotatorProfile = Database['public']['Tables']['annotator_profiles']['Row']
export type SupportedLanguage = Database['public']['Tables']['supported_languages']['Row']
export type User = Database['public']['Tables']['users']['Row']
