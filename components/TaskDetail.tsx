'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { TaskWithAssignee, Profile, Task } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { CommentSection } from './CommentSection'
import { FileUpload } from './FileUpload'
import { ActivityFeed } from './ActivityFeed'
import { RichTextDisplay } from './RichTextDisplay'
import { TaskForm, TaskFormValues, validateTaskDates } from './TaskForm'
import { cn, parseLocalDate, getInitials } from '@/lib/utils'
import { PRIORITY_META, STATUS_META } from '@/lib/task-meta'
import {
  useTaskDetail,
  CommentWithUser,
  AttachmentWithUser,
  ActivityWithUser,
} from '@/lib/hooks/use-task-detail'

interface TaskDetailProps {
  task: TaskWithAssignee
  comments: CommentWithUser[]
  attachments: AttachmentWithUser[]
  activities: ActivityWithUser[]
  profiles: Profile[]
  currentUserId: string
}

function formValuesFromTask(task: TaskWithAssignee): TaskFormValues {
  return {
    title: task.title,
    notes: task.notes || '',
    priority: task.priority,
    status: task.status,
    time_estimate: task.time_estimate || '',
    start_date: task.start_date || '',
    due_date: task.due_date || '',
    assigned_to: task.assigned_to || 'unassigned',
  }
}

export function TaskDetail({
  task: initialTask,
  comments: initialComments,
  attachments: initialAttachments,
  activities: initialActivities,
  profiles,
  currentUserId,
}: TaskDetailProps) {
  const {
    task,
    comments,
    attachments,
    activities,
    updateTask,
    deleteTask,
    addComment,
    removeComment,
    addAttachment,
    removeAttachment,
  } = useTaskDetail({
    initialTask,
    initialComments,
    initialAttachments,
    initialActivities,
    profiles,
  })

  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [editForm, setEditForm] = useState<TaskFormValues>(() => formValuesFromTask(initialTask))
  const router = useRouter()

  const priority = PRIORITY_META[task.priority]
  const status = STATUS_META[task.status]

  function startEditing() {
    setEditForm(formValuesFromTask(task))
    setIsEditing(true)
  }

  async function handleSave() {
    const dateError = validateTaskDates(editForm)
    if (dateError) {
      toast.error(dateError)
      return
    }

    const patch: Partial<Task> = {}
    const changes: string[] = []

    if (editForm.title !== task.title && editForm.title.trim()) {
      patch.title = editForm.title
      changes.push('title')
    }
    if (editForm.notes !== (task.notes || '')) {
      patch.notes = editForm.notes || null
      changes.push('notes')
    }
    if (editForm.priority !== task.priority) {
      patch.priority = editForm.priority
      changes.push('priority')
    }
    if (editForm.status !== task.status) {
      patch.status = editForm.status
      changes.push('status')
    }
    if (editForm.time_estimate !== (task.time_estimate || '')) {
      patch.time_estimate = editForm.time_estimate || null
      changes.push('time_estimate')
    }
    if (editForm.start_date !== (task.start_date || '')) {
      patch.start_date = editForm.start_date || null
      changes.push('start_date')
    }
    if (editForm.due_date !== (task.due_date || '')) {
      patch.due_date = editForm.due_date || null
      changes.push('due_date')
    }
    if (editForm.assigned_to !== (task.assigned_to || 'unassigned')) {
      patch.assigned_to = editForm.assigned_to === 'unassigned' ? null : editForm.assigned_to
      changes.push('assigned_to')
    }

    if (changes.length === 0) {
      setIsEditing(false)
      return
    }

    setIsEditing(false)
    const ok = await updateTask(patch)
    if (!ok) {
      setIsEditing(true)
      return
    }

    const supabase = createClient()
    supabase
      .from('activity_log')
      .insert({
        task_id: task.id,
        user_id: currentUserId,
        action: 'updated',
        details: { changes },
      })
      .then(({ error }) => {
        if (error) console.error('Failed to log activity:', error)
      })

    if (changes.includes('status')) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_changed',
          taskId: task.id,
          data: { newStatus: editForm.status },
        }),
      })
    }
    if (
      changes.includes('assigned_to') &&
      editForm.assigned_to !== 'unassigned' &&
      editForm.assigned_to !== currentUserId
    ) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_assigned', taskId: task.id }),
      })
    }
  }

  async function handleDelete() {
    const ok = await deleteTask()
    if (ok) {
      toast.success('Task deleted')
      router.push('/dashboard')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          {isEditing ? (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="text-lg font-semibold sm:max-w-md"
              aria-label="Task title"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">
              {task.title}
            </h1>
          )}
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-md', priority.badgeClass)}>
            {priority.label}
          </span>
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-md', status.badgeClass)}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={startEditing} aria-label="Edit task">
                <Edit className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label="Delete task"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &ldquo;{task.title}&rdquo; and its comments, attachments, and activity will
                      be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <TaskForm
                  values={editForm}
                  onChange={setEditForm}
                  profiles={profiles}
                  showTitle={false}
                  notesMinHeight="160px"
                />
              ) : (
                <div className="space-y-4">
                  {task.notes && (
                    <div>
                      <Label className="text-muted-foreground">Notes</Label>
                      <div className="mt-1">
                        <RichTextDisplay content={task.notes} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {task.start_date && (
                      <div>
                        <Label className="text-muted-foreground">Start Date</Label>
                        <p className="mt-1 flex items-center gap-2 text-sm">
                          <Calendar className="size-4 text-muted-foreground" />
                          {format(parseLocalDate(task.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {task.due_date && (
                      <div>
                        <Label className="text-muted-foreground">Due Date</Label>
                        <p className="mt-1 flex items-center gap-2 text-sm">
                          <Calendar className="size-4 text-muted-foreground" />
                          {format(parseLocalDate(task.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {task.time_estimate && (
                      <div>
                        <Label className="text-muted-foreground">Time Estimate</Label>
                        <p className="mt-1 flex items-center gap-2 text-sm">
                          <Clock className="size-4 text-muted-foreground" />
                          {task.time_estimate}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Lead</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <Avatar className="size-6">
                              <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                                {getInitials(task.assignee.full_name, task.assignee.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assignee.full_name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
              <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4" id="comments">
              <CommentSection
                taskId={task.id}
                comments={comments}
                currentUserId={currentUserId}
                onAdd={addComment}
                onRemove={removeComment}
              />
            </TabsContent>
            <TabsContent value="attachments" className="mt-4" id="attachments">
              <FileUpload
                taskId={task.id}
                attachments={attachments}
                currentUserId={currentUserId}
                onAdd={addAttachment}
                onRemove={removeAttachment}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
