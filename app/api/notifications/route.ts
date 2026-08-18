import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Profile, TaskWithAssignee } from '@/types/database'
import {
  sendEmail,
  taskAssignedEmail,
  taskCreatedEmail,
  newCommentEmail,
  statusChangedEmail,
} from '@/lib/email'

type EmailJob = { to: string; subject: string; html: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // The actor is the authenticated user — never trusted from the body
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const body = await request.json()
    const { type, taskId, data } = body

    const { data: taskData } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(*),
        creator:profiles!tasks_created_by_fkey(*)
      `)
      .eq('id', taskId)
      .single()

    const task = taskData as TaskWithAssignee | null
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { data: actorData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const actor = actorData as Profile | null
    const actorName = actor?.full_name || 'Someone'
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${taskId}`

    const jobs: EmailJob[] = []

    // Creator + assignee recipients for comment/status events, minus the actor
    function taskWatchers(pref: 'notify_on_comments' | 'notify_on_status_change') {
      const users: Profile[] = []
      if (task!.creator && task!.creator.id !== userId && task!.creator.email_notifications && task!.creator[pref]) {
        users.push(task!.creator)
      }
      if (
        task!.assignee &&
        task!.assignee.id !== userId &&
        task!.assignee.id !== task!.creator?.id &&
        task!.assignee.email_notifications &&
        task!.assignee[pref]
      ) {
        users.push(task!.assignee)
      }
      return users
    }

    switch (type) {
      case 'task_created': {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)

        for (const profile of allProfiles || []) {
          if (profile.email_notifications && profile.notify_on_assignment) {
            const email = taskCreatedEmail(task.title, actorName, data?.priority || task.priority, taskUrl)
            jobs.push({ to: profile.email, ...email })
          }
        }
        break
      }

      case 'task_assigned': {
        if (task.assignee && task.assignee.id !== userId && task.assignee.email_notifications && task.assignee.notify_on_assignment) {
          const email = taskAssignedEmail(task.title, actorName, taskUrl)
          jobs.push({ to: task.assignee.email, ...email })
        }
        break
      }

      case 'comment_added': {
        for (const watcher of taskWatchers('notify_on_comments')) {
          const email = newCommentEmail(task.title, actorName, data?.comment || '', taskUrl)
          jobs.push({ to: watcher.email, ...email })
        }
        break
      }

      case 'status_changed': {
        for (const watcher of taskWatchers('notify_on_status_change')) {
          const email = statusChangedEmail(task.title, actorName, data?.newStatus || task.status, taskUrl)
          jobs.push({ to: watcher.email, ...email })
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 })
    }

    if (jobs.length > 0) {
      // Send after the response is flushed so the caller never waits on SMTP
      after(async () => {
        const results = await Promise.allSettled(jobs.map((job) => sendEmail(job)))
        for (const result of results) {
          if (result.status === 'rejected') {
            console.error('Notification email failed:', result.reason)
          }
        }
      })
    }

    return NextResponse.json({ success: true, queued: jobs.length })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
