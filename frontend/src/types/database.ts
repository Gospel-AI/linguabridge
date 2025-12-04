// Database type definitions for Supabase
// Auto-generated types based on schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
