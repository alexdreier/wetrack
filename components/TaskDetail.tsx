'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TaskWithAssignee, Profile, Task } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ArrowLeft, CornerDownRight, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SubtaskList } from './SubtaskList'
import { CommentSection } from './CommentSection'
import { FileUpload } from './FileUpload'
import { ActivityFeed } from './ActivityFeed'
import { RichTextDisplay } from './RichTextDisplay'
import { TaskProperties } from './TaskProperties'
import { RichTextEditor } from './RichTextEditor'
import { cn } from '@/lib/utils'
import { PRIORITY_META, STATUS_META } from '@/lib/task-meta'
import {
  useTaskDetail,
  CommentWithUser,
  AttachmentWithUser,
  ActivityWithUser,
} from '@/lib/hooks/use-task-detail'

interface TaskDetailProps {
  task: TaskWithAssignee
  subtasks: TaskWithAssignee[]
  parent: { id: string; title: string } | null
  comments: CommentWithUser[]
  attachments: AttachmentWithUser[]
  activities: ActivityWithUser[]
  profiles: Profile[]
  currentUserId: string
}

type EditForm = { title: string; notes: string }

export function TaskDetail({
  task: initialTask,
  subtasks: initialSubtasks,
  parent,
  comments: initialComments,
  attachments: initialAttachments,
  activities: initialActivities,
  profiles,
  currentUserId,
}: TaskDetailProps) {
  const {
    task,
    subtasks,
    comments,
    attachments,
    activities,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    removeSubtask,
    addComment,
    removeComment,
    addAttachment,
    removeAttachment,
  } = useTaskDetail({
    initialTask,
    initialSubtasks,
    initialComments,
    initialAttachments,
    initialActivities,
    profiles,
  })

  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [editForm, setEditForm] = useState<EditForm>({
    title: initialTask.title,
    notes: initialTask.notes || '',
  })
  const router = useRouter()

  const priority = PRIORITY_META[task.priority]
  const status = STATUS_META[task.status]

  function startEditing() {
    setEditForm({ title: task.title, notes: task.notes || '' })
    setIsEditing(true)
  }

  // Single write path: optimistic update, then activity log + notifications
  async function applyPatch(patch: Partial<Task>, changes: string[]) {
    const ok = await updateTask(patch)
    if (!ok) return false

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

    if (changes.includes('status') && patch.status) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'status_changed',
          taskId: task.id,
          data: { newStatus: patch.status },
        }),
      })
    }
    if (changes.includes('assigned_to') && patch.assigned_to && patch.assigned_to !== currentUserId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_assigned', taskId: task.id }),
      })
    }
    return true
  }

  async function handleSave() {
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

    if (changes.length === 0) {
      setIsEditing(false)
      return
    }

    setIsEditing(false)
    const ok = await applyPatch(patch, changes)
    if (!ok) setIsEditing(true)
  }

  async function handleDelete() {
    const ok = await deleteTask()
    if (ok) {
      toast.success('Task deleted')
      router.push('/dashboard')
    }
  }

  const doneSubtasks = subtasks.filter((t) => t.status === 'completed').length

  return (
    <div className="space-y-6">
      {parent && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground -mb-2">
          <CornerDownRight className="size-3.5" />
          Subtask of{' '}
          <Link href={`/dashboard/tasks/${parent.id}`} className="text-primary hover:underline">
            {parent.title}
          </Link>
        </div>
      )}
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
                      &ldquo;{task.title}&rdquo; and its subtasks, comments, attachments, and
                      activity will be permanently deleted.
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
            <CardContent className="space-y-5">
              <TaskProperties task={task} profiles={profiles} onPatch={applyPatch} />

              {isEditing ? (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <RichTextEditor
                    content={editForm.notes}
                    onChange={(notes) => setEditForm({ ...editForm, notes })}
                    placeholder="Add notes..."
                    minHeight="160px"
                  />
                </div>
              ) : task.notes ? (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <div className="mt-1">
                    <RichTextDisplay content={task.notes} />
                  </div>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Add notes
                </button>
              )}
            </CardContent>
          </Card>

          {!task.parent_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Subtasks
                  {subtasks.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {doneSubtasks}/{subtasks.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubtaskList
                  parentId={task.id}
                  subtasks={subtasks}
                  profiles={profiles}
                  currentUserId={currentUserId}
                  onAdd={addSubtask}
                  onUpdate={updateSubtask}
                  onRemove={removeSubtask}
                />
              </CardContent>
            </Card>
          )}

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
