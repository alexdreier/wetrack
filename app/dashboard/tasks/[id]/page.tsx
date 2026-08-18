import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TaskDetail } from '@/components/TaskDetail'

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: task, error },
    { data: comments },
    { data: attachments },
    { data: activities },
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
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select(`*, user:profiles(*)`)
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('attachments')
      .select(`*, user:profiles(*)`)
      .eq('task_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_log')
      .select(`*, user:profiles(*)`)
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('*'),
    supabase.auth.getUser(),
  ])

  if (error || !task) {
    notFound()
  }

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
