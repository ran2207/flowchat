'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  MessageSquare,
  Send,
  Inbox,
  GitBranch,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface TimeSeriesPoint {
  date: string
  value: number
}

interface ChannelStats {
  platform: string
  contacts: number
  messagesSent: number
  messagesReceived: number
}

interface FlowStats {
  flowId: string
  flowName: string
  triggered: number
  completed: number
  failed: number
}

interface AgentStats {
  agentId: string
  agentName: string
  conversationsHandled: number
  messagesCount: number
}

type Tab = 'overview' | 'channels' | 'flows' | 'agents'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [messagesSeries, setMessagesSeries] = useState<{
    sent: TimeSeriesPoint[]
    received: TimeSeriesPoint[]
  } | null>(null)
  const [contactGrowth, setContactGrowth] = useState<TimeSeriesPoint[] | null>(null)
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([])
  const [flowStats, setFlowStats] = useState<FlowStats[]>([])
  const [agentStats, setAgentStats] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewData, messagesData, growthData] = await Promise.all([
          apiFetch<OverviewStats>('/analytics/overview'),
          apiFetch<{ sent: TimeSeriesPoint[]; received: TimeSeriesPoint[] }>(
            '/analytics/messages?days=30',
          ),
          apiFetch<TimeSeriesPoint[]>('/analytics/contacts/growth?days=30'),
        ])
        setOverview(overviewData)
        setMessagesSeries(messagesData)
        setContactGrowth(growthData)
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (activeTab === 'channels' && channelStats.length === 0) {
      apiFetch<ChannelStats[]>('/analytics/channels').then(setChannelStats).catch(() => {})
    }
    if (activeTab === 'flows' && flowStats.length === 0) {
      apiFetch<FlowStats[]>('/analytics/flows').then(setFlowStats).catch(() => {})
    }
    if (activeTab === 'agents' && agentStats.length === 0) {
      apiFetch<AgentStats[]>('/analytics/agents').then(setAgentStats).catch(() => {})
    }
  }, [activeTab, channelStats.length, flowStats.length, agentStats.length])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'channels' as const, label: 'Channels' },
    { id: 'flows' as const, label: 'Flows' },
    { id: 'agents' as const, label: 'Agents' },
  ]

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <BarChart3 className="h-6 w-6 text-primary" />
        Analytics
      </h1>
      <p className="mt-1 text-muted-foreground">
        Track your performance across all channels.
      </p>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && overview && (
          <OverviewTab
            overview={overview}
            messagesSeries={messagesSeries}
            contactGrowth={contactGrowth}
          />
        )}
        {activeTab === 'channels' && <ChannelsTab stats={channelStats} />}
        {activeTab === 'flows' && <FlowsTab stats={flowStats} />}
        {activeTab === 'agents' && <AgentsTab stats={agentStats} />}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: typeof Users
  color: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function MiniBarChart({ data, color }: { data: TimeSeriesPoint[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  const last7 = data.slice(-14)

  return (
    <div className="flex items-end gap-0.5 h-16">
      {last7.map((point) => (
        <div
          key={point.date}
          className={cn('w-full rounded-t', color)}
          style={{ height: `${(point.value / max) * 100}%`, minHeight: '2px' }}
          title={`${point.date}: ${point.value}`}
        />
      ))}
    </div>
  )
}

function OverviewTab({
  overview,
  messagesSeries,
  contactGrowth,
}: {
  overview: OverviewStats
  messagesSeries: { sent: TimeSeriesPoint[]; received: TimeSeriesPoint[] } | null
  contactGrowth: TimeSeriesPoint[] | null
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Contacts"
          value={overview.totalContacts.toLocaleString()}
          icon={Users}
          color="text-blue-500"
        />
        <StatCard
          label="Messages Sent"
          value={overview.totalMessagesSent.toLocaleString()}
          icon={Send}
          color="text-green-500"
        />
        <StatCard
          label="Messages Received"
          value={overview.totalMessagesReceived.toLocaleString()}
          icon={Inbox}
          color="text-purple-500"
        />
        <StatCard
          label="Open Conversations"
          value={overview.openConversations}
          icon={MessageSquare}
          color="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Contacts (30d)"
          value={overview.activeContacts.toLocaleString()}
          icon={TrendingUp}
          color="text-emerald-500"
        />
        <StatCard
          label="New Contacts Today"
          value={overview.newContactsToday}
          icon={Users}
          color="text-cyan-500"
        />
        <StatCard
          label="Flows Triggered"
          value={overview.flowsTriggered.toLocaleString()}
          icon={GitBranch}
          color="text-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {messagesSeries && (
          <div className="rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-foreground">Messages (Last 14 days)</h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <MiniBarChart data={messagesSeries.sent} color="bg-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <MiniBarChart data={messagesSeries.received} color="bg-purple-400" />
              </div>
            </div>
          </div>
        )}

        {contactGrowth && (
          <div className="rounded-lg border border-border p-5">
            <h3 className="text-sm font-medium text-foreground">
              Contact Growth (Last 14 days)
            </h3>
            <div className="mt-3">
              <MiniBarChart data={contactGrowth} color="bg-blue-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChannelsTab({ stats }: { stats: ChannelStats[] }) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No channel data available. Connect a channel to start tracking.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Platform
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Contacts
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Sent
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stats.map((stat) => (
            <tr key={stat.platform} className="hover:bg-accent/50">
              <td className="px-4 py-3 text-sm font-medium capitalize text-foreground">
                {stat.platform}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {stat.contacts.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {stat.messagesSent.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {stat.messagesReceived.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FlowsTab({ stats }: { stats: FlowStats[] }) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No flow data available. Create and publish a flow to start tracking.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Flow
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Triggered
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Completed
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Failed
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Completion %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stats.map((stat) => {
            const completionRate = stat.triggered
              ? Math.round((stat.completed / stat.triggered) * 100)
              : 0

            return (
              <tr key={stat.flowId} className="hover:bg-accent/50">
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {stat.flowName}
                </td>
                <td className="px-4 py-3 text-right text-sm text-foreground">
                  {stat.triggered}
                </td>
                <td className="px-4 py-3 text-right text-sm text-green-600">
                  {stat.completed}
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-600">
                  {stat.failed}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground">{completionRate}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AgentsTab({ stats }: { stats: AgentStats[] }) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No agent data available.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Agent
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Conversations
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
              Messages
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stats.map((stat) => (
            <tr key={stat.agentId} className="hover:bg-accent/50">
              <td className="px-4 py-3 text-sm font-medium text-foreground">
                {stat.agentName}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {stat.conversationsHandled}
              </td>
              <td className="px-4 py-3 text-right text-sm text-foreground">
                {stat.messagesCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
