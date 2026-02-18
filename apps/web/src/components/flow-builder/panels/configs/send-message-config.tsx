'use client'

import { TextImprover } from '../../../ai/text-improver'

interface Props {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export const SendMessageConfig = ({ config, onChange }: Props) => {
  const text = (config.text as string) ?? ''
  const typingDelay = (config.typingDelay as number) ?? 0

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-600">Message Text</label>
          <TextImprover text={text} onApply={(improved) => onChange({ text: improved })} />
        </div>
        <textarea
          value={text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={5}
          placeholder="Type your message here...&#10;&#10;Use {{contact.first_name}} for variables"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
        />
        <p className="mt-1 text-[10px] text-gray-400">{text.length} characters</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Typing Delay (seconds)
        </label>
        <input
          type="number"
          value={typingDelay}
          onChange={(e) => onChange({ typingDelay: Math.max(0, Number(e.target.value)) })}
          min={0}
          max={10}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <p className="mt-1 text-[10px] text-gray-400">
          Simulates typing indicator before sending (0 = instant)
        </p>
      </div>

      <div className="rounded-md bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-800 mb-1">Variables</p>
        <div className="flex flex-wrap gap-1">
          {['{{contact.first_name}}', '{{contact.email}}', '{{contact.phone}}'].map((v) => (
            <button
              key={v}
              onClick={() => onChange({ text: text + v })}
              className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-mono text-blue-700 hover:bg-blue-200"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
