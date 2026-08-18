import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-background">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been deleted.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
