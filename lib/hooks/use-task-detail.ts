'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Task,
  TaskWithAssignee,
  Comment,
  Attachment,
  ActivityLog,
  Profile,
} from '@/types/database'
import { toast } from 'sonner'

export type CommentWithUser = Comment & { user: Profile }
export type AttachmentWithUser = Attachment & { user: Profile }
export type ActivityWithUser = ActivityLog & { user: Profile }

type UseTaskDetailArgs = {
  initialTask: TaskWithAssignee
  initialComments: CommentWithUser[]
  initialAttachments: AttachmentWithUser[]
  initialActivities: ActivityWithUser[]
  profiles: Profile[]
}

function upsertById<T extends { id: string }>(list: T[], row: T, position: 'start' | 'end'): T[] {
  const idx = list.findIndex((item) => item.id === row.id)
  if (idx === -1) return position === 'start' ? [row, ...list] : [...list, row]
  const next = [...list]
  next[idx] = row
  return next
}

// Owns all task-detail state: realtime events patch it incrementally
// (the payload carries the row; users are joined from the in-memory
// profile list) and mutations apply optimistically with rollback.
export function useTaskDetail({
  initialTask,
  initialComments,
  initialAttachments,
  initialActivities,
  profiles,
}: UseTaskDetailArgs) {
  const [task, setTask] = useState(initialTask)
  const [comments, setComments] = useState(initialComments)
  const [attachments, setAttachments] = useState(initialAttachments)
  const [activities, setActivities] = useState(initialActivities)
  const router = useRouter()

  const profilesRef = useRef(profiles)
  useEffect(() => {
    profilesRef.current = profiles
  }, [profiles])

  const joinTask = useCallback((row: Task): TaskWithAssignee => {
    const current = profilesRef.current
    return {
      ...row,
      assignee: row.assigned_to ? current.find((p) => p.id === row.assigned_to) || null : null,
      creator: current.find((p) => p.id === row.created_by) || null,
    }
  }, [])

  const joinUser = useCallback(<T extends { user_id: string }>(row: T) => {
    return { ...row, user: profilesRef.current.find((p) => p.id === row.user_id) as Profile }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`task-${initialTask.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `id=eq.${initialTask.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            toast.info('This task was deleted')
            router.push('/dashboard')
            return
          }
          setTask(joinTask(payload.new as Task))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${initialTask.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) setComments((prev) => prev.filter((c) => c.id !== oldId))
          } else {
            const row = joinUser(payload.new as Comment)
            setComments((prev) => upsertById(prev, row, 'end'))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attachments',
          filter: `task_id=eq.${initialTask.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) setAttachments((prev) => prev.filter((a) => a.id !== oldId))
          } else {
            const row = joinUser(payload.new as Attachment)
            setAttachments((prev) => upsertById(prev, row, 'start'))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `task_id=eq.${initialTask.id}`,
        },
        (payload) => {
          const row = joinUser(payload.new as ActivityLog)
          setActivities((prev) => upsertById(prev, row, 'start').slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialTask.id, joinTask, joinUser, router])

  const updateTask = useCallback(
    async (patch: Partial<Task>) => {
      let snapshot: TaskWithAssignee | null = null
      setTask((prev) => {
        snapshot = prev
        return joinTask({ ...prev, ...patch, updated_at: new Date().toISOString() })
      })
      const supabase = createClient()
      const { error } = await supabase.from('tasks').update(patch).eq('id', initialTask.id)
      if (error) {
        if (snapshot) setTask(snapshot)
        toast.error('Failed to update task')
        return false
      }
      return true
    },
    [initialTask.id, joinTask]
  )

  const deleteTask = useCallback(async () => {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', initialTask.id)
    if (error) {
      toast.error('Failed to delete task')
      return false
    }
    return true
  }, [initialTask.id])

  // Local upserts for the current user's own writes — instant feedback,
  // and the realtime echo reconciles by id without duplicating.
  const addComment = useCallback(
    (row: Comment) => setComments((prev) => upsertById(prev, joinUser(row), 'end')),
    [joinUser]
  )
  const removeComment = useCallback(
    (id: string) => setComments((prev) => prev.filter((c) => c.id !== id)),
    []
  )
  const addAttachment = useCallback(
    (row: Attachment) => setAttachments((prev) => upsertById(prev, joinUser(row), 'start')),
    [joinUser]
  )
  const removeAttachment = useCallback(
    (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id)),
    []
  )

  return {
    task,
    comments,
    attachments,
    activities,
    updateTask,
    deleteTask,
    addComment,
    removeComment,
    addAttachment,
    removeAttachment,
  }
}
