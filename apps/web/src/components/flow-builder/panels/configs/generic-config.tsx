'use client'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const GenericConfig = ({ config, onChange }: Props) => {
  const entries = Object.entries(config)

  if (entries.length === 0) {
    return (
      <p className="text-xs italic text-gray-400">
        No additional configuration needed for this node.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim()

        if (typeof value === 'boolean') {
          return (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange({ [key]: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-xs text-gray-700">{label}</span>
            </label>
          )
        }

        if (typeof value === 'number') {
          return (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="number"
                value={value}
                onChange={(e) => onChange({ [key]: Number(e.target.value) })}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          )
        }

        if (typeof value === 'string') {
          return (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
