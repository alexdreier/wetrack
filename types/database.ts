export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Priority = 'urgent' | 'normal' | 'rainy_day'
export type TaskStatus = 'not_started' | 'in_progress' | 'completed'
export type ActivityAction = 'created' | 'updated' | 'commented' | 'attached' | 'status_changed' | 'assigned'

export type Profile = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  email_notifications: boolean
  notify_on_assignment: boolean
  notify_on_comments: boolean
  notify_on_status_change: boolean
  things_integration: boolean
  created_at: string
}

export type Task = {
  id: string
  title: string
  notes: string | null
  priority: Priority
  status: TaskStatus
  time_estimate: string | null
  start_date: string | null
  due_date: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type TaskWithAssignee = Task & {
  assignee?: Profile | null
  creator?: Profile | null
}

export type Comment = {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export type Attachment = {
  id: string
  task_id: string
  user_id: string
  file_name: string
  file_url: string
  file_size: number
  content_type: string
  created_at: string
  user?: Profile
}

export type ActivityLog = {
  id: string
  task_id: string
  user_id: string
  action: ActivityAction
  details: Json
  created_at: string
  user?: Profile
}

// Generated-style schema for the supabase-js typed client. Row shapes exclude
// the join fields (user/assignee/creator) that only exist on embedded selects.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: 'tasks_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: Omit<Comment, 'user'>
        Insert: Omit<Comment, 'id' | 'created_at' | 'user'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Comment, 'id' | 'created_at' | 'user'>>
        Relationships: [
          {
            foreignKeyName: 'comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      attachments: {
        Row: Omit<Attachment, 'user'>
        Insert: Omit<Attachment, 'id' | 'created_at' | 'user'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Attachment, 'id' | 'created_at' | 'user'>>
        Relationships: [
          {
            foreignKeyName: 'attachments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attachments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      activity_log: {
        Row: Omit<ActivityLog, 'user'>
        Insert: Omit<ActivityLog, 'id' | 'created_at' | 'user'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<ActivityLog, 'id' | 'created_at' | 'user'>>
        Relationships: [
          {
            foreignKeyName: 'activity_log_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      priority_level: Priority
      task_status: TaskStatus
      activity_action: ActivityAction
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
