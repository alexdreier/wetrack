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

export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  email_notifications: boolean
  notify_on_assignment: boolean
  notify_on_comments: boolean
  notify_on_status_change: boolean
  created_at: string
}

export interface Task {
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

export interface TaskWithAssignee extends Task {
  assignee?: Profile | null
  creator?: Profile | null
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export interface Attachment {
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

export interface ActivityLog {
  id: string
  task_id: string
  user_id: string
  action: ActivityAction
  details: Json
  created_at: string
  user?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
      attachments: {
        Row: Attachment
        Insert: Omit<Attachment, 'id' | 'created_at'>
        Update: Partial<Omit<Attachment, 'id' | 'created_at'>>
      }
      activity_log: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: Partial<Omit<ActivityLog, 'id' | 'created_at'>>
      }
    }
  }
}
