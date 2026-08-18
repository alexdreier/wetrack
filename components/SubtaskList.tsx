'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Task, TaskWithAssignee, Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
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
import { Circle, CircleCheck, Plus, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { cn, parseLocalDate, getInitials } from '@/lib/utils'

interface SubtaskListProps {
  parentId: string
  subtasks: TaskWithAssignee[]
  profiles: Profile[]
  currentUserId: string
  onAdd: (row: Task) => void
  onUpdate: (id: string, patch: Partial<Task>) => Promise<boolean>
  onRemove: (id: string) => Promise<boolean>
}

export function SubtaskList({
  parentId,
  subtasks,
  profiles,
  currentUserId,
  onAdd,
  onUpdate,
  onRemove,
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title || creating) return
    setCreating(true)

    const supabase = createClient()
    const { data: subtask, error } = await supabase
      .from('tasks')
      .insert({
        title,
        notes: null,
        priority: 'normal',
        status: 'not_started',
        time_estimate: null,
        start_date: null,
        due_date: null,
        assigned_to: null,
        created_by: currentUserId,
        parent_id: parentId,
      })
      .select('*')
      .single()

    setCreating(false)
    if (error || !subtask) {
      toast.error('Failed to add subtask')
      return
    }
    onAdd(subtask)
    setNewTitle('')
  }

  async function assignSubtask(subtask: TaskWithAssignee, value: string) {
    const assignedTo = value === 'unassigned' ? null : value
    const ok = await onUpdate(subtask.id, { assigned_to: assignedTo })
    if (ok && assignedTo && assignedTo !== currentUserId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_assigned', taskId: subtask.id }),
      })
    }
  }

  function toggleDone(subtask: TaskWithAssignee) {
    onUpdate(subtask.id, {
      status: subtask.status === 'completed' ? 'not_started' : 'completed',
    })
  }

  return (
    <div className="space-y-1">
      {subtasks.map((subtask) => {
        const isDone = subtask.status === 'completed'
        return (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/50 transition-colors"
          >
            <button
              onClick={() => toggleDone(subtask)}
              aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
              className={cn(
                'shrink-0 transition-colors',
                isDone ? 'text-success' : 'text-muted-foreground/50 hover:text-success'
              )}
            >
              {isDone ? <CircleCheck className="size-4.5" /> : <Circle className="size-4.5" />}
            </button>

            <Link
              href={`/dashboard/tasks/${subtask.id}`}
              className={cn(
                'flex-1 min-w-0 truncate text-sm hover:text-primary transition-colors',
                isDone && 'text-muted-foreground line-through'
              )}
            >
              {subtask.title}
            </Link>

            {subtask.due_date && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(parseLocalDate(subtask.due_date), 'MMM d')}
              </span>
            )}

            <Select
              value={subtask.assigned_to || 'unassigned'}
              onValueChange={(v) => assignSubtask(subtask, v)}
            >
              <SelectTrigger
                aria-label="Assign subtask"
                className="border-0 bg-transparent shadow-none p-0.5 h-auto gap-0 [&>svg:last-child]:hidden hover:bg-muted rounded-full"
              >
                {subtask.assignee ? (
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                      {getInitials(subtask.assignee.full_name, subtask.assignee.email)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="size-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground/50">
                    <UserRound className="size-3.5" />
                  </span>
                )}
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete subtask ${subtask.title}`}
                  className="size-6 shrink-0 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete subtask?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{subtask.title}&rdquo; and its comments and attachments will be
                    permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onRemove(subtask.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      })}

      <form onSubmit={handleCreate} className="flex items-center gap-2 pt-1">
        <Plus className="size-4.5 shrink-0 text-muted-foreground/50" />
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="h-8 border-0 shadow-none px-1 focus-visible:ring-0 focus-visible:border-0 bg-transparent"
        />
        {newTitle.trim() && (
          <Button type="submit" size="sm" variant="secondary" disabled={creating}>
            {creating ? 'Adding…' : 'Add'}
          </Button>
        )}
      </form>
    </div>
  )
}
