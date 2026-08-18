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
    { data: subtasks },
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
      .from('tasks')
      .select(
        `
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `
      )
      .eq('parent_id', id)
      .order('created_at', { ascending: true }),
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

  // Breadcrumb for subtasks; a second tiny query only when needed
  let parent: { id: string; title: string } | null = null
  if (task.parent_id) {
    const { data: parentRow } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('id', task.parent_id)
      .single()
    parent = parentRow
  }

  return (
    <TaskDetail
      task={task}
      subtasks={subtasks || []}
      parent={parent}
      comments={comments || []}
      attachments={attachments || []}
      activities={activities || []}
      profiles={profiles || []}
      currentUserId={user?.id || ''}
    />
  )
}
