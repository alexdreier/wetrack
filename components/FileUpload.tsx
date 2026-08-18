'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Attachment } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Upload, Download, Trash2, FileText, Image as ImageIcon, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { AttachmentWithUser } from '@/lib/hooks/use-task-detail'

interface FileUploadProps {
  taskId: string
  attachments: AttachmentWithUser[]
  currentUserId: string
  onAdd: (attachment: Attachment) => void
  onRemove: (id: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'text/']
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

function isAllowedType(type: string) {
  return ALLOWED_MIME_PREFIXES.some((p) => type.startsWith(p)) || ALLOWED_MIME_TYPES.has(type)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return ImageIcon
  if (contentType.includes('pdf') || contentType.includes('document')) return FileText
  return File
}

export function FileUpload({
  taskId,
  attachments,
  currentUserId,
  onAdd,
  onRemove,
}: FileUploadProps) {
  const [uploadingName, setUploadingName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB')
      return
    }
    if (file.type && !isAllowedType(file.type)) {
      toast.error('This file type is not allowed')
      return
    }

    setUploadingName(file.name)
    const supabase = createClient()

    const filePath = `${currentUserId}/${taskId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Failed to upload file')
      setUploadingName(null)
      return
    }

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)

    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        content_type: file.type,
      })
      .select('*')
      .single()

    setUploadingName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (dbError || !attachment) {
      toast.error('Failed to save attachment')
      return
    }

    onAdd(attachment)

    supabase
      .from('activity_log')
      .insert({
        task_id: taskId,
        user_id: currentUserId,
        action: 'attached',
        details: { file_name: file.name },
      })
      .then(({ error: logError }) => {
        if (logError) console.error('Failed to log activity:', logError)
      })
  }

  async function handleDelete(attachment: Attachment) {
    const urlParts = attachment.file_url.split('/attachments/')
    if (urlParts.length < 2) {
      toast.error('Invalid file URL')
      return
    }

    onRemove(attachment.id)
    const supabase = createClient()

    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([urlParts[1]])
    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    const { error: dbError } = await supabase.from('attachments').delete().eq('id', attachment.id)
    if (dbError) {
      toast.error('Failed to delete attachment')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingName !== null}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {uploadingName ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploadingName ? 'Uploading…' : 'Upload File'}
        </Button>
        <span className="text-xs text-muted-foreground">Max 10MB</span>
      </div>

      {uploadingName && (
        <div className="rounded-md border p-3">
          <p className="text-sm truncate">{uploadingName}</p>
          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-primary animate-[upload-slide_1.2s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {attachments.length === 0 && !uploadingName ? (
          <p className="text-center text-sm text-muted-foreground py-8">No attachments yet</p>
        ) : (
          attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.content_type)
            return (
              <Card key={attachment.id} className="py-0">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-muted rounded-md flex items-center justify-center shrink-0">
                      <FileIcon className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        <span>•</span>
                        <span>{format(new Date(attachment.created_at), 'MMM d, yyyy')}</span>
                        <span className="hidden sm:inline">•</span>
                        <div className="hidden sm:flex items-center gap-1">
                          <Avatar className="size-4">
                            <AvatarFallback className="text-[9px] bg-accent text-accent-foreground">
                              {getInitials(attachment.user?.full_name, attachment.user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{attachment.user?.full_name || 'User'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8" asChild>
                        <a
                          href={attachment.file_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Download ${attachment.file_name}`}
                        >
                          <Download className="size-4" />
                        </a>
                      </Button>
                      {attachment.user_id === currentUserId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              aria-label={`Delete ${attachment.file_name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &ldquo;{attachment.file_name}&rdquo; will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(attachment)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
