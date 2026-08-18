'use client'

import { format } from 'date-fns'
import { ActivityAction } from '@/types/database'
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
import { getInitials } from '@/lib/utils'
import { ActivityWithUser } from '@/lib/hooks/use-task-detail'

interface ActivityFeedProps {
  activities: ActivityWithUser[]
}

const actionConfig: Record<ActivityAction, { icon: typeof Plus; label: string; color: string }> = {
  created: { icon: Plus, label: 'created this task', color: 'text-success' },
  updated: { icon: Edit, label: 'updated the task', color: 'text-info' },
  commented: { icon: MessageSquare, label: 'commented', color: 'text-info' },
  attached: { icon: Paperclip, label: 'added an attachment', color: 'text-muted-foreground' },
  status_changed: { icon: CheckCircle, label: 'changed status', color: 'text-success' },
  assigned: { icon: User, label: 'assigned the task', color: 'text-info' },
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return <p className="text-center text-muted-foreground py-4 text-sm">No activity yet</p>
  }

  return (
    <ScrollArea className="max-h-[400px] pr-4">
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action]
          const Icon = config.icon

          let details = ''
          if (activity.details && typeof activity.details === 'object') {
            const d = activity.details as Record<string, unknown>
            if (d.changes && Array.isArray(d.changes)) {
              details = `Changed: ${(d.changes as string[]).join(', ')}`
            } else if (d.file_name) {
              details = `File: ${d.file_name}`
            } else if (d.preview) {
              details = `"${d.preview}"`
            }
          }

          return (
            <div key={activity.id} className="flex gap-3">
              <div className="relative shrink-0">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    {getInitials(activity.user?.full_name, activity.user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-card border flex items-center justify-center">
                  <Icon className={`size-2.5 ${config.color}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user?.full_name || 'User'}</span>{' '}
                  <span className="text-muted-foreground">{config.label}</span>
                </p>
                {details && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{details}</p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-0.5">
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
