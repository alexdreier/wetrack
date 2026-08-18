'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TriangleAlert } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <TriangleAlert className="size-6 text-destructive" />
      </div>
      <h2 className="font-semibold text-lg">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        An unexpected error occurred while loading this page.
      </p>
      <Button onClick={reset} variant="outline" className="mt-6">
        Try again
      </Button>
    </div>
  )
}
