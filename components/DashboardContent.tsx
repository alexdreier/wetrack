'use client'

import { useState } from 'react'
import { TaskList } from '@/components/TaskList'
import { TaskFilters } from '@/components/TaskFilters'
import { CreateTaskButton } from '@/components/CreateTaskButton'
import { CalendarView } from '@/components/CalendarView'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar, List } from 'lucide-react'
import { cn, parseLocalDate } from '@/lib/utils'
import { PRIORITY_META, STATUS_META } from '@/lib/task-meta'
import { useTasks } from '@/components/TasksProvider'
import { useHotkeys } from '@/lib/hooks/use-hotkeys'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { format } from 'date-fns'

export function DashboardContent({ firstName }: { firstName: string }) {
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [createOpen, setCreateOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { tasks, statusCounts, priorityCounts } = useTasks()

  useHotkeys({
    n: () => setCreateOpen(true),
    '/': () => {
      document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
    },
    '?': () => setShortcutsOpen(true),
  })

  const open = tasks.length - statusCounts.completed
  const inProgress = statusCounts.in_progress
  const urgent = priorityCounts.urgent
  const completed = statusCounts.completed

  const stats = [
    { label: 'open', value: open, dotClass: 'bg-muted-foreground/50' },
    { label: 'in progress', value: inProgress, dotClass: STATUS_META.in_progress.dotClass },
    { label: 'urgent', value: urgent, dotClass: PRIORITY_META.urgent.dotClass },
    { label: 'done', value: completed, dotClass: STATUS_META.completed.dotClass },
  ]

  const upcoming = tasks.filter((t) => t.status !== 'completed').slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
            {stats.map((stat) => (
              <span key={stat.label} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', stat.dotClass)} />
                <span className="font-medium text-foreground">{stat.value}</span> {stat.label}
              </span>
            ))}
          </div>
        </div>
        <CreateTaskButton open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Filters + view toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <TaskFilters />
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(v) => v && setView(v as 'calendar' | 'list')}
          className="shrink-0"
        >
          <ToggleGroupItem value="list" aria-label="List view" className="gap-2 px-3">
            <List className="size-4" />
            <span className="hidden sm:inline">List</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-2 px-3">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Calendar</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TaskList />
          </div>
          <div className="hidden lg:block">
            <CalendarView tasks={tasks} compact />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView tasks={tasks} />
          </div>
          <div className="hidden lg:block">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-medium mb-3">Upcoming Tasks</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {upcoming.map((task) => (
                  <a
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className="block p-3 rounded-md border hover:border-muted-foreground/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-md font-medium',
                          PRIORITY_META[task.priority].badgeClass
                        )}
                      >
                        {PRIORITY_META[task.priority].label}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due {format(parseLocalDate(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
                {upcoming.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
