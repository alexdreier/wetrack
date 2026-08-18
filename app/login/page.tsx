'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Check, ArrowRight } from 'lucide-react'

const FEATURES = [
  'Real-time collaboration',
  'Comments & file attachments',
  'Email notifications',
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your email for the password reset link')
      setIsResetMode(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-wested-blue p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/wested-logo.svg"
            alt="WestEd"
            width={121}
            height={21}
            className="h-[21px] w-auto brightness-0 invert"
            priority
          />
          <span className="text-white/30">|</span>
          <span className="text-white font-semibold text-lg">WE Tracker</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-3xl font-semibold text-white leading-tight tracking-tight">
            Collaborative task management
          </h1>
          <p className="text-white/70">
            Stay organized, work together, and get things done with real-time task tracking.
          </p>

          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-white/90 text-sm">
                <span className="size-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check className="size-3 text-wested-green" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-sm">A WestEd productivity tool</p>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex items-center gap-2">
                <Image
                  src="/wested-logo.svg"
                  alt="WestEd"
                  width={104}
                  height={18}
                  className="h-[18px] w-auto dark:brightness-0 dark:invert"
                />
                <span className="text-border">|</span>
                <span className="font-semibold">WE Tracker</span>
              </div>
            </div>
            <CardTitle className="text-xl">
              {isResetMode ? 'Reset password' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isResetMode
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@wested.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  'Please wait…'
                ) : isResetMode ? (
                  'Send reset link'
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="size-4" />
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(!isResetMode)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {isResetMode ? 'Back to sign in' : 'Forgot your password?'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
