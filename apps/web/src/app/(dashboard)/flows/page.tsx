'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreVertical,
  GitBranch,
  Hash,
  AtSign,
  Globe,
  Clock,
  Zap,
  Copy,
  Trash2,
  Archive,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlowItem {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  triggerType: string
  updatedAt: string
}

const MOCK_FLOWS: FlowItem[] = []

const TRIGGER_ICONS: Record<string, typeof Hash> = {
  keyword: Hash,
  comment: AtSign,
  webhook: Globe,
  schedule: Clock,
  manual: Zap,
}

const STATUS_STYLES = {
  draft: { label: 'Draft', classes: 'bg-amber-100 text-amber-700' },
  published: { label: 'Published', classes: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', classes: 'bg-gray-100 text-gray-500' },
}

export default function FlowsPage() {
  const [flows] = useState<FlowItem[]>(MOCK_FLOWS)
  const [search, setSearch] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filteredFlows = flows.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flows</h1>
          <p className="mt-1 text-muted-foreground">
            Build and manage your automation flows.
          </p>
        </div>
        <Link
          href="/flows/new/builder"
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Flow
        </Link>
      </div>

      {flows.length > 0 && (
        <div className="mt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search flows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        {filteredFlows.length > 0 ? (
          <div className="space-y-2">
            {filteredFlows.map((flow) => {
              const TriggerIcon = TRIGGER_ICONS[flow.triggerType] ?? GitBranch
              const status = STATUS_STYLES[flow.status]

              return (
                <div
                  key={flow.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/flows/${flow.id}/builder`}
                      className="text-sm font-semibold text-foreground hover:text-primary"
                    >
                      {flow.name}
                    </Link>
                    {flow.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {flow.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <TriggerIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground capitalize">
                      {flow.triggerType}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      status.classes,
                    )}
                  >
                    {status.label}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {new Date(flow.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === flow.id ? null : flow.id)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === flow.id && (
                      <div className="absolute right-0 top-8 z-50 w-40 rounded-md border border-border bg-card py-1 shadow-lg">
                        <Link
                          href={`/flows/${flow.id}/builder`}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent">
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </button>
                        <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent">
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </button>
                        <div className="my-1 h-px bg-border" />
                        <button className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">No flows yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first automation flow to get started.
            </p>
            <Link
              href="/flows/new/builder"
              className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Flow
            </Link>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No flows match your search.
          </p>
        )}
      </div>
    </div>
  )
}
