'use client'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const TagConfig = ({ config, onChange }: Props) => {
  const tagName = (config.tagName as string) ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tag Name</label>
        <input
          type="text"
          value={tagName}
          onChange={(e) => onChange({ tagName: e.target.value })}
          placeholder="e.g., interested, vip, lead"
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      <p className="text-[11px] text-gray-400">
        Tags help you segment and organize your contacts for targeted messaging.
      </p>
    </div>
  )
}
