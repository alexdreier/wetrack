import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/DashboardContent'

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

  return (
    <DashboardContent
      tasks={tasks || []}
      profiles={profiles || []}
      currentUserId={user?.id || ''}
      firstName={profile?.full_name?.split(' ')[0] || 'there'}
    />
  )
}
