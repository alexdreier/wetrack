import { createClient } from '@/lib/supabase/server'
import { TaskList } from '@/components/TaskList'
import { TaskFilters } from '@/components/TaskFilters'
import { CreateTaskButton } from '@/components/CreateTaskButton'
import { CalendarView } from '@/components/CalendarView'
import { ListTodo, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(*),
      creator:profiles!tasks_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase.from('profiles').select('*')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id || '')
    .single()

  // Calculate stats
  const allTasks = tasks || []
  const completed = allTasks.filter((t: { status: string }) => t.status === 'completed').length
  const inProgress = allTasks.filter((t: { status: string }) => t.status === 'in_progress').length
  const urgent = allTasks.filter((t: { priority: string; status: string }) => t.priority === 'urgent' && t.status !== 'completed').length
  const total = allTasks.length

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

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
          <CreateTaskButton profiles={profiles || []} currentUserId={user?.id || ''} />
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
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
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

      {/* Calendar View */}
      <CalendarView tasks={tasks || []} />

      {/* Task List Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#3C3675]">All Tasks</h2>
        <TaskFilters />
        <TaskList
          initialTasks={tasks || []}
          profiles={profiles || []}
          currentUserId={user?.id || ''}
        />
      </div>
    </div>
  )
}
