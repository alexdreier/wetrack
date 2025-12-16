import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TaskDetail } from '@/components/TaskDetail'

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assigned_to_fkey(*),
      creator:profiles!tasks_created_by_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error || !task) {
    notFound()
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: true })

  const { data: attachments } = await supabase
    .from('attachments')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: false })

  const { data: activities } = await supabase
    .from('activity_log')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('task_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: profiles } = await supabase.from('profiles').select('*')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <TaskDetail
      task={task}
      comments={comments || []}
      attachments={attachments || []}
      activities={activities || []}
      profiles={profiles || []}
      currentUserId={user?.id || ''}
    />
  )
}
