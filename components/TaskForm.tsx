'use client'

import { Profile, Priority, TaskStatus } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from './RichTextEditor'
import { PRIORITIES, STATUSES } from '@/lib/task-meta'
import { cn } from '@/lib/utils'

export type TaskFormValues = {
  title: string
  notes: string
  priority: Priority
  status: TaskStatus
  time_estimate: string
  start_date: string
  due_date: string
  assigned_to: string // 'unassigned' or a profile id
}

export const EMPTY_TASK_FORM: TaskFormValues = {
  title: '',
  notes: '',
  priority: 'normal',
  status: 'not_started',
  time_estimate: '',
  start_date: '',
  due_date: '',
  assigned_to: 'unassigned',
}

/** Returns an error message when dates are inconsistent, else null. */
export function validateTaskDates(values: Pick<TaskFormValues, 'start_date' | 'due_date'>) {
  if (values.start_date && values.due_date && values.start_date > values.due_date) {
    return 'Start date must be on or before the due date'
  }
  return null
}

interface TaskFormProps {
  values: TaskFormValues
  onChange: (values: TaskFormValues) => void
  profiles: Profile[]
  showTitle?: boolean
  notesMinHeight?: string
}

export function TaskForm({
  values,
  onChange,
  profiles,
  showTitle = true,
  notesMinHeight = '100px',
}: TaskFormProps) {
  const set = (patch: Partial<TaskFormValues>) => onChange({ ...values, ...patch })
  const dateError = validateTaskDates(values)

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="What needs to be done?"
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <RichTextEditor
          content={values.notes}
          onChange={(notes) => set({ notes })}
          placeholder="Add any additional details or context..."
          minHeight={notesMinHeight}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={values.priority}
            onValueChange={(priority) => set({ priority: priority as Priority })}
          >
            <SelectTrigger className="w-full">
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

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={values.status}
            onValueChange={(status) => set({ status: status as TaskStatus })}
          >
            <SelectTrigger className="w-full">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-start-date">Start Date</Label>
          <Input
            id="task-start-date"
            type="date"
            value={values.start_date}
            onChange={(e) => set({ start_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={values.due_date}
            onChange={(e) => set({ due_date: e.target.value })}
            aria-invalid={!!dateError}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-estimate">Estimate</Label>
          <Input
            id="task-estimate"
            value={values.time_estimate}
            onChange={(e) => set({ time_estimate: e.target.value })}
            placeholder="e.g., 2h"
          />
        </div>
      </div>
      {dateError && <p className="text-sm text-destructive">{dateError}</p>}

      <div className="space-y-1.5">
        <Label>Lead</Label>
        <Select
          value={values.assigned_to}
          onValueChange={(assigned_to) => set({ assigned_to })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Unassigned" />
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
      </div>
    </div>
  )
}
