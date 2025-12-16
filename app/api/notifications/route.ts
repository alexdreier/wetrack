import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Profile, TaskWithAssignee } from '@/types/database'
import {
  sendEmail,
  taskAssignedEmail,
  taskCreatedEmail,
  newCommentEmail,
  statusChangedEmail,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, taskId, userId, data } = body

    console.log('Notification request:', { type, taskId, userId, data })

    const supabase = await createClient()

    // Get task details
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

    console.log('Task found:', task ? { id: task.id, title: task.title, assignee: task.assignee?.email, creator: task.creator?.email } : 'null')

    if (!task) {
      console.log('Task not found for taskId:', taskId)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Get the user who performed the action
    const { data: actorData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const actor = actorData as Profile | null
    const actorName = actor?.full_name || 'Someone'
    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks/${taskId}`

    switch (type) {
      case 'task_created': {
        // Notify all other users about the new task
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)

        if (allProfiles) {
          for (const profile of allProfiles) {
            // Check master toggle AND individual preference
            if (profile.email_notifications && profile.notify_on_assignment) {
              const email = taskCreatedEmail(task.title, actorName, data?.priority || task.priority, taskUrl)
              await sendEmail({
                to: profile.email,
                ...email,
              })
            }
          }
        }
        break
      }

      case 'task_assigned': {
        // Notify the assignee (if not the same person who assigned)
        console.log('task_assigned check:', {
          hasAssignee: !!task.assignee,
          assigneeId: task.assignee?.id,
          actorId: userId,
          emailNotifications: task.assignee?.email_notifications,
          notifyOnAssignment: task.assignee?.notify_on_assignment,
        })
        // Check master toggle AND individual preference
        if (task.assignee && task.assignee.id !== userId && task.assignee.email_notifications && task.assignee.notify_on_assignment) {
          console.log('Sending assignment email to:', task.assignee.email)
          const email = taskAssignedEmail(task.title, actorName, taskUrl)
          await sendEmail({
            to: task.assignee.email,
            ...email,
          })
        } else {
          console.log('Skipping assignment notification - conditions not met')
        }
        break
      }

      case 'comment_added': {
        // Notify task creator and assignee (except the commenter)
        const notifyUsers = []

        // Check master toggle AND individual preference
        if (task.creator && task.creator.id !== userId && task.creator.email_notifications && task.creator.notify_on_comments) {
          notifyUsers.push(task.creator)
        }

        if (
          task.assignee &&
          task.assignee.id !== userId &&
          task.assignee.id !== task.creator?.id &&
          task.assignee.email_notifications &&
          task.assignee.notify_on_comments
        ) {
          notifyUsers.push(task.assignee)
        }

        for (const user of notifyUsers) {
          const email = newCommentEmail(
            task.title,
            actorName,
            data.comment || '',
            taskUrl
          )
          await sendEmail({
            to: user.email,
            ...email,
          })
        }
        break
      }

      case 'status_changed': {
        // Notify task creator and assignee (except the person who changed it)
        const notifyUsers = []

        // Check master toggle AND individual preference
        if (task.creator && task.creator.id !== userId && task.creator.email_notifications && task.creator.notify_on_status_change) {
          notifyUsers.push(task.creator)
        }

        if (
          task.assignee &&
          task.assignee.id !== userId &&
          task.assignee.id !== task.creator?.id &&
          task.assignee.email_notifications &&
          task.assignee.notify_on_status_change
        ) {
          notifyUsers.push(task.assignee)
        }

        for (const user of notifyUsers) {
          const email = statusChangedEmail(
            task.title,
            actorName,
            data.newStatus || task.status,
            taskUrl
          )
          await sendEmail({
            to: user.email,
            ...email,
          })
        }
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
