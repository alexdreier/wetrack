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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage and track your team tasks
          </p>
        </div>
        <CreateTaskButton profiles={profiles || []} currentUserId={user?.id || ''} />
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
