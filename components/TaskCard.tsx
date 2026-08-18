'use client'

import { memo } from 'react'
import { TaskWithAssignee, TaskStatus } from '@/types/database'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, MessageSquare, Paperclip, Edit, ChevronRight } from 'lucide-react'
import { RichTextDisplay } from './RichTextDisplay'
import { cn, parseLocalDate, getInitials, stripHtml } from '@/lib/utils'
import { PRIORITY_META, STATUS_META, STATUSES } from '@/lib/task-meta'
import { useTasks } from './TasksProvider'

// Things 3 app icon (brand colors are intentional)
function ThingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#4A90D9" />
      <rect x="5" y="5" width="14" height="14" rx="2" fill="white" />
      <path
        d="M7 12L10.5 15.5L17 9"
        stroke="#3D4552"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface TaskCardProps {
  task: TaskWithAssignee
  className?: string
  dragHandle?: React.ReactNode
}

function TaskCardInner({ task, className, dragHandle }: TaskCardProps) {
  const { profiles, currentUserId, updateTask } = useTasks()
  const currentUserProfile = profiles.find((p) => p.id === currentUserId)
  const showThingsButton = currentUserProfile?.things_integration ?? false

  const priority = PRIORITY_META[task.priority]
  const status = STATUS_META[task.status]
  const isCompleted = task.status === 'completed'

  function sendToThings() {
    const params: string[] = [`title=${encodeURIComponent(task.title)}`]

    if (task.notes) {
      const plainNotes = stripHtml(task.notes)
      if (plainNotes) params.push(`notes=${encodeURIComponent(plainNotes)}`)
    }
    if (task.due_date) {
      params.push(`deadline=${encodeURIComponent(task.due_date)}`)
    }
    if (task.priority === 'urgent') {
      params.push('when=today')
    }

    window.location.href = `things:///add?${params.join('&')}`
  }

  async function updateStatus(newStatus: TaskStatus) {
    const ok = await updateTask(task.id, { status: newStatus })
    if (ok) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status_changed', taskId: task.id, data: { newStatus } }),
      })
    }
  }

  async function updateAssignee(userId: string) {
    const ok = await updateTask(task.id, {
      assigned_to: userId === 'unassigned' ? null : userId,
    })
    if (ok && userId !== 'unassigned' && userId !== currentUserId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_assigned', taskId: task.id }),
      })
    }
  }

  const iconActionClass =
    'flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'

  return (
    <div
      className={cn(
        'group bg-card rounded-lg border transition-colors hover:border-muted-foreground/30 flex',
        isCompleted && 'opacity-60',
        className
      )}
    >
      {dragHandle}
      <div className="flex-1 min-w-0 p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/tasks/${task.id}`}>
              <h3
                className={cn(
                  'font-medium leading-snug transition-colors hover:text-primary',
                  isCompleted && 'text-muted-foreground line-through'
                )}
              >
                {task.title}
              </h3>
            </Link>
            {task.notes && (
              <div className="text-muted-foreground mt-1.5 line-clamp-2">
                <RichTextDisplay content={task.notes} className="[&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0" />
              </div>
            )}
          </div>

          <span
            className={cn(
              'shrink-0 px-2 py-0.5 text-xs font-medium rounded-md',
              priority.badgeClass
            )}
          >
            {priority.label}
          </span>
        </div>

        {/* Meta row */}
        {(task.due_date || task.time_estimate) && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {task.due_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {format(parseLocalDate(task.due_date), 'MMM d')}
              </span>
            )}
            {task.time_estimate && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {task.time_estimate}
              </span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={task.assigned_to || 'unassigned'} onValueChange={updateAssignee}>
              <SelectTrigger
                size="sm"
                aria-label="Lead"
                className="text-xs bg-transparent border-transparent hover:border-border hover:bg-muted/50 transition-colors gap-1.5"
              >
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <span className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {getInitials(profile.full_name, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.full_name || profile.email}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={task.status} onValueChange={(value) => updateStatus(value as TaskStatus)}>
              <SelectTrigger
                size="sm"
                aria-label="Status"
                className={cn('text-xs font-medium border-transparent gap-1.5', status.badgeClass)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={cn('size-2 rounded-full', s.dotClass)} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            {showThingsButton && (
              <button onClick={sendToThings} className={iconActionClass} title="Send to Things">
                <ThingsIcon className="size-4" />
              </button>
            )}
            <Link
              href={`/dashboard/tasks/${task.id}?edit=true`}
              className={iconActionClass}
              title="Edit task"
            >
              <Edit className="size-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#comments`}
              className={iconActionClass}
              title="Comments"
            >
              <MessageSquare className="size-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#attachments`}
              className={iconActionClass}
              title="Attachments"
            >
              <Paperclip className="size-4" />
            </Link>
            <Link href={`/dashboard/tasks/${task.id}`} className={iconActionClass} title="View details">
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export const TaskCard = memo(TaskCardInner)
