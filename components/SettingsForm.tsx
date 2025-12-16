'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface SettingsFormProps {
  profile: Profile | null
  userId: string
  userEmail: string
}

export function SettingsForm({ profile, userId, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email_notifications: profile?.email_notifications ?? true,
    notify_on_assignment: profile?.notify_on_assignment ?? true,
    notify_on_comments: profile?.notify_on_comments ?? true,
    notify_on_status_change: profile?.notify_on_status_change ?? true,
  })

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        email_notifications: formData.email_notifications,
        notify_on_assignment: formData.notify_on_assignment,
        notify_on_comments: formData.notify_on_comments,
        notify_on_status_change: formData.notify_on_status_change,
      })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated')
      router.refresh()
    }
    setLoading(false)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated')
      setPasswordData({ current: '', new: '', confirm: '' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                Email cannot be changed
              </p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose when you want to receive email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Enable Email Notifications</Label>
              <p className="text-sm text-slate-500">
                Master toggle for all email notifications
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={formData.email_notifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, email_notifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_assignment">Task Assignments</Label>
                <p className="text-sm text-slate-500">
                  When a task is assigned to you
                </p>
              </div>
              <Switch
                id="notify_on_assignment"
                checked={formData.notify_on_assignment && formData.email_notifications}
                disabled={!formData.email_notifications}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notify_on_assignment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_comments">Comments</Label>
                <p className="text-sm text-slate-500">
                  When someone comments on your tasks
                </p>
              </div>
              <Switch
                id="notify_on_comments"
                checked={formData.notify_on_comments && formData.email_notifications}
                disabled={!formData.email_notifications}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notify_on_comments: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_status_change">Status Changes</Label>
                <p className="text-sm text-slate-500">
                  When task status is updated
                </p>
              </div>
              <Switch
                id="notify_on_status_change"
                checked={formData.notify_on_status_change && formData.email_notifications}
                disabled={!formData.email_notifications}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notify_on_status_change: checked })
                }
              />
            </div>
          </div>

          <Separator />

          <Button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? 'Saving...' : 'Save Notification Preferences'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading || !passwordData.new || !passwordData.confirm}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
