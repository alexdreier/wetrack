import { Priority, TaskStatus } from '@/types/database'

// Single source of truth for priority/status presentation.
// Classes use the semantic tokens from globals.css so they adapt to dark mode.

export type PriorityMeta = {
  value: Priority
  label: string
  badgeClass: string
  dotClass: string
  accentClass: string
  order: number
}

export type StatusMeta = {
  value: TaskStatus
  label: string
  badgeClass: string
  dotClass: string
  order: number
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  urgent: {
    value: 'urgent',
    label: 'Urgent',
    badgeClass: 'bg-urgent-muted text-urgent-foreground',
    dotClass: 'bg-urgent',
    accentClass: 'bg-urgent',
    order: 0,
  },
  normal: {
    value: 'normal',
    label: 'Normal',
    badgeClass: 'bg-info-muted text-info-foreground',
    dotClass: 'bg-info',
    accentClass: 'bg-info',
    order: 1,
  },
  rainy_day: {
    value: 'rainy_day',
    label: 'Rainy Day',
    badgeClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground/50',
    accentClass: 'bg-muted-foreground/40',
    order: 2,
  },
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  not_started: {
    value: 'not_started',
    label: 'Not Started',
    badgeClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground/50',
    order: 0,
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-info-muted text-info-foreground',
    dotClass: 'bg-info',
    order: 1,
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    badgeClass: 'bg-success-muted text-success-foreground',
    dotClass: 'bg-success',
    order: 2,
  },
}

export const PRIORITIES = Object.values(PRIORITY_META).sort((a, b) => a.order - b.order)
export const STATUSES = Object.values(STATUS_META).sort((a, b) => a.order - b.order)
