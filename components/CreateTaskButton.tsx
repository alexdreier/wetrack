'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile, Priority, TaskStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, FileText, Calendar, Users, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from './RichTextEditor'

interface CreateTaskButtonProps {
  profiles: Profile[]
  currentUserId: string
}

export function CreateTaskButton({ profiles, currentUserId }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    priority: 'normal' as Priority,
    status: 'not_started' as TaskStatus,
    time_estimate: '',
    start_date: '',
    due_date: '',
    assigned_to: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('tasks').insert({
      title: formData.title,
      notes: formData.notes || null,
      priority: formData.priority,
      status: formData.status,
      time_estimate: formData.time_estimate || null,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
      assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
      created_by: currentUserId,
    })

    if (error) {
      toast.error('Failed to create task')
      setLoading(false)
      return
    }

    // Log activity
    const { data: newTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('title', formData.title)
      .eq('created_by', currentUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (newTask) {
      await supabase.from('activity_log').insert({
        task_id: newTask.id,
        user_id: currentUserId,
        action: 'created',
        details: { title: formData.title },
      })

      // Notify other users about the new task
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task_created',
          taskId: newTask.id,
          userId: currentUserId,
          data: { priority: formData.priority },
        }),
      })

      // Also send assignment notification if assigned to someone else
      if (formData.assigned_to && formData.assigned_to !== 'unassigned' && formData.assigned_to !== currentUserId) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'task_assigned',
            taskId: newTask.id,
            userId: currentUserId,
          }),
        })
      }
    }

    toast.success('Task created')
    setOpen(false)
    setFormData({
      title: '',
      notes: '',
      priority: 'normal',
      status: 'not_started',
      time_estimate: '',
      start_date: '',
      due_date: '',
      assigned_to: '',
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#00467F] to-[#1669C9] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Task
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Task Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00467F]">
              <FileText className="h-4 w-4" />
              Task Details
            </div>
            <div className="space-y-3 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-slate-600">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-600">Notes</Label>
                <RichTextEditor
                  content={formData.notes}
                  onChange={(value) => setFormData({ ...formData, notes: value })}
                  placeholder="Add any additional details or context..."
                  minHeight="60px"
                />
              </div>
            </div>
          </div>

          {/* Priority & Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00467F]">
              <Flag className="h-4 w-4" />
              Priority & Status
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-1.5">
                <Label className="text-slate-600">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="normal">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Normal
                      </span>
                    </SelectItem>
                    <SelectItem value="rainy_day">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        Rainy Day
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger className="h-10">
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
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00467F]">
              <Calendar className="h-4 w-4" />
              Schedule
            </div>
            <div className="grid grid-cols-3 gap-4 pl-6">
              <div className="space-y-1.5">
                <Label htmlFor="start_date" className="text-slate-600">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date" className="text-slate-600">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time_estimate" className="text-slate-600">Estimate</Label>
                <Input
                  id="time_estimate"
                  value={formData.time_estimate}
                  onChange={(e) => setFormData({ ...formData, time_estimate: e.target.value })}
                  placeholder="e.g., 2h"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#00467F]">
              <Users className="h-4 w-4" />
              Assignment
            </div>
            <div className="pl-6">
              <div className="space-y-1.5">
                <Label className="text-slate-600">Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#00467F] hover:bg-[#00467F]/90">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
