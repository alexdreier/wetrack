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
import { parseLocalDate } from '@/lib/utils'

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
      return isSameDay(parseLocalDate(task.due_date), day)
    })
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r from-[#00467F] via-[#0d5a9e] to-[#1669C9] ${compact ? 'px-4 py-3' : 'px-6 py-5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!compact && (
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            )}
            <h2 className={`font-semibold text-white ${compact ? 'text-base' : 'text-xl tracking-tight'}`}>
              {format(currentMonth, compact ? 'MMM yyyy' : 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className={`text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 ${compact ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {!compact && (
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 text-xs font-medium px-3 py-1.5"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className={`text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 ${compact ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 bg-gradient-to-b from-slate-50 to-slate-50/50 border-b border-slate-100">
        {(compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
          <div
            key={i}
            className={`text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${compact ? 'py-2.5' : 'py-3'}`}
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
                className={`h-12 border-b border-r border-slate-100/80 flex flex-col items-center justify-center relative transition-all duration-200 ${
                  !isCurrentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-blue-50/30'
                } ${idx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <span
                  className={`text-xs flex items-center justify-center w-7 h-7 rounded-full font-medium transition-all duration-200 ${
                    isCurrentDay
                      ? 'bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white shadow-md ring-2 ring-blue-200'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {hasUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ring-1 ring-red-200" />}
                    {hasNormal && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-amber-200" />}
                    {hasRainyDay && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 ring-1 ring-slate-200" />}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div
              key={idx}
              className={`min-h-[115px] border-b border-r border-slate-100/80 p-2 transition-all duration-200 ${
                !isCurrentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-blue-50/20'
              } ${idx % 7 === 6 ? 'border-r-0' : ''} ${isCurrentDay ? 'bg-blue-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm w-8 h-8 flex items-center justify-center rounded-full font-semibold transition-all duration-200 ${
                    isCurrentDay
                      ? 'bg-gradient-to-br from-[#00467F] to-[#1669C9] text-white shadow-md ring-2 ring-blue-200'
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
                    className={`block text-[11px] px-2 py-1.5 rounded-lg truncate text-white font-medium shadow-sm ${
                      priorityColors[task.priority]
                    } hover:shadow-md hover:translate-x-0.5 transition-all duration-200`}
                  >
                    {task.title}
                  </Link>
                ))}
                {dayTasks.length > 3 && (
                  <span className="block text-[10px] text-slate-400 font-semibold px-2 py-1 hover:text-slate-600 cursor-pointer transition-colors">
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
        <div className="px-5 py-3.5 border-t border-slate-100/80 bg-gradient-to-b from-slate-50/50 to-white flex items-center gap-6 text-xs">
          <span className="text-slate-400 font-semibold uppercase tracking-widest text-[10px]">Priority</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-rose-500 ring-2 ring-red-100" />
            <span className="text-slate-600 font-medium">Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-100" />
            <span className="text-slate-600 font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 ring-2 ring-slate-100" />
            <span className="text-slate-600 font-medium">Rainy Day</span>
          </div>
        </div>
      )}
    </div>
  )
}
