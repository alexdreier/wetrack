'use client'

import { TaskWithAssignee, Profile, TaskStatus, Priority } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, MessageSquare, Paperclip, ChevronRight, Edit, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextDisplay } from './RichTextEditor'
import { parseLocalDate } from '@/lib/utils'

interface TaskCardProps {
  task: TaskWithAssignee
  profiles: Profile[]
  currentUserId: string
  onUpdate?: () => void
}

// Priority = WHEN it needs to be done (urgency/timing)
const priorityConfig = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-500/10 text-red-700 ring-1 ring-red-500/20',
    accent: 'from-red-500 to-rose-500',
    dot: 'bg-red-500',
  },
  normal: {
    label: 'Normal',
    badge: 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20',
    accent: 'from-amber-500 to-orange-500',
    dot: 'bg-amber-500',
  },
  rainy_day: {
    label: 'Rainy Day',
    badge: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20',
    accent: 'from-slate-400 to-slate-500',
    dot: 'bg-slate-400',
  },
}

// Status = WHERE it is in the workflow (progress)
const statusConfig = {
  not_started: { label: 'Not Started', className: 'bg-slate-100/80 text-slate-600 ring-1 ring-slate-200', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dot: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
}

export function TaskCard({ task, profiles, currentUserId, onUpdate }: TaskCardProps) {
  const supabase = createClient()
  const currentUserProfile = profiles.find(p => p.id === currentUserId)
  const showThingsButton = currentUserProfile?.things_integration ?? false

  function sendToThings() {
    const params = new URLSearchParams()
    params.set('title', task.title)
    if (task.notes) {
      // Strip HTML tags for Things notes
      const plainNotes = task.notes.replace(/<[^>]*>/g, '')
      params.set('notes', plainNotes)
    }
    if (task.due_date) {
      params.set('deadline', task.due_date)
    }
    // Map priority to Things when parameter
    if (task.priority === 'urgent') {
      params.set('when', 'today')
    }

    const thingsUrl = `things:///add?${params.toString()}`
    window.open(thingsUrl, '_self')
    toast.success('Sent to Things')
  }

  async function updateStatus(newStatus: TaskStatus) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
      // Send notification for status change
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_changed',
          taskId: task.id,
          userId: currentUserId,
          data: { newStatus },
        }),
      })
      toast.success('Status updated')
      onUpdate?.()
    }
  }

  async function updateAssignee(userId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId === 'unassigned' ? null : userId })
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update assignee')
    } else {
      // Send notification if assigned to someone else
      if (userId !== 'unassigned' && userId !== currentUserId) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'task_assigned',
            taskId: task.id,
            userId: currentUserId,
          }),
        })
      }
      toast.success('Assignee updated')
      onUpdate?.()
    }
  }

  const assigneeInitials = task.assignee?.full_name
    ? task.assignee.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : null

  const isCompleted = task.status === 'completed'

  return (
    <div className={`group relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-300/60 transition-all duration-300 overflow-hidden ${isCompleted ? 'opacity-50' : ''}`}>
      {/* Priority accent gradient bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${priorityConfig[task.priority].accent}`} />

      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="p-5 pl-7">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/tasks/${task.id}`} className="group/link inline-block">
              <h3 className={`font-semibold text-base leading-snug tracking-tight group-hover/link:text-[#1669C9] transition-colors duration-200 ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                {task.title}
              </h3>
            </Link>
            {task.notes && (
              <div className="text-[13px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                <RichTextDisplay content={task.notes} className="[&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0" />
              </div>
            )}
          </div>

          {/* Priority badge */}
          <span className={`${priorityConfig[task.priority].badge} px-3 py-1.5 text-[11px] font-semibold rounded-full uppercase tracking-wide`}>
            {priorityConfig[task.priority].label}
          </span>
        </div>

        {/* Meta info row */}
        {(task.due_date || task.time_estimate) && (
          <div className="flex items-center gap-3 mt-4">
            {task.due_date && (
              <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{format(parseLocalDate(task.due_date), 'MMM d')}</span>
              </span>
            )}
            {task.time_estimate && (
              <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{task.time_estimate}</span>
              </span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-end justify-between mt-5 pt-4 border-t border-slate-100/80">
          <div className="flex items-end gap-8">
            {/* Lead dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Lead</span>
              <Select
                value={task.assigned_to || 'unassigned'}
                onValueChange={updateAssignee}
              >
                <SelectTrigger className="h-9 w-auto min-w-[150px] text-xs bg-white/80 backdrop-blur-sm border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-sm transition-all duration-200 rounded-xl">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 ring-2 ring-white shadow-sm">
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white font-semibold">
                            {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {profile.full_name || profile.email}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</span>
              <Select
                value={task.status}
                onValueChange={(value) => updateStatus(value as TaskStatus)}
              >
                <SelectTrigger className={`h-9 text-xs w-[140px] rounded-xl font-medium shadow-sm ${statusConfig[task.status].className}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Not Started
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Completed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-0.5 bg-slate-100/60 rounded-xl p-1">
            {showThingsButton && (
              <button
                onClick={sendToThings}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-white hover:shadow-sm transition-all duration-200"
                title="Send to Things"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
            <Link
              href={`/dashboard/tasks/${task.id}?edit=true`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-white hover:shadow-sm transition-all duration-200"
              title="Edit task"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#comments`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-white hover:shadow-sm transition-all duration-200"
              title="Comments"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#attachments`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-white hover:shadow-sm transition-all duration-200"
              title="Attachments"
            >
              <Paperclip className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-white hover:shadow-sm transition-all duration-200"
              title="View details"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
