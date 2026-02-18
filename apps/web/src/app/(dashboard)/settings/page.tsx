'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  CreditCard,
  Users,
  Shield,
  Loader2,
  Check,
  Crown,
  Trash2,
  Mail,
  ExternalLink,
  UserPlus,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

type Tab = 'account' | 'billing' | 'team' | 'channels'

interface PlanDefinition {
  id: string
  name: string
  price: number
  limits: {
    contacts: number
    channels: number
    messagesPerMonth: number
    teamMembers: number
    liveChatSeats: number
    flows: number
    broadcasts: number
  }
  features: string[]
}

interface BillingInfo {
  plan: PlanDefinition
  usage: { contacts: number; messagesThisMonth: number }
  subscriptionStatus: string
}

interface TeamMember {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface PendingInvite {
  id: string
  email: string
  role: string
  expiresAt: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: Settings },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'channels' as const, label: 'Channels', icon: Shield },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your account, billing, team, and integrations.
      </p>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'channels' && <ChannelsTab />}
      </div>
    </div>
  )
}

function AccountTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground">Business Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business account settings.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Business Name
            </label>
            <input
              type="text"
              placeholder="Your business name"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Timezone
            </label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
              <option>UTC</option>
              <option>America/New_York</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  )
}

function BillingTab() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [plans, setPlans] = useState<PlanDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [billingData, plansData] = await Promise.all([
          apiFetch<BillingInfo>('/billing/current'),
          apiFetch<PlanDefinition[]>('/billing/plans'),
        ])
        setBilling(billingData)
        setPlans(plansData)
      } catch {
        // Defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleUpgrade = async (planId: string) => {
    try {
      const data = await apiFetch<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/settings?billing=success`,
          cancelUrl: `${window.location.origin}/settings?billing=cancel`,
        }),
      })
      window.location.href = data.url
    } catch {
      // Handle error
    }
  }

  const handleManageBilling = async () => {
    try {
      const data = await apiFetch<{ url: string }>('/billing/portal', {
        method: 'POST',
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`,
        }),
      })
      window.location.href = data.url
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPlan = billing?.plan

  return (
    <div className="max-w-4xl space-y-6">
      {billing && (
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {currentPlan?.name} Plan
                </h3>
                {currentPlan?.id !== 'free' && (
                  <Crown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Status:{' '}
                <span className="font-medium capitalize">
                  {billing.subscriptionStatus}
                </span>
              </p>
            </div>
            {currentPlan?.id !== 'free' && (
              <button
                onClick={handleManageBilling}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Manage Billing
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Contacts</p>
              <p className="text-lg font-semibold text-foreground">
                {billing.usage.contacts.toLocaleString()}
                {currentPlan && currentPlan.limits.contacts !== -1 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {currentPlan.limits.contacts.toLocaleString()}
                  </span>
                )}
              </p>
              {currentPlan && currentPlan.limits.contacts !== -1 && (
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (billing.usage.contacts / currentPlan.limits.contacts) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Messages This Month</p>
              <p className="text-lg font-semibold text-foreground">
                {billing.usage.messagesThisMonth.toLocaleString()}
                {currentPlan && currentPlan.limits.messagesPerMonth !== -1 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {currentPlan.limits.messagesPerMonth.toLocaleString()}
                  </span>
                )}
              </p>
              {currentPlan && currentPlan.limits.messagesPerMonth !== -1 && (
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (billing.usage.messagesThisMonth / currentPlan.limits.messagesPerMonth) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan?.id
          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-lg border p-6',
                isCurrent ? 'border-primary bg-primary/5' : 'border-border',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1">
                <span className="text-3xl font-bold text-foreground">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              {!isCurrent && plan.id !== 'free' && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="mt-4 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Upgrade
                </button>
              )}
              {isCurrent && (
                <div className="mt-4 rounded-md bg-muted py-2 text-center text-sm font-medium text-muted-foreground">
                  Current Plan
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('agent')
  const [inviting, setInviting] = useState(false)

  const loadTeam = useCallback(async () => {
    try {
      const [membersData, invitesData] = await Promise.all([
        apiFetch<TeamMember[]>('/team/members'),
        apiFetch<PendingInvite[]>('/team/invites'),
      ])
      setMembers(membersData)
      setInvites(invitesData)
    } catch {
      // Defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await apiFetch('/team/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteEmail('')
      setShowInviteForm(false)
      await loadTeam()
    } catch {
      // Handle error
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (id: string) => {
    try {
      await apiFetch(`/team/members/${id}`, { method: 'DELETE' })
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      // Handle error
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const result = await apiFetch<{ isActive: boolean }>(
        `/team/members/${id}/toggle-active`,
        { method: 'PATCH' },
      )
      setMembers((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, isActive: result.isActive } : m,
        ),
      )
    } catch {
      // Handle error
    }
  }

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      await apiFetch(`/team/members/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role } : m)),
      )
    } catch {
      // Handle error
    }
  }

  const handleCancelInvite = async (email: string) => {
    try {
      await apiFetch('/team/invite/cancel', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setInvites((prev) => prev.filter((i) => i.email !== email))
    } catch {
      // Handle error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-blue-100 text-blue-700',
    editor: 'bg-green-100 text-green-700',
    agent: 'bg-purple-100 text-purple-700',
    viewer: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {showInviteForm && (
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-medium text-foreground">Invite Team Member</h4>
          <div className="mt-3 flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send
            </button>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Pending Invites
          </h4>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-md border border-dashed border-border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires{' '}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    roleColors[invite.role] ?? roleColors.viewer,
                  )}
                >
                  {invite.role}
                </span>
                <button
                  onClick={() => handleCancelInvite(invite.email)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className={cn(
              'flex items-center justify-between rounded-lg border border-border px-4 py-3',
              !member.isActive && 'opacity-60',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {(member.firstName?.[0] ?? member.email[0]).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {[member.firstName, member.lastName].filter(Boolean).join(' ') ||
                    member.email}
                </p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {member.role !== 'owner' ? (
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                  className={cn(
                    'rounded-full border-0 px-2 py-0.5 text-xs font-medium',
                    roleColors[member.role] ?? roleColors.viewer,
                  )}
                >
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="agent">agent</option>
                  <option value="viewer">viewer</option>
                </select>
              ) : (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    roleColors.owner,
                  )}
                >
                  owner
                </span>
              )}

              {member.role !== 'owner' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(member.id)}
                    className="text-muted-foreground hover:text-foreground"
                    title={member.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {member.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChannelsTab() {
  const channels = [
    'Instagram',
    'Facebook',
    'WhatsApp',
    'TikTok',
    'Telegram',
    'SMS',
    'Email',
  ]

  return (
    <div className="max-w-2xl">
      <h3 className="font-medium text-foreground">Connected Channels</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect and manage your messaging channels.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <div
            key={channel}
            className="flex items-center justify-between rounded-md border border-border p-4"
          >
            <span className="text-sm font-medium text-foreground">{channel}</span>
            <button className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
