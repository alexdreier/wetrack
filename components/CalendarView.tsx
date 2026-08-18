'use client'

import { useMemo, useState } from 'react'
import { TaskWithAssignee } from '@/types/database'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn, parseLocalDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PRIORITIES, PRIORITY_META, STATUS_META } from '@/lib/task-meta'

interface CalendarViewProps {
  tasks: TaskWithAssignee[]
  compact?: boolean
}

function DayTaskList({ day, dayTasks }: { day: Date; dayTasks: TaskWithAssignee[] }) {
  return (
    <>
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium text-sm">{format(day, 'EEEE, MMMM d')}</h3>
        <p className="text-muted-foreground text-xs mt-0.5">
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        {dayTasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/tasks/${task.id}`}
            className="block p-2.5 rounded-md hover:bg-muted transition-colors group"
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  'size-2 rounded-full mt-1.5 shrink-0',
                  PRIORITY_META[task.priority].dotClass
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-sm font-medium',
                      STATUS_META[task.status].badgeClass
                    )}
                  >
                    {STATUS_META[task.status].label}
                  </span>
                  {task.time_estimate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {task.time_estimate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export function CalendarView({ tasks, compact = false }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calendarStart.getTime(), calendarEnd.getTime()]
  )

  // Bucket tasks by due date once instead of scanning the list per cell
  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithAssignee[]>()
    for (const task of tasks) {
      if (!task.due_date) continue
      const key = format(parseLocalDate(task.due_date), 'yyyy-MM-dd')
      const bucket = map.get(key)
      if (bucket) bucket.push(task)
      else map.set(key, [task])
    }
    return map
  }, [tasks])

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className={cn('flex items-center justify-between border-b', compact ? 'px-3 py-2' : 'px-4 py-3')}>
        <h2 className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
          {format(currentMonth, compact ? 'MMM yyyy' : 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {!compact && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {(compact
          ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        ).map((day, i) => (
          <div
            key={i}
            className={cn(
              'text-center text-xs font-medium text-muted-foreground',
              compact ? 'py-2' : 'py-2.5'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayTasks = tasksByDay.get(format(day, 'yyyy-MM-dd')) || []
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)

          if (compact) {
            const presentPriorities = PRIORITIES.filter((p) =>
              dayTasks.some((t) => t.priority === p.value)
            )

            const cellContent = (
              <div
                className={cn(
                  'h-12 border-b border-r flex flex-col items-center justify-center transition-colors',
                  idx % 7 === 6 && 'border-r-0',
                  !isCurrentMonth && 'bg-muted/30',
                  dayTasks.length > 0 && 'cursor-pointer hover:bg-muted/50'
                )}
              >
                <span
                  className={cn(
                    'text-xs flex items-center justify-center size-6 rounded-full font-medium',
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground'
                      : !isCurrentMonth
                        ? 'text-muted-foreground/40'
                        : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {presentPriorities.map((p) => (
                      <span key={p.value} className={cn('size-1.5 rounded-full', p.dotClass)} />
                    ))}
                  </div>
                )}
              </div>
            )

            if (dayTasks.length > 0) {
              return (
                <Popover key={idx}>
                  <PopoverTrigger asChild>{cellContent}</PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="center">
                    <DayTaskList day={day} dayTasks={dayTasks} />
                  </PopoverContent>
                </Popover>
              )
            }
            return <div key={idx}>{cellContent}</div>
          }

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[96px] sm:min-h-[115px] border-b border-r p-1.5 sm:p-2 transition-colors',
                idx % 7 === 6 && 'border-r-0',
                !isCurrentMonth && 'bg-muted/30',
                isCurrentDay && 'bg-accent/50'
              )}
            >
              <span
                className={cn(
                  'text-xs sm:text-sm size-6 sm:size-7 flex items-center justify-center rounded-full font-medium mb-1',
                  isCurrentDay
                    ? 'bg-primary text-primary-foreground'
                    : !isCurrentMonth
                      ? 'text-muted-foreground/40'
                      : 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-1.5 py-1 rounded-sm truncate transition-colors hover:bg-muted',
                      task.status === 'completed' && 'opacity-50 line-through'
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full shrink-0',
                        PRIORITY_META[task.priority].dotClass
                      )}
                    />
                    <span className="truncate">{task.title}</span>
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="block text-xs text-muted-foreground px-1.5 py-0.5 hover:text-foreground transition-colors">
                        +{dayTasks.length - 3} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                      <DayTaskList day={day} dayTasks={dayTasks} />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="px-4 py-2.5 border-t bg-muted/30 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {PRIORITIES.map((p) => (
            <div key={p.value} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', p.dotClass)} />
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
