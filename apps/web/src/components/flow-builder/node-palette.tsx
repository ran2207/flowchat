'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import {
  NODE_DEFINITIONS,
  NODE_CATEGORIES,
  type NodeCategory,
  type NodeDefinition,
} from './node-registry'

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, definition: NodeDefinition) => void
}

export const NodePalette = ({ onDragStart }: NodePaletteProps) => {
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(NODE_CATEGORIES)),
  )

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const filteredDefinitions = search
    ? NODE_DEFINITIONS.filter(
        (n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.description.toLowerCase().includes(search.toLowerCase()),
      )
    : NODE_DEFINITIONS

  const categories = Object.entries(NODE_CATEGORIES) as [NodeCategory, { label: string; color: string }][]

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Nodes</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {categories.map(([category, config]) => {
          const nodes = filteredDefinitions.filter((n) => n.category === category)
          if (nodes.length === 0) return null

          const isExpanded = expandedCategories.has(category)

          return (
            <div key={category} className="mb-1">
              <button
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
                <span className="ml-auto text-[10px] font-normal text-gray-400">
                  {nodes.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-1 space-y-0.5 py-1">
                  {nodes.map((definition) => {
                    const Icon = definition.icon
                    return (
                      <div
                        key={definition.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, definition)}
                        className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 active:cursor-grabbing"
                      >
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded"
                          style={{ backgroundColor: `${definition.color}15` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: definition.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{definition.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
