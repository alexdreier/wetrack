'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { TaskForm, TaskFormValues, EMPTY_TASK_FORM, validateTaskDates } from './TaskForm'
import { useTasks } from './TasksProvider'

interface CreateTaskButtonProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateTaskButton({ open: controlledOpen, onOpenChange }: CreateTaskButtonProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<TaskFormValues>(EMPTY_TASK_FORM)
  const { profiles, currentUserId, addTask } = useTasks()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dateError = validateTaskDates(values)
    if (dateError) {
      toast.error(dateError)
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        title: values.title,
        notes: values.notes || null,
        priority: values.priority,
        status: values.status,
        time_estimate: values.time_estimate || null,
        start_date: values.start_date || null,
        due_date: values.due_date || null,
        assigned_to: values.assigned_to === 'unassigned' ? null : values.assigned_to,
        created_by: currentUserId,
      })
      .select('*')
      .single()

    setLoading(false)

    if (error || !newTask) {
      toast.error('Failed to create task')
      return
    }

    // Show it immediately; the realtime echo reconciles for everyone else
    addTask(newTask)
    setOpen(false)
    setValues(EMPTY_TASK_FORM)

    // Best-effort bookkeeping off the interaction path. The task_created
    // email already reaches every other user, so no separate assignment POST.
    supabase
      .from('activity_log')
      .insert({
        task_id: newTask.id,
        user_id: currentUserId,
        action: 'created',
        details: { title: newTask.title },
      })
      .then(({ error: logError }) => {
        if (logError) console.error('Failed to log activity:', logError)
      })

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'task_created',
        taskId: newTask.id,
        data: { priority: newTask.priority },
      }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TaskForm values={values} onChange={setValues} profiles={profiles} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !values.title.trim()}>
              {loading ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
