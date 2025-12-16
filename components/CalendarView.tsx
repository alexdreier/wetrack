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
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'

interface CalendarViewProps {
  tasks: TaskWithAssignee[]
  compact?: boolean
}

const priorityColors = {
  urgent: 'bg-gradient-to-r from-red-500 to-red-600',
  normal: 'bg-gradient-to-r from-amber-500 to-amber-600',
  rainy_day: 'bg-gradient-to-r from-slate-400 to-slate-500',
}

const priorityDots = {
  urgent: 'bg-red-500',
  normal: 'bg-amber-500',
  rainy_day: 'bg-slate-400',
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#00467F] to-[#1669C9] ${compact ? 'px-4 py-3' : 'px-6 py-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!compact && <Calendar className="h-5 w-5 text-white/80" />}
            <h2 className={`font-semibold text-white ${compact ? 'text-base' : 'text-xl tracking-tight'}`}>
              {format(currentMonth, compact ? 'MMM yyyy' : 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={`text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors ${compact ? 'h-7 w-7' : 'h-9 w-9'} flex items-center justify-center`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {!compact && (
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors text-xs font-medium px-3 py-1.5"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className={`text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors ${compact ? 'h-7 w-7' : 'h-9 w-9'} flex items-center justify-center`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-100">
        {(compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
          <div
            key={i}
            className={`text-center text-xs font-semibold text-slate-500 uppercase tracking-wider ${compact ? 'py-2' : 'py-3'}`}
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
          const hasNormal = dayTasks.some((t) => t.priority === 'normal')
          const hasRainyDay = dayTasks.some((t) => t.priority === 'rainy_day')

          if (compact) {
            return (
              <div
                key={idx}
                className={`h-11 border-b border-r border-slate-100 flex flex-col items-center justify-center relative transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <span
                  className={`text-xs flex items-center justify-center w-7 h-7 rounded-full font-medium transition-colors ${
                    isCurrentDay
                      ? 'bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white shadow-sm'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />}
                    {hasNormal && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />}
                    {hasRainyDay && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm" />}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              key={idx}
              className={`min-h-[110px] border-b border-r border-slate-100 p-2 transition-colors ${
                !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/50'
              } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium transition-colors ${
                    isCurrentDay
                      ? 'bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white shadow-sm'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-600 hover:bg-slate-100'
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
                    className={`block text-[11px] px-2 py-1 rounded-md truncate text-white font-medium shadow-sm ${
                      priorityColors[task.priority]
                    } hover:shadow-md hover:scale-[1.02] transition-all duration-150`}
                  >
                    {task.title}
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[11px] text-slate-500 font-medium px-2 hover:text-slate-700 cursor-pointer">
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
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-5 text-xs">
          <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Priority</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
            <span className="text-slate-600 font-medium">Urgent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-slate-600 font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
            <span className="text-slate-600 font-medium">Rainy Day</span>
          </div>
        </div>
      )}
    </div>
  )
}
