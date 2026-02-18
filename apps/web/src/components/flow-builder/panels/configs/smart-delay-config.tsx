'use client'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
]

export const SmartDelayConfig = ({ config, onChange }: Props) => {
  const duration = (config.duration as number) ?? 1
  const unit = (config.unit as string) ?? 'hours'

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Wait Duration</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={duration}
            onChange={(e) => onChange({ duration: Math.max(1, Number(e.target.value)) })}
            min={1}
            className="w-24 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <select
            value={unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        The flow will pause for the specified duration before continuing to the next node.
      </p>
    </div>
  )
}
