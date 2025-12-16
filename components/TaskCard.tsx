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
import { Calendar, Clock, MessageSquare, Paperclip, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextDisplay } from './RichTextEditor'

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
    className: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm shadow-red-200',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    glow: 'shadow-red-100'
  },
  normal: {
    label: 'Normal',
    className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-200',
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-100'
  },
  rainy_day: {
    label: 'Rainy Day',
    className: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-sm shadow-slate-200',
    border: 'border-l-slate-400',
    dot: 'bg-slate-400',
    glow: 'shadow-slate-100'
  },
}

// Status = WHERE it is in the workflow (progress)
const statusConfig = {
  not_started: { label: 'Not Started', className: 'bg-slate-50 text-slate-600 border border-slate-200', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
}

export function TaskCard({ task, profiles, currentUserId, onUpdate }: TaskCardProps) {
  const supabase = createClient()

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
    <div className={`group relative bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Priority accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityConfig[task.priority].dot}`} />

      <div className="p-5 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/tasks/${task.id}`} className="group/link">
              <h3 className={`font-semibold text-[15px] leading-tight group-hover/link:text-[#1669C9] transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {task.title}
              </h3>
            </Link>
            {task.notes && (
              <div className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                <RichTextDisplay content={task.notes} className="[&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0" />
              </div>
            )}
          </div>

          {/* Priority badge */}
          <Badge className={`${priorityConfig[task.priority].className} px-3 py-1 text-xs font-medium rounded-full`}>
            {priorityConfig[task.priority].label}
          </Badge>
        </div>

        {/* Meta info row */}
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          {task.due_date && (
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">{format(new Date(task.due_date), 'MMM d')}</span>
            </span>
          )}
          {task.time_estimate && (
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium">{task.time_estimate}</span>
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {/* Assignee dropdown */}
            <Select
              value={task.assigned_to || 'unassigned'}
              onValueChange={updateAssignee}
            >
              <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors rounded-lg">
                <div className="flex items-center gap-2">
                  {task.assignee ? (
                    <>
                      <Avatar className="h-5 w-5 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white font-medium">
                          {assigneeInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-700">{task.assignee.full_name}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status dropdown */}
            <Select
              value={task.status}
              onValueChange={(value) => updateStatus(value as TaskStatus)}
            >
              <SelectTrigger className={`h-8 text-xs w-[130px] rounded-lg font-medium ${statusConfig[task.status].className}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusConfig[task.status].dot}`} />
                  <SelectValue />
                </div>
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
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Completed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/tasks/${task.id}#comments`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#attachments`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-blue-50 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#1669C9] hover:bg-blue-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
