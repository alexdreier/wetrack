'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Attachment, Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Upload, Download, Trash2, FileText, Image, File } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  taskId: string
  attachments: (Attachment & { user: Profile })[]
  currentUserId: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image
  if (contentType.includes('pdf') || contentType.includes('document')) return FileText
  return File
}

export function FileUpload({ taskId, attachments, currentUserId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)

    // Upload to Supabase Storage
    const filePath = `${currentUserId}/${taskId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      toast.error('Failed to upload file')
      setUploading(false)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    // Save attachment record
    const { error: dbError } = await supabase.from('attachments').insert({
      task_id: taskId,
      user_id: currentUserId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      content_type: file.type,
    })

    if (dbError) {
      toast.error('Failed to save attachment')
      setUploading(false)
      return
    }

    // Log activity
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: currentUserId,
      action: 'attached',
      details: { file_name: file.name },
    })

    toast.success('File uploaded')
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDelete(attachment: Attachment) {
    // Extract path from URL
    const urlParts = attachment.file_url.split('/attachments/')
    if (urlParts.length < 2) {
      toast.error('Invalid file URL')
      return
    }
    const filePath = urlParts[1]

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachment.id)

    if (dbError) {
      toast.error('Failed to delete attachment')
      return
    }

    toast.success('Attachment deleted')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          accept="*/*"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <span className="text-xs text-slate-500">Max 10MB</span>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No attachments yet</p>
        ) : (
          attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.content_type)
            const initials = attachment.user?.full_name
              ? attachment.user.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
              : 'U'

            return (
              <Card key={attachment.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {attachment.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                        </span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px] bg-[#00467F]/10 text-[#00467F]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span>{attachment.user?.full_name || 'User'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a href={attachment.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      {attachment.user_id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleDelete(attachment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
