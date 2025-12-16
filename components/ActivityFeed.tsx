'use client'

import { format } from 'date-fns'
import { ActivityLog, Profile, ActivityAction } from '@/types/database'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Edit,
  MessageSquare,
  Paperclip,
  CheckCircle,
  User,
} from 'lucide-react'

interface ActivityFeedProps {
  activities: (ActivityLog & { user: Profile })[]
}

const actionConfig: Record<
  ActivityAction,
  { icon: typeof Plus; label: string; color: string }
> = {
  created: { icon: Plus, label: 'created this task', color: 'text-green-600' },
  updated: { icon: Edit, label: 'updated the task', color: 'text-[#1669C9]' },
  commented: { icon: MessageSquare, label: 'commented', color: 'text-purple-600' },
  attached: { icon: Paperclip, label: 'added an attachment', color: 'text-orange-600' },
  status_changed: { icon: CheckCircle, label: 'changed status', color: 'text-teal-600' },
  assigned: { icon: User, label: 'assigned the task', color: 'text-indigo-600' },
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="text-center text-slate-500 py-4 text-sm">No activity yet</p>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action]
          const Icon = config.icon
          const initials = activity.user?.full_name
            ? activity.user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
            : 'U'

          let details = ''
          if (activity.details && typeof activity.details === 'object') {
            const d = activity.details as Record<string, unknown>
            if (d.changes && Array.isArray(d.changes)) {
              details = `Changed: ${(d.changes as string[]).join(', ')}`
            } else if (d.file_name) {
              details = `File: ${d.file_name}`
            } else if (d.preview) {
              details = `"${d.preview}..."`
            }
          }

          return (
            <div key={activity.id} className="flex gap-3">
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center`}
                >
                  <Icon className={`h-2.5 w-2.5 ${config.color}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium text-slate-900">
                    {activity.user?.full_name || 'User'}
                  </span>{' '}
                  <span className="text-slate-500">{config.label}</span>
                </p>
                {details && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {details}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
