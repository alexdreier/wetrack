import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/DashboardContent'
import { TasksProvider } from '@/components/TasksProvider'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: tasks },
    { data: profiles },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select(
        `
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `
      )
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
    supabase.auth.getUser(),
  ])

  const profile = profiles?.find((p) => p.id === user?.id)

  return (
    <TasksProvider
      initialTasks={tasks || []}
      profiles={profiles || []}
      currentUserId={user?.id || ''}
    >
      <DashboardContent firstName={profile?.full_name?.split(' ')[0] || 'there'} />
    </TasksProvider>
  )
}
