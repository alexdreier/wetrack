'use client'

import DOMPurify from 'isomorphic-dompurify'
import { cn } from '@/lib/utils'

// Read-only renderer for user-authored rich text. Content is sanitized —
// it comes from other users and must never execute.
export function RichTextDisplay({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })

  return (
    <div
      className={cn('prose-content text-sm', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
