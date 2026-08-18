'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Comment } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
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
import { Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from './RichTextEditor'
import { RichTextDisplay } from './RichTextDisplay'
import { getInitials, stripHtml } from '@/lib/utils'
import { CommentWithUser } from '@/lib/hooks/use-task-detail'

interface CommentSectionProps {
  taskId: string
  comments: CommentWithUser[]
  currentUserId: string
  onAdd: (comment: Comment) => void
  onRemove: (id: string) => void
}

export function CommentSection({
  taskId,
  comments,
  currentUserId,
  onAdd,
  onRemove,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  // Remounting the editor is the simplest reliable way to clear TipTap
  const [editorKey, setEditorKey] = useState(0)

  const hasContent = stripHtml(newComment).length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasContent) return

    setLoading(true)
    const supabase = createClient()

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        content: newComment,
      })
      .select('*')
      .single()

    setLoading(false)

    if (error || !comment) {
      toast.error('Failed to add comment')
      return
    }

    onAdd(comment)
    setNewComment('')
    setEditorKey((k) => k + 1)

    const plainText = stripHtml(comment.content)
    supabase
      .from('activity_log')
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        action: 'commented',
        details: { preview: plainText.slice(0, 100) },
      })
      .then(({ error: logError }) => {
        if (logError) console.error('Failed to log activity:', logError)
      })

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comment_added',
        taskId,
        data: { comment: plainText },
      }),
    })
  }

  async function handleDelete(commentId: string) {
    onRemove(commentId)
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <RichTextEditor
          key={editorKey}
          content=""
          onChange={setNewComment}
          placeholder="Write a comment..."
          minHeight="80px"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !hasContent} className="gap-2">
            <Send className="size-4" />
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="py-0">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                      {getInitials(comment.user?.full_name, comment.user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {comment.user?.full_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {comment.user_id === currentUserId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-destructive"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This comment will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(comment.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="mt-1">
                      <RichTextDisplay content={comment.content} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
