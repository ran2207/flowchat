'use client'

import { X } from 'lucide-react'
import { useFlowBuilderStore, type FlowNode } from '@/stores/flow-builder.store'
import { getNodeDefinition } from '../node-registry'
import { KeywordTriggerConfig } from './configs/keyword-trigger-config'
import { SendMessageConfig } from './configs/send-message-config'
import { ConditionConfig } from './configs/condition-config'
import { SmartDelayConfig } from './configs/smart-delay-config'
import { HttpRequestConfig } from './configs/http-request-config'
import { TagConfig } from './configs/tag-config'
import { AiReplyConfig } from './configs/ai-reply-config'
import { GenericConfig } from './configs/generic-config'

export const NodeConfigPanel = () => {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId)
  const nodes = useFlowBuilderStore((s) => s.nodes)
  const selectNode = useFlowBuilderStore((s) => s.selectNode)
  const updateNodeConfig = useFlowBuilderStore((s) => s.updateNodeConfig)
  const updateNodeLabel = useFlowBuilderStore((s) => s.updateNodeLabel)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) as FlowNode | undefined

  if (!selectedNode) return null

  const definition = getNodeDefinition(selectedNode.data.nodeType)
  if (!definition) return null

  const Icon = definition.icon

  const onConfigChange = (config: Record<string, unknown>) => {
    updateNodeConfig(selectedNode.id, config)
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: `${definition.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: definition.color }} />
          </div>
          <span className="text-sm font-semibold text-gray-800">{definition.label}</span>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Node Label</label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
        </div>

        <div className="h-px bg-gray-100" />

        <ConfigEditor
          nodeType={selectedNode.data.nodeType}
          config={selectedNode.data.config}
          onChange={onConfigChange}
        />
      </div>
    </div>
  )
}

const ConfigEditor = ({
  nodeType,
  config,
  onChange,
}: {
  nodeType: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}) => {
  switch (nodeType) {
    case 'keyword_trigger':
      return <KeywordTriggerConfig config={config} onChange={onChange} />
    case 'send_message':
      return <SendMessageConfig config={config} onChange={onChange} />
    case 'condition':
      return <ConditionConfig config={config} onChange={onChange} />
    case 'smart_delay':
      return <SmartDelayConfig config={config} onChange={onChange} />
    case 'http_request':
      return <HttpRequestConfig config={config} onChange={onChange} />
    case 'add_tag':
    case 'remove_tag':
      return <TagConfig config={config} onChange={onChange} />
    case 'ai_reply':
    case 'ai_step':
      return <AiReplyConfig config={config} onChange={onChange} />
    default:
      return <GenericConfig config={config} onChange={onChange} />
  }
}
