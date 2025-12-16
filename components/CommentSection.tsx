'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Comment, Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CommentSectionProps {
  taskId: string
  comments: (Comment & { user: Profile })[]
  currentUserId: string
}

export function CommentSection({ taskId, comments, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)

    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: currentUserId,
      content: newComment.trim(),
    })

    if (error) {
      toast.error('Failed to add comment')
      setLoading(false)
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: currentUserId,
      action: 'commented',
      details: { preview: newComment.slice(0, 100) },
    })

    setNewComment('')
    setLoading(false)
    toast.success('Comment added')
  }

  async function handleDelete(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      toast.error('Failed to delete comment')
      return
    }

    toast.success('Comment deleted')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1"
          rows={2}
        />
        <Button type="submit" disabled={loading || !newComment.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No comments yet</p>
        ) : (
          comments.map((comment) => {
            const initials = comment.user?.full_name
              ? comment.user.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
              : 'U'

            return (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-[#00467F]/10 text-[#00467F]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-slate-900">
                            {comment.user?.full_name || 'User'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {comment.user_id === currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
