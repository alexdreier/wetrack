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

interface TaskCardProps {
  task: TaskWithAssignee
  profiles: Profile[]
  onUpdate?: () => void
}

const priorityConfig = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  next_week: { label: 'Next Week', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  rainy_day: { label: 'Rainy Day', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
}

const statusConfig = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
}

export function TaskCard({ task, profiles, onUpdate }: TaskCardProps) {
  const supabase = createClient()

  async function updateStatus(newStatus: TaskStatus) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update status')
    } else {
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

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/tasks/${task.id}`}>
              <h3 className="font-medium text-slate-900 hover:text-blue-600 transition-colors truncate">
                {task.title}
              </h3>
            </Link>
            {task.notes && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                {task.notes}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
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
            <Badge className={priorityConfig[task.priority].className}>
              {priorityConfig[task.priority].label}
            </Badge>

            <Select
              value={task.status}
              onValueChange={(value) => updateStatus(value as TaskStatus)}
            >
              <SelectTrigger className="h-7 text-xs w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                      <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
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
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Link
              href={`/dashboard/tasks/${task.id}#attachments`}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
