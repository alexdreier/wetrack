'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, LogOut, LayoutDashboard, Sun, Moon, Monitor } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface NavbarProps {
  user: User
  profile: Profile | null
}

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { setTheme } = useTheme()

  const initials = getInitials(profile?.full_name, user.email)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <Image
              src="/wested-logo.svg"
              alt="WestEd"
              width={104}
              height={18}
              className="h-[18px] w-auto dark:brightness-0 dark:invert"
              priority
            />
            <span className="text-border">|</span>
            <span className="font-semibold truncate">WE Tracker</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hidden sm:inline-flex"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    {profile?.avatar_url && (
                      <AvatarImage
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="object-contain"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuItem asChild className="sm:hidden">
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground mb-1.5">Theme</p>
                  <div className="grid grid-cols-3 gap-1">
                    <Button variant="outline" size="sm" onClick={() => setTheme('light')} title="Light">
                      <Sun className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTheme('dark')} title="Dark">
                      <Moon className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTheme('system')} title="System">
                      <Monitor className="size-4" />
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
