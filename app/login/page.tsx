'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckSquare, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

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
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#00467F] via-[#1669C9] to-[#3C3675] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-4">
            <img
              src="https://wested2024.s3.us-west-1.amazonaws.com/wp-content/uploads/2024/06/11163339/wested-logo.svg"
              alt="WestEd"
              className="h-12 brightness-0 invert"
            />
            <div className="h-10 w-px bg-white/30" />
            <div>
              <span className="text-white font-bold text-2xl tracking-wide">
                WE <span className="text-[#54B948]">Track</span>
              </span>
              <p className="text-white/70 text-sm">Task Management</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Collaborative Task Management
          </h1>
          <p className="text-white/80 text-lg">
            Stay organized, work together, and get things done with real-time task tracking.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-[#54B948] rounded-full flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <span>Real-time collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-[#54B948] rounded-full flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <span>Comments & file attachments</span>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-[#54B948] rounded-full flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
              <span>Email notifications</span>
            </div>
          </div>
        </div>

        <p className="text-white/50 text-sm">
          A WestEd productivity tool
        </p>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="flex items-center gap-3">
                <img
                  src="https://wested2024.s3.us-west-1.amazonaws.com/wp-content/uploads/2024/06/11163339/wested-logo.svg"
                  alt="WestEd"
                  className="h-8"
                />
                <div className="h-6 w-px bg-slate-300" />
                <span className="text-[#00467F] font-bold text-xl tracking-wide">
                  WE <span className="text-[#54B948]">Track</span>
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#3C3675]">
              {isResetMode ? 'Reset Password' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {isResetMode
                ? 'Enter your email to receive a reset link'
                : 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@wested.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-[#00467F] hover:bg-[#00467F]/90" disabled={loading}>
                {loading ? (
                  'Please wait...'
                ) : isResetMode ? (
                  'Send Reset Link'
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(!isResetMode)}
                className="text-sm text-[#1669C9] hover:underline font-medium"
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
