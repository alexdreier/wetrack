'use client'

import { Task, TaskWithAssignee, Profile, Priority, TaskStatus } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { PRIORITIES, STATUSES } from '@/lib/task-meta'

interface TaskPropertiesProps {
  task: TaskWithAssignee
  profiles: Profile[]
  // Persists a patch and handles activity/notifications; returns success
  onPatch: (patch: Partial<Task>, changes: string[]) => Promise<boolean>
}

// Always-editable properties panel: every field is set in place,
// no separate edit mode needed.
export function TaskProperties({ task, profiles, onPatch }: TaskPropertiesProps) {
  function patchDate(field: 'start_date' | 'due_date', value: string) {
    const next = {
      start_date: field === 'start_date' ? value : task.start_date || '',
      due_date: field === 'due_date' ? value : task.due_date || '',
    }
    if (next.start_date && next.due_date && next.start_date > next.due_date) {
      toast.error('Start date must be on or before the due date')
      return
    }
    onPatch({ [field]: value || null }, [field])
  }

  function commitEstimate(value: string) {
    if (value === (task.time_estimate || '')) return
    onPatch({ time_estimate: value || null }, ['time_estimate'])
  }

  const fieldLabel = 'text-xs text-muted-foreground'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      <div className="space-y-1">
        <Label className={fieldLabel}>Lead</Label>
        <Select
          value={task.assigned_to || 'unassigned'}
          onValueChange={(v) =>
            onPatch({ assigned_to: v === 'unassigned' ? null : v }, ['assigned_to'])
          }
        >
          <SelectTrigger size="sm" className="w-full" aria-label="Lead">
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
      </div>

      <div className="space-y-1">
        <Label className={fieldLabel}>Status</Label>
        <Select
          value={task.status}
          onValueChange={(v) => onPatch({ status: v as TaskStatus }, ['status'])}
        >
          <SelectTrigger size="sm" className="w-full" aria-label="Status">
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

      <div className="space-y-1">
        <Label className={fieldLabel}>Priority</Label>
        <Select
          value={task.priority}
          onValueChange={(v) => onPatch({ priority: v as Priority }, ['priority'])}
        >
          <SelectTrigger size="sm" className="w-full" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <span className="flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', p.dotClass)} />
                  {p.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="prop-estimate" className={fieldLabel}>
          Estimate
        </Label>
        <Input
          id="prop-estimate"
          key={task.time_estimate || ''}
          defaultValue={task.time_estimate || ''}
          onBlur={(e) => commitEstimate(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          placeholder="e.g., 2h"
          className="h-8"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="prop-start" className={fieldLabel}>
          Start Date
        </Label>
        <Input
          id="prop-start"
          type="date"
          value={task.start_date || ''}
          onChange={(e) => patchDate('start_date', e.target.value)}
          className="h-8"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="prop-due" className={fieldLabel}>
          Due Date
        </Label>
        <Input
          id="prop-due"
          type="date"
          value={task.due_date || ''}
          onChange={(e) => patchDate('due_date', e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  )
}
