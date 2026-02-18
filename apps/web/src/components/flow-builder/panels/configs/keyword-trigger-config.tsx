'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const MATCH_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'exact', label: 'Exact Match' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'regex', label: 'Regex' },
]

export const KeywordTriggerConfig = ({ config, onChange }: Props) => {
  const [newKeyword, setNewKeyword] = useState('')
  const keywords = (config.keywords as string[]) ?? []
  const matchType = (config.matchType as string) ?? 'contains'

  const addKeyword = () => {
    const trimmed = newKeyword.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      onChange({ keywords: [...keywords, trimmed] })
      setNewKeyword('')
    }
  }

  const removeKeyword = (kw: string) => {
    onChange({ keywords: keywords.filter((k) => k !== kw) })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Match Type</label>
        <select
          value={matchType}
          onChange={(e) => onChange({ matchType: e.target.value })}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {MATCH_TYPES.map((mt) => (
            <option key={mt.value} value={mt.value}>
              {mt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Keywords</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Type a keyword..."
            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <button
            onClick={addKeyword}
            className="rounded-md bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="hover:text-green-900">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400">
        Not case-sensitive. The flow triggers when a user message matches any of the keywords.
      </p>
    </div>
  )
}
