'use client'

import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskWithAssignee, Profile, TaskStatus, Priority } from '@/types/database'
import { PRIORITY_META } from '@/lib/task-meta'
import { toast } from 'sonner'

export type SortKey = 'manual' | 'updated' | 'created' | 'due_date' | 'lead' | 'priority'

export type TaskFiltersState = {
  search: string
  // 'open' = everything not completed (the default, matching task-app norms)
  status: 'open' | 'all' | TaskStatus
  priority: 'all' | Priority
  assignee: 'all' | 'mine' | 'unassigned'
  sort: SortKey
}

const DEFAULT_FILTERS: TaskFiltersState = {
  search: '',
  status: 'open',
  priority: 'all',
  assignee: 'all',
  sort: 'manual',
}

type TasksContextValue = {
  tasks: TaskWithAssignee[]
  filteredTasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
  filters: TaskFiltersState
  setFilter: <K extends keyof TaskFiltersState>(key: K, value: TaskFiltersState[K]) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  statusCounts: Record<TaskStatus, number>
  priorityCounts: Record<Priority, number>
  subtaskCounts: Map<string, { total: number; done: number }>
  updateTask: (id: string, patch: Partial<Task>) => Promise<boolean>
  reorderTask: (activeId: string, overId: string) => void
  removeTask: (id: string) => Promise<boolean>
  addTask: (task: Task) => void
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within TasksProvider')
  return ctx
}

export function TasksProvider({
  initialTasks,
  profiles,
  currentUserId,
  children,
}: {
  initialTasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
  children: React.ReactNode
}) {
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks)
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<TaskFiltersState>(() => ({
    search: searchParams.get('search') || DEFAULT_FILTERS.search,
    status: (searchParams.get('status') as TaskFiltersState['status']) || DEFAULT_FILTERS.status,
    priority:
      (searchParams.get('priority') as TaskFiltersState['priority']) || DEFAULT_FILTERS.priority,
    assignee:
      (searchParams.get('assignee') as TaskFiltersState['assignee']) || DEFAULT_FILTERS.assignee,
    sort: (searchParams.get('sort') as SortKey) || DEFAULT_FILTERS.sort,
  }))

  const profilesRef = useRef(profiles)
  useEffect(() => {
    profilesRef.current = profiles
  }, [profiles])

  // Join a bare task row against the (tiny) in-memory profile list —
  // realtime payloads carry the row but not the embedded joins.
  const joinTask = useCallback((row: Task): TaskWithAssignee => {
    const current = profilesRef.current
    return {
      ...row,
      assignee: row.assigned_to ? current.find((p) => p.id === row.assigned_to) || null : null,
      creator: current.find((p) => p.id === row.created_by) || null,
    }
  }, [])

  const upsertTask = useCallback(
    (row: Task) => {
      setTasks((prev) => {
        const joined = joinTask(row)
        const idx = prev.findIndex((t) => t.id === row.id)
        if (idx === -1) return [joined, ...prev]
        const next = [...prev]
        next[idx] = joined
        return next
      })
    },
    [joinTask]
  )

  // Incremental realtime sync — apply the changed row, never refetch the list
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id
            if (oldId) setTasks((prev) => prev.filter((t) => t.id !== oldId))
          } else {
            upsertTask(payload.new as Task)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [upsertTask])

  const setFilter = useCallback(
    <K extends keyof TaskFiltersState>(key: K, value: TaskFiltersState[K]) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value }
        // Keep the URL shareable without triggering a server navigation
        const params = new URLSearchParams(window.location.search)
        for (const [k, v] of Object.entries(next)) {
          if (v && v !== DEFAULT_FILTERS[k as keyof TaskFiltersState]) params.set(k, v)
          else params.delete(k)
        }
        const query = params.toString()
        window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
        return next
      })
    },
    []
  )

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== DEFAULT_FILTERS.status ||
    filters.priority !== 'all' ||
    filters.assignee !== 'all'

  // Optimistic mutation: apply locally, persist, roll back on error.
  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      let snapshot: TaskWithAssignee[] = []
      setTasks((prev) => {
        snapshot = prev
        return prev.map((t) =>
          t.id === id
            ? joinTask({ ...t, ...patch, updated_at: new Date().toISOString() })
            : t
        )
      })
      const supabase = createClient()
      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) {
        setTasks(snapshot)
        toast.error('Failed to update task')
        return false
      }
      return true
    },
    [joinTask]
  )

  const removeTask = useCallback(async (id: string) => {
    let snapshot: TaskWithAssignee[] = []
    setTasks((prev) => {
      snapshot = prev
      return prev.filter((t) => t.id !== id)
    })
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      setTasks(snapshot)
      toast.error('Failed to delete task')
      return false
    }
    return true
  }, [])

  const addTask = useCallback(
    (task: Task) => {
      upsertTask(task)
    },
    [upsertTask]
  )

  // Search is deferred so typing stays instant even with long lists
  const deferredSearch = useDeferredValue(filters.search)

  const filteredTasks = useMemo(() => {
    const search = deferredSearch.toLowerCase()
    const filtered = tasks.filter((task) => {
      // Subtasks live on their parent's detail page, not in the main list
      if (task.parent_id) return false
      if (
        search &&
        !task.title.toLowerCase().includes(search) &&
        !task.notes?.toLowerCase().includes(search)
      ) {
        return false
      }
      if (filters.status === 'open' && task.status === 'completed') return false
      if (filters.status !== 'open' && filters.status !== 'all' && task.status !== filters.status)
        return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (filters.assignee === 'mine' && task.assigned_to !== currentUserId) return false
      if (filters.assignee === 'unassigned' && task.assigned_to !== null) return false
      return true
    })

    return filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'manual': {
          const ap = a.position ?? Number.MAX_SAFE_INTEGER
          const bp = b.position ?? Number.MAX_SAFE_INTEGER
          if (ap !== bp) return ap - bp
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        case 'updated':
          return (
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
          )
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case 'lead': {
          const aName = a.assignee?.full_name || 'zzz'
          const bName = b.assignee?.full_name || 'zzz'
          return aName.localeCompare(bName)
        }
        case 'priority':
          return PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order
        default:
          return 0
      }
    })
  }, [tasks, deferredSearch, filters.status, filters.priority, filters.assignee, filters.sort, currentUserId])

  // Drop the active task next to `over` in the visible order; fractional
  // positions mean one row update, no reindexing of neighbors.
  const reorderTask = useCallback(
    (activeId: string, overId: string) => {
      const ordered = filteredTasks
      const oldIndex = ordered.findIndex((t) => t.id === activeId)
      const newIndex = ordered.findIndex((t) => t.id === overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      // Matches dnd-kit's arrayMove: the dragged task lands at newIndex
      const without = ordered.filter((t) => t.id !== activeId)
      const prev = without[newIndex - 1]
      const next = without[newIndex]
      const posOf = (t: TaskWithAssignee | undefined) => t?.position ?? null

      let newPos: number
      const prevPos = posOf(prev)
      const nextPos = posOf(next)
      if (prevPos !== null && nextPos !== null) newPos = (prevPos + nextPos) / 2
      else if (prevPos !== null) newPos = prevPos + 1024
      else if (nextPos !== null) newPos = nextPos - 1024
      else newPos = 0

      updateTask(activeId, { position: newPos })
    },
    [filteredTasks, updateTask]
  )

  const statusCounts = useMemo(() => {
    const counts = { not_started: 0, in_progress: 0, completed: 0 } as Record<TaskStatus, number>
    for (const t of tasks) if (!t.parent_id) counts[t.status]++
    return counts
  }, [tasks])

  const priorityCounts = useMemo(() => {
    const counts = { urgent: 0, normal: 0, rainy_day: 0 } as Record<Priority, number>
    for (const t of tasks) if (!t.parent_id && t.status !== 'completed') counts[t.priority]++
    return counts
  }, [tasks])

  const subtaskCounts = useMemo(() => {
    const counts = new Map<string, { total: number; done: number }>()
    for (const t of tasks) {
      if (!t.parent_id) continue
      const entry = counts.get(t.parent_id) || { total: 0, done: 0 }
      entry.total++
      if (t.status === 'completed') entry.done++
      counts.set(t.parent_id, entry)
    }
    return counts
  }, [tasks])

  const value = useMemo(
    () => ({
      tasks,
      filteredTasks,
      profiles,
      currentUserId,
      filters,
      setFilter,
      clearFilters,
      hasActiveFilters,
      statusCounts,
      priorityCounts,
      subtaskCounts,
      updateTask,
      reorderTask,
      removeTask,
      addTask,
    }),
    [
      tasks,
      filteredTasks,
      profiles,
      currentUserId,
      filters,
      setFilter,
      clearFilters,
      hasActiveFilters,
      statusCounts,
      priorityCounts,
      subtaskCounts,
      updateTask,
      reorderTask,
      removeTask,
      addTask,
    ]
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
