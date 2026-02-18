'use client'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE']

export const HttpRequestConfig = ({ config, onChange }: Props) => {
  const method = (config.method as string) ?? 'POST'
  const url = (config.url as string) ?? ''
  const body = (config.body as string) ?? ''
  const headersRaw = (config.headers as Record<string, string>) ?? {}
  const headersStr = Object.entries(headersRaw)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const parseHeaders = (text: string): Record<string, string> => {
    const headers: Record<string, string> = {}
    text.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        if (key) headers[key] = value
      }
    })
    return headers
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => onChange({ method: e.target.value })}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-sm font-mono font-semibold text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Headers</label>
        <textarea
          value={headersStr}
          onChange={(e) => onChange({ headers: parseHeaders(e.target.value) })}
          rows={3}
          placeholder="Content-Type: application/json&#10;Authorization: Bearer {{token}}"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
        />
      </div>

      {method !== 'GET' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Body (JSON)</label>
          <textarea
            value={body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={5}
            placeholder='{"key": "value"}'
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
          />
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        On success, continues to &quot;Success&quot; output. On failure (4xx/5xx), continues to &quot;Failure&quot;.
      </p>
    </div>
  )
}
