'use client'

import { Plus, Trash2 } from 'lucide-react'

interface ConditionRule {
  field: string
  operator: string
  value: string
}

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'exists', label: 'exists' },
  { value: 'not_exists', label: 'does not exist' },
]

const FIELD_OPTIONS = [
  { value: 'contact.first_name', label: 'First Name' },
  { value: 'contact.last_name', label: 'Last Name' },
  { value: 'contact.email', label: 'Email' },
  { value: 'contact.phone', label: 'Phone' },
  { value: 'contact.platform', label: 'Platform' },
  { value: 'contact.locale', label: 'Locale' },
  { value: 'contact.tags', label: 'Has Tag' },
  { value: 'message.text', label: 'Message Text' },
]

export const ConditionConfig = ({ config, onChange }: Props) => {
  const rules = (config.rules as ConditionRule[]) ?? []
  const logicalOperator = (config.logicalOperator as string) ?? 'AND'

  const addRule = () => {
    onChange({
      rules: [...rules, { field: 'contact.first_name', operator: 'eq', value: '' }],
    })
  }

  const updateRule = (index: number, updates: Partial<ConditionRule>) => {
    const newRules = rules.map((r, i) => (i === index ? { ...r, ...updates } : r))
    onChange({ rules: newRules })
  }

  const removeRule = (index: number) => {
    onChange({ rules: rules.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {rules.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Match</label>
          <select
            value={logicalOperator}
            onChange={(e) => onChange({ logicalOperator: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            <option value="AND">ALL conditions (AND)</option>
            <option value="OR">ANY condition (OR)</option>
          </select>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={index} className="rounded-md border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500">Rule {index + 1}</span>
              <button
                onClick={() => removeRule(index)}
                className="rounded p-0.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <select
              value={rule.field}
              onChange={(e) => updateRule(index, { field: e.target.value })}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-blue-300 focus:outline-none"
            >
              {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) => updateRule(index, { operator: e.target.value })}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-blue-300 focus:outline-none"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {!['exists', 'not_exists'].includes(rule.operator) && (
              <input
                type="text"
                value={rule.value}
                onChange={(e) => updateRule(index, { value: e.target.value })}
                placeholder="Value"
                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRule}
        className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Condition
      </button>

      <p className="text-[11px] text-gray-400">
        Contacts matching the conditions go to &quot;True&quot;, others go to &quot;False&quot;.
      </p>
    </div>
  )
}
