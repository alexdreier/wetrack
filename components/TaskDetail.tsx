'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  TaskWithAssignee,
  Comment,
  Attachment,
  ActivityLog,
  Profile,
  Priority,
  TaskStatus,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Send,
  Paperclip,
  Download,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { CommentSection } from './CommentSection'
import { FileUpload } from './FileUpload'
import { ActivityFeed } from './ActivityFeed'

interface TaskDetailProps {
  task: TaskWithAssignee
  comments: (Comment & { user: Profile })[]
  attachments: (Attachment & { user: Profile })[]
  activities: (ActivityLog & { user: Profile })[]
  profiles: Profile[]
  currentUserId: string
}

const priorityConfig = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  next_week: { label: 'Next Week', className: 'bg-yellow-100 text-yellow-700' },
  rainy_day: { label: 'Rainy Day', className: 'bg-[#00467F]/10 text-[#00467F]' },
}

const statusConfig = {
  not_started: { label: 'Not Started', className: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', className: 'bg-[#1669C9]/10 text-[#1669C9]' },
  completed: { label: 'Completed', className: 'bg-[#54B948]/10 text-[#54B948]' },
}

export function TaskDetail({
  task: initialTask,
  comments: initialComments,
  attachments: initialAttachments,
  activities: initialActivities,
  profiles,
  currentUserId,
}: TaskDetailProps) {
  const [task, setTask] = useState(initialTask)
  const [comments, setComments] = useState(initialComments)
  const [attachments, setAttachments] = useState(initialAttachments)
  const [activities, setActivities] = useState(initialActivities)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [editForm, setEditForm] = useState({
    title: task.title,
    notes: task.notes || '',
    priority: task.priority,
    status: task.status,
    time_estimate: task.time_estimate || '',
    start_date: task.start_date || '',
    due_date: task.due_date || '',
    assigned_to: task.assigned_to || 'unassigned',
  })

  // Real-time subscriptions
  useEffect(() => {
    const taskChannel = supabase
      .channel(`task-${task.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${task.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('tasks')
            .select(`
              *,
              assignee:profiles!tasks_assigned_to_fkey(*),
              creator:profiles!tasks_created_by_fkey(*)
            `)
            .eq('id', task.id)
            .single()
          if (data) setTask(data)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${task.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('comments')
            .select(`*, user:profiles(*)`)
            .eq('task_id', task.id)
            .order('created_at', { ascending: true })
          if (data) setComments(data as (Comment & { user: Profile })[])
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attachments',
          filter: `task_id=eq.${task.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('attachments')
            .select(`*, user:profiles(*)`)
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
          if (data) setAttachments(data as (Attachment & { user: Profile })[])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `task_id=eq.${task.id}`,
        },
        async () => {
          const { data } = await supabase
            .from('activity_log')
            .select(`*, user:profiles(*)`)
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
            .limit(20)
          if (data) setActivities(data as (ActivityLog & { user: Profile })[])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(taskChannel)
    }
  }, [supabase, task.id])

  async function handleSave() {
    const updates: Record<string, unknown> = {}
    const changes: string[] = []

    if (editForm.title !== task.title) {
      updates.title = editForm.title
      changes.push('title')
    }
    if (editForm.notes !== (task.notes || '')) {
      updates.notes = editForm.notes || null
      changes.push('notes')
    }
    if (editForm.priority !== task.priority) {
      updates.priority = editForm.priority
      changes.push('priority')
    }
    if (editForm.status !== task.status) {
      updates.status = editForm.status
      changes.push('status')
    }
    if (editForm.time_estimate !== (task.time_estimate || '')) {
      updates.time_estimate = editForm.time_estimate || null
      changes.push('time_estimate')
    }
    if (editForm.start_date !== (task.start_date || '')) {
      updates.start_date = editForm.start_date || null
      changes.push('start_date')
    }
    if (editForm.due_date !== (task.due_date || '')) {
      updates.due_date = editForm.due_date || null
      changes.push('due_date')
    }
    if (editForm.assigned_to !== (task.assigned_to || 'unassigned')) {
      updates.assigned_to = editForm.assigned_to === 'unassigned' ? null : editForm.assigned_to || null
      changes.push('assigned_to')
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false)
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update task')
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      task_id: task.id,
      user_id: currentUserId,
      action: 'updated',
      details: { changes },
    })

    toast.success('Task updated')
    setIsEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)

    if (error) {
      toast.error('Failed to delete task')
      return
    }

    toast.success('Task deleted')
    router.push('/dashboard')
  }

  const assigneeInitials = task.assignee?.full_name
    ? task.assignee.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
            )}
            <Badge className={priorityConfig[task.priority].className}>
              {priorityConfig[task.priority].label}
            </Badge>
            <Badge className={statusConfig[task.status].className}>
              {statusConfig[task.status].label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Task</DialogTitle>
                  </DialogHeader>
                  <p className="text-slate-600">
                    Are you sure you want to delete &quot;{task.title}&quot;? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(v) => setEditForm({ ...editForm, priority: v as Priority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="next_week">Next Week</SelectItem>
                          <SelectItem value="rainy_day">Rainy Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(v) => setEditForm({ ...editForm, status: v as TaskStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={editForm.start_date}
                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time Estimate</Label>
                      <Input
                        value={editForm.time_estimate}
                        onChange={(e) => setEditForm({ ...editForm, time_estimate: e.target.value })}
                        placeholder="e.g., 2 hours"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assignee</Label>
                      <Select
                        value={editForm.assigned_to}
                        onValueChange={(v) => setEditForm({ ...editForm, assigned_to: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name || p.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {task.notes && (
                    <div>
                      <Label className="text-slate-500">Notes</Label>
                      <p className="mt-1 text-slate-700 whitespace-pre-wrap">{task.notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {task.start_date && (
                      <div>
                        <Label className="text-slate-500">Start Date</Label>
                        <p className="mt-1 flex items-center gap-2 text-slate-700">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(task.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                    {task.due_date && (
                      <div>
                        <Label className="text-slate-500">Due Date</Label>
                        <p className="mt-1 flex items-center gap-2 text-slate-700">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {task.time_estimate && (
                      <div>
                        <Label className="text-slate-500">Time Estimate</Label>
                        <p className="mt-1 flex items-center gap-2 text-slate-700">
                          <Clock className="h-4 w-4" />
                          {task.time_estimate}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-slate-500">Assignee</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-[#00467F]/10 text-[#00467F]">
                                {assigneeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-700">{task.assignee.full_name}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments ({attachments.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
              <CommentSection
                taskId={task.id}
                comments={comments}
                currentUserId={currentUserId}
              />
            </TabsContent>
            <TabsContent value="attachments" className="mt-4">
              <FileUpload
                taskId={task.id}
                attachments={attachments}
                currentUserId={currentUserId}
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
