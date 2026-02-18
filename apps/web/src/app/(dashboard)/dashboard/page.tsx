'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  GitBranch,
  Send,
  MessageSquare,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface OverviewStats {
  totalContacts: number
  activeContacts: number
  newContactsToday: number
  totalMessagesSent: number
  totalMessagesReceived: number
  openConversations: number
  flowsTriggered: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<OverviewStats>('/analytics/overview')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? [
        {
          label: 'Total Contacts',
          value: stats.totalContacts.toLocaleString(),
          icon: Users,
          color: 'text-blue-500',
          href: '/contacts',
        },
        {
          label: 'Flows Triggered',
          value: stats.flowsTriggered.toLocaleString(),
          icon: GitBranch,
          color: 'text-purple-500',
          href: '/flows',
        },
        {
          label: 'Messages Sent',
          value: stats.totalMessagesSent.toLocaleString(),
          icon: Send,
          color: 'text-green-500',
          href: '/analytics',
        },
        {
          label: 'Open Conversations',
          value: stats.openConversations.toString(),
          icon: MessageSquare,
          color: 'text-amber-500',
          href: '/inbox',
        },
      ]
    : []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to FlowChat. Your overview at a glance.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                  View details
                  <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Create a new flow', href: '/flows/new/builder' },
                  { label: 'Send a broadcast', href: '/broadcasts' },
                  { label: 'Manage contacts', href: '/contacts' },
                  { label: 'Configure AI', href: '/ai' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {action.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Activity Summary
              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    New contacts today
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {stats?.newContactsToday ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active contacts (30d)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {stats?.activeContacts.toLocaleString() ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Messages received
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {stats?.totalMessagesReceived.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
