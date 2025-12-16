'use client'

import { useState } from 'react'
import { TaskWithAssignee } from '@/types/database'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface CalendarViewProps {
  tasks: TaskWithAssignee[]
  compact?: boolean
}

const priorityColors = {
  urgent: 'bg-red-500',
  next_week: 'bg-yellow-500',
  rainy_day: 'bg-blue-500',
}

export function CalendarView({ tasks, compact = false }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false
      return isSameDay(new Date(task.due_date), day)
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#00467F] to-[#1669C9] ${compact ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-white ${compact ? 'text-base' : 'text-lg'}`}>
            {format(currentMonth, compact ? 'MMM yyyy' : 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={`text-white hover:bg-white/20 ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="text-white hover:bg-white/20 text-xs"
              >
                Today
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className={`text-white hover:bg-white/20 ${compact ? 'h-7 w-7' : 'h-8 w-8'}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b bg-slate-50">
        {(compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium text-slate-500 ${compact ? 'py-1.5' : 'py-2'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayTasks = getTasksForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)
          const hasUrgent = dayTasks.some((t) => t.priority === 'urgent')
          const hasNextWeek = dayTasks.some((t) => t.priority === 'next_week')
          const hasRainyDay = dayTasks.some((t) => t.priority === 'rainy_day')

          if (compact) {
            return (
              <div
                key={idx}
                className={`h-10 border-b border-r flex flex-col items-center justify-center relative ${
                  !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <span
                  className={`text-xs flex items-center justify-center w-6 h-6 rounded-full ${
                    isCurrentDay
                      ? 'bg-[#00467F] text-white font-bold'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {hasNextWeek && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                    {hasRainyDay && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              key={idx}
              className={`min-h-[100px] border-b border-r p-1 ${
                !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? 'bg-[#00467F] text-white font-bold'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className={`block text-xs px-1.5 py-0.5 rounded truncate text-white ${
                      priorityColors[task.priority]
                    } hover:opacity-80 transition-opacity`}
                  >
                    {task.title}
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-xs text-slate-500 px-1.5">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend - only show in non-compact mode */}
      {!compact && (
        <div className="px-4 py-3 border-t bg-slate-50 flex items-center gap-4 text-xs">
          <span className="text-slate-500">Priority:</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-600">Urgent</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-slate-600">Next Week</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-600">Rainy Day</span>
          </div>
        </div>
      )}
    </div>
  )
}
