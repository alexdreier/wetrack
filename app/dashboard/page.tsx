import { createClient } from '@/lib/supabase/server'
import { TaskList } from '@/components/TaskList'
import { TaskFilters } from '@/components/TaskFilters'
import { CreateTaskButton } from '@/components/CreateTaskButton'

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
      <div className="bg-gradient-to-r from-[#00467F] to-[#1669C9] rounded-xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName}!</h1>
            <p className="text-white/70 mt-1">
              Here&apos;s what&apos;s happening with your tasks today.
            </p>
          </div>
          <CreateTaskButton profiles={profiles || []} currentUserId={user?.id || ''} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-white/60 text-sm">Total</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold text-[#54B948]">{completed}</p>
            <p className="text-white/60 text-sm">Completed</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold text-yellow-400">{inProgress}</p>
            <p className="text-white/60 text-sm">In Progress</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold text-red-400">{urgent}</p>
            <p className="text-white/60 text-sm">Urgent</p>
          </div>
        </div>
      </div>

      <TaskFilters />

      <TaskList
        initialTasks={tasks || []}
        profiles={profiles || []}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}
