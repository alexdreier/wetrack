'use client'

import { TaskWithAssignee, Profile, TaskStatus, Priority } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, MessageSquare, Paperclip } from 'lucide-react'
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
    className: 'bg-red-500 text-white hover:bg-red-500',
    border: 'border-l-red-500',
    dot: 'bg-red-500'
  },
  normal: {
    label: 'Normal',
    className: 'bg-amber-500 text-white hover:bg-amber-500',
    border: 'border-l-amber-500',
    dot: 'bg-amber-500'
  },
  rainy_day: {
    label: 'Rainy Day',
    className: 'bg-slate-400 text-white hover:bg-slate-400',
    border: 'border-l-slate-400',
    dot: 'bg-slate-400'
  },
}

// Status = WHERE it is in the workflow (progress)
const statusConfig = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
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
    <Card className={`group hover:shadow-lg transition-all border-l-4 ${priorityConfig[task.priority].border} ${isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Status indicator dot */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[task.status].dot}`} />
              <Link href={`/dashboard/tasks/${task.id}`}>
                <h3 className={`font-medium hover:text-[#1669C9] transition-colors truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {task.title}
                </h3>
              </Link>
            </div>
            {task.notes && (
              <div className="text-sm text-slate-500 mt-1 ml-4 line-clamp-2">
                <RichTextDisplay content={task.notes} className="[&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0" />
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 ml-4 text-xs text-slate-500">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                </span>
              )}
              {task.time_estimate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.time_estimate}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Priority badge */}
            <Badge className={priorityConfig[task.priority].className}>
              {priorityConfig[task.priority].label}
            </Badge>

            {/* Status dropdown with colored styling */}
            <Select
              value={task.status}
              onValueChange={(value) => updateStatus(value as TaskStatus)}
            >
              <SelectTrigger className={`h-7 text-xs w-[120px] border-0 ${statusConfig[task.status].className}`}>
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
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Completed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <Select
            value={task.assigned_to || 'unassigned'}
            onValueChange={updateAssignee}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <div className="flex items-center gap-2">
                {task.assignee ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-[#00467F]/10 text-[#00467F]">
                        {assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{task.assignee.full_name}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
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

          <div className="flex items-center gap-3 text-slate-400">
            <Link
              href={`/dashboard/tasks/${task.id}#comments`}
              className="flex items-center gap-1 hover:text-[#1669C9] transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#attachments`}
              className="flex items-center gap-1 hover:text-[#1669C9] transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
