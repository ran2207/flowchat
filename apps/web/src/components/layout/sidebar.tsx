'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  Users,
  BarChart3,
  Settings,
  Send,
  Zap,
  Brain,
  Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Flows', href: '/flows', icon: GitBranch },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Broadcasts', href: '/broadcasts', icon: Send },
  { name: 'Sequences', href: '/sequences', icon: Zap },
  { name: 'AI', href: '/ai', icon: Brain },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground">
            Flow<span className="text-primary">Chat</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 text-center leading-8 text-sm font-medium text-primary">
            U
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">User</p>
            <p className="truncate text-xs text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
