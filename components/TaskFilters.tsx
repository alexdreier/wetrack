'use client'

import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useTasks, TaskFiltersState, SortKey } from './TasksProvider'
import { PRIORITIES, STATUSES } from '@/lib/task-meta'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'manual', label: 'My order' },
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Newest' },
  { value: 'due_date', label: 'Due date' },
  { value: 'lead', label: 'Lead' },
  { value: 'priority', label: 'Priority' },
]

export function TaskFilters() {
  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    statusCounts,
    priorityCounts,
  } = useTasks()
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={searchRef}
          data-search-input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setFilter('search', '')
              e.currentTarget.blur()
            }
          }}
          className="pl-8 h-8 w-full sm:w-[200px]"
        />
      </div>

      <Select
        value={filters.assignee}
        onValueChange={(v) => setFilter('assignee', v as TaskFiltersState['assignee'])}
      >
        <SelectTrigger size="sm" className="w-full sm:w-auto" aria-label="Assignee filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tasks</SelectItem>
          <SelectItem value="mine">My tasks</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => setFilter('status', v as TaskFiltersState['status'])}
      >
        <SelectTrigger size="sm" className="w-full sm:w-auto" aria-label="Status filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label} ({statusCounts[s.value]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => setFilter('priority', v as TaskFiltersState['priority'])}
      >
        <SelectTrigger size="sm" className="w-full sm:w-auto" aria-label="Priority filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label} ({priorityCounts[p.value]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sort} onValueChange={(v) => setFilter('sort', v as SortKey)}>
        <SelectTrigger size="sm" className="w-full sm:w-auto" aria-label="Sort order">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground gap-1.5"
        >
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  )
}
