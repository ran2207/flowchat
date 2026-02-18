'use client'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

const MODELS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gpt-4', label: 'GPT-4 (OpenAI)' },
]

export const AiReplyConfig = ({ config, onChange }: Props) => {
  const prompt = (config.prompt as string) ?? ''
  const model = (config.model as string) ?? 'claude'
  const maxTokens = (config.maxTokens as number) ?? 500
  const goal = (config.goal as string) ?? ''
  const maxTurns = (config.maxTurns as number) ?? 5

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">AI Model</label>
        <select
          value={model}
          onChange={(e) => onChange({ model: e.target.value })}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">System Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={6}
          placeholder="You are a helpful customer service agent for our business. Answer questions about our products and services. Be friendly and professional."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
        />
      </div>

      {config.goal !== undefined && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Goal</label>
          <input
            type="text"
            value={goal}
            onChange={(e) => onChange({ goal: e.target.value })}
            placeholder="e.g., Collect user email and phone number"
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      )}

      {config.maxTurns !== undefined && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Turns</label>
          <input
            type="number"
            value={maxTurns}
            onChange={(e) => onChange({ maxTurns: Math.max(1, Number(e.target.value)) })}
            min={1}
            max={20}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Max Tokens</label>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => onChange({ maxTokens: Math.max(50, Number(e.target.value)) })}
          min={50}
          max={4000}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>
    </div>
  )
}
