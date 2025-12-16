'use client'

import { useState } from 'react'
import { TaskWithAssignee, Profile } from '@/types/database'
import { TaskList } from '@/components/TaskList'
import { TaskFilters } from '@/components/TaskFilters'
import { CreateTaskButton } from '@/components/CreateTaskButton'
import { CalendarView } from '@/components/CalendarView'
import { Button } from '@/components/ui/button'
import { ListTodo, CheckCircle, Clock, AlertTriangle, Calendar, List, CircleDot, Circle, CloudRain } from 'lucide-react'

interface DashboardContentProps {
  tasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
  firstName: string
}

export function DashboardContent({ tasks, profiles, currentUserId, firstName }: DashboardContentProps) {
  const [view, setView] = useState<'calendar' | 'list'>('list')

  // Calculate stats
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const notStarted = tasks.filter((t) => t.status === 'not_started').length
  // Priority counts (only incomplete tasks)
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length
  const normal = tasks.filter((t) => t.priority === 'normal' && t.status !== 'completed').length
  const rainyDay = tasks.filter((t) => t.priority === 'rainy_day' && t.status !== 'completed').length

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#00467F] to-[#1669C9] rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}!</h1>
            <p className="text-white/70 mt-1">
              Here&apos;s what&apos;s happening with your tasks today.
            </p>
          </div>
          <CreateTaskButton profiles={profiles} currentUserId={currentUserId} />
        </div>

        {/* Stats Cards - Two rows: Status (top) and Priority (bottom) */}
        <div className="mt-5 space-y-3">
          {/* Status Row */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{total}</p>
                <p className="text-white/60 text-[10px] sm:text-xs">Total</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-400 rounded-full flex items-center justify-center">
                <CircleDot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{notStarted}</p>
                <p className="text-white/60 text-[10px] sm:text-xs">Not Started</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{inProgress}</p>
                <p className="text-white/60 text-[10px] sm:text-xs">In Progress</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{completed}</p>
                <p className="text-white/60 text-[10px] sm:text-xs">Completed</p>
              </div>
            </div>
          </div>
          {/* Priority Row - only incomplete tasks */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{urgent}</p>
                <p className="text-red-200 text-[10px] sm:text-xs">Urgent</p>
              </div>
            </div>
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{normal}</p>
                <p className="text-amber-200 text-[10px] sm:text-xs">Normal</p>
              </div>
            </div>
            <div className="bg-slate-500/20 border border-slate-400/30 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-400 rounded-full flex items-center justify-center">
                <CloudRain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-white">{rainyDay}</p>
                <p className="text-slate-300 text-[10px] sm:text-xs">Rainy Day</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <TaskFilters />
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'list'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              view === 'calendar'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List - Takes 2 columns on desktop, full width on mobile */}
          <div className="lg:col-span-2 order-1">
            <TaskList
              initialTasks={tasks}
              profiles={profiles}
              currentUserId={currentUserId}
            />
          </div>
          {/* Mini Calendar - Hidden on mobile, shows on desktop */}
          <div className="hidden lg:block lg:col-span-1 order-2">
            <CalendarView tasks={tasks} compact />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Takes 2 columns on desktop, full width on mobile */}
          <div className="lg:col-span-2 order-1">
            <CalendarView tasks={tasks} />
          </div>
          {/* Mini Task List - Hidden on mobile, shows on desktop */}
          <div className="hidden lg:block lg:col-span-1 order-2">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-[#3C3675] mb-3">Upcoming Tasks</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {tasks
                  .filter((t) => t.status !== 'completed')
                  .slice(0, 10)
                  .map((task) => (
                    <a
                      key={task.id}
                      href={`/dashboard/tasks/${task.id}`}
                      className="block p-3 rounded-lg border hover:border-[#1669C9] hover:bg-slate-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-slate-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-500 text-white' :
                          task.priority === 'normal' ? 'bg-amber-500 text-white' :
                          'bg-slate-400 text-white'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgent' : task.priority === 'normal' ? 'Normal' : 'Rainy Day'}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-slate-500">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                {tasks.filter((t) => t.status !== 'completed').length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No pending tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
