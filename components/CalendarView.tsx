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
}

const priorityColors = {
  urgent: 'bg-red-500',
  next_week: 'bg-yellow-500',
  rainy_day: 'bg-blue-500',
}

export function CalendarView({ tasks }: CalendarViewProps) {
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
      <div className="bg-gradient-to-r from-[#00467F] to-[#1669C9] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="text-white hover:bg-white/20 text-xs"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-slate-500"
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

      {/* Legend */}
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
    </div>
  )
}
