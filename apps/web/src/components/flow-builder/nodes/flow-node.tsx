'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type FlowNodeData } from '@/stores/flow-builder.store'
import { getNodeDefinition, NODE_CATEGORIES } from '../node-registry'
import { useFlowBuilderStore } from '@/stores/flow-builder.store'

const FlowNodeComponent = ({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as FlowNodeData
  const definition = getNodeDefinition(nodeData.nodeType)
  const categoryConfig = NODE_CATEGORIES[nodeData.category as keyof typeof NODE_CATEGORIES]
  const selectNode = useFlowBuilderStore((s) => s.selectNode)
  const deleteNode = useFlowBuilderStore((s) => s.deleteNode)

  if (!definition) {
    return (
      <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
        Unknown node: {nodeData.nodeType}
      </div>
    )
  }

  const Icon = definition.icon
  const isTrigger = nodeData.category === 'trigger'
  const outputs = definition.outputs

  return (
    <div
      className={cn(
        'relative min-w-[220px] max-w-[280px] rounded-lg border-2 bg-white shadow-sm transition-shadow hover:shadow-md',
        selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200',
      )}
      onClick={() => selectNode(id)}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
        />
      )}

      <div
        className="flex items-center gap-2 rounded-t-lg px-3 py-2"
        style={{ backgroundColor: `${definition.color}15` }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${definition.color}25` }}
        >
          <Icon className="h-4 w-4" style={{ color: definition.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-gray-800">{nodeData.label}</p>
          <p className="text-[10px] text-gray-500">{categoryConfig?.label}</p>
        </div>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteNode(id)
            }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="px-3 py-2">
        <NodePreview nodeType={nodeData.nodeType} config={nodeData.config} />
      </div>

      {outputs.length === 1 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id={outputs[0]}
          className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
        />
      )}

      {outputs.length > 1 && (
        <div className="flex justify-around border-t border-gray-100 px-2 py-1.5">
          {outputs.map((output, index) => (
            <div key={output} className="relative flex flex-col items-center">
              <span className="text-[10px] font-medium text-gray-500 capitalize">
                {output.replace(/_/g, ' ')}
              </span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={output}
                className="!h-3 !w-3 !border-2 !border-white !bg-gray-400"
                style={{
                  left: `${((index + 1) / (outputs.length + 1)) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const NodePreview = ({
  nodeType,
  config,
}: {
  nodeType: string
  config: Record<string, unknown>
}) => {
  switch (nodeType) {
    case 'keyword_trigger': {
      const keywords = (config.keywords as string[]) ?? []
      return keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {keywords.map((kw) => (
            <span key={kw} className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
              {kw}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] italic text-gray-400">No keywords set</p>
      )
    }
    case 'send_message': {
      const text = (config.text as string) ?? ''
      return text ? (
        <p className="line-clamp-2 text-[11px] text-gray-600">{text}</p>
      ) : (
        <p className="text-[11px] italic text-gray-400">Empty message</p>
      )
    }
    case 'condition': {
      const rules = (config.rules as unknown[]) ?? []
      return (
        <p className="text-[11px] text-gray-500">
          {rules.length > 0 ? `${rules.length} condition${rules.length > 1 ? 's' : ''}` : 'No conditions set'}
        </p>
      )
    }
    case 'smart_delay': {
      const duration = (config.duration as number) ?? 1
      const unit = (config.unit as string) ?? 'hours'
      return (
        <p className="text-[11px] text-gray-600">
          Wait {duration} {unit}
        </p>
      )
    }
    case 'add_tag':
    case 'remove_tag': {
      const tagName = (config.tagName as string) ?? ''
      return tagName ? (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
          {tagName}
        </span>
      ) : (
        <p className="text-[11px] italic text-gray-400">No tag selected</p>
      )
    }
    case 'http_request': {
      const method = (config.method as string) ?? 'POST'
      const url = (config.url as string) ?? ''
      return (
        <p className="truncate text-[11px] text-gray-600">
          <span className="font-mono font-semibold">{method}</span>{' '}
          {url || <span className="italic text-gray-400">No URL set</span>}
        </p>
      )
    }
    case 'random_split': {
      const variants = (config.variants as Array<{ label: string; weight: number }>) ?? []
      return (
        <div className="flex gap-2">
          {variants.map((v) => (
            <span key={v.label} className="text-[11px] text-gray-600">
              {v.label}: {v.weight}%
            </span>
          ))}
        </div>
      )
    }
    case 'ai_reply':
    case 'ai_step': {
      const prompt = (config.prompt as string) ?? ''
      return prompt ? (
        <p className="line-clamp-2 text-[11px] text-gray-600">{prompt}</p>
      ) : (
        <p className="text-[11px] italic text-gray-400">No prompt set</p>
      )
    }
    default:
      return <p className="text-[11px] italic text-gray-400">Click to configure</p>
  }
}

export const FlowNodeMemo = memo(FlowNodeComponent)
