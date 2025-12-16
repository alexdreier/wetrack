'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TaskWithAssignee, Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from './TaskCard'
import { CheckCircle } from 'lucide-react'

interface TaskListProps {
  initialTasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
}

export function TaskList({ initialTasks, profiles, currentUserId }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Sync with initialTasks when they change (e.g., after navigation)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Filter tasks based on search params
  const filteredTasks = tasks.filter((task) => {
    const search = searchParams.get('search')?.toLowerCase()
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignee = searchParams.get('assignee')

    if (search && !task.title.toLowerCase().includes(search) &&
        !task.notes?.toLowerCase().includes(search)) {
      return false
    }
    if (status && status !== 'all' && task.status !== status) {
      return false
    }
    if (priority && priority !== 'all' && task.priority !== priority) {
      return false
    }
    if (assignee && assignee !== 'all') {
      if (assignee === 'mine' && task.assigned_to !== currentUserId) {
        return false
      }
      if (assignee === 'unassigned' && task.assigned_to !== null) {
        return false
      }
    }
    return true
  })

  // Sort tasks based on sort param
  const sort = searchParams.get('sort') || 'updated'
  const priorityOrder = { urgent: 0, normal: 1, rainy_day: 2 }

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sort) {
      case 'updated':
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      case 'lead':
        const aName = a.assignee?.full_name || 'zzz'
        const bName = b.assignee?.full_name || 'zzz'
        return aName.localeCompare(bName)
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      default:
        return 0
    }
  })

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        async () => {
          // Refetch tasks when any change occurs
          const { data } = await supabase
            .from('tasks')
            .select(`
              *,
              assignee:profiles!tasks_assigned_to_fkey(*),
              creator:profiles!tasks_created_by_fkey(*)
            `)
            .order('created_at', { ascending: false })

          if (data) {
            setTasks(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function refreshTasks() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setTasks(data)
    }
  }

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No tasks found</h3>
        <p className="text-slate-500 mt-1">
          {tasks.length === 0
            ? "Create your first task to get started"
            : "Try adjusting your filters"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          profiles={profiles}
          currentUserId={currentUserId}
          onUpdate={refreshTasks}
        />
      ))}
    </div>
  )
}
