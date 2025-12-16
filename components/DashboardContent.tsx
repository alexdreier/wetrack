'use client'

import { useState } from 'react'
import { TaskWithAssignee, Profile } from '@/types/database'
import { TaskList } from '@/components/TaskList'
import { TaskFilters } from '@/components/TaskFilters'
import { CreateTaskButton } from '@/components/CreateTaskButton'
import { CalendarView } from '@/components/CalendarView'
import { Button } from '@/components/ui/button'
import { ListTodo, CheckCircle, Clock, AlertTriangle, Calendar, List } from 'lucide-react'

interface DashboardContentProps {
  tasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
  firstName: string
}

export function DashboardContent({ tasks, profiles, currentUserId, firstName }: DashboardContentProps) {
  const [view, setView] = useState<'calendar' | 'list'>('list')

  // Calculate stats
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length
  const total = tasks.length

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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-white/60 text-sm">Total</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#54B948] rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completed}</p>
              <p className="text-white/60 text-sm">Completed</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1669C9] rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{inProgress}</p>
              <p className="text-white/60 text-sm">In Progress</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{urgent}</p>
              <p className="text-white/60 text-sm">Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <TaskFilters />
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('list')}
            className={`gap-2 ${view === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            <List className="h-4 w-4" />
            List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('calendar')}
            className={`gap-2 ${view === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TaskList
              initialTasks={tasks}
              profiles={profiles}
              currentUserId={currentUserId}
            />
          </div>
          {/* Mini Calendar - Takes 1 column */}
          <div className="lg:col-span-1">
            <CalendarView tasks={tasks} compact />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CalendarView tasks={tasks} />
          </div>
          {/* Mini Task List - Takes 1 column */}
          <div className="lg:col-span-1">
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
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'next_week' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgent' : task.priority === 'next_week' ? 'Next Week' : 'Rainy Day'}
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
