export type FlowStatus = 'draft' | 'published' | 'archived'
export type FlowExecutionStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'paused'

export type TriggerType =
  | 'keyword'
  | 'comment'
  | 'story_mention'
  | 'webhook'
  | 'schedule'
  | 'manual'
  | 'contact_event'

export type FlowNodeType =
  | 'send_message'
  | 'send_image'
  | 'send_video'
  | 'send_carousel'
  | 'send_quick_replies'
  | 'send_buttons'
  | 'add_tag'
  | 'remove_tag'
  | 'set_custom_field'
  | 'subscribe_sequence'
  | 'unsubscribe_sequence'
  | 'http_request'
  | 'notify_agent'
  | 'assign_to_agent'
  | 'go_to_flow'
  | 'condition'
  | 'random_split'
  | 'smart_delay'
  | 'wait_for_input'
  | 'datetime_condition'
  | 'ai_intent'
  | 'ai_reply'
  | 'ai_step'

export interface FlowNodePosition {
  x: number
  y: number
}

export interface FlowNodeMeta {
  label: string
  description?: string
  color?: string
}

export interface FlowNode {
  id: string
  type: FlowNodeType
  position: FlowNodePosition
  data: Record<string, unknown>
  meta: FlowNodeMeta
}

export interface FlowEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  label?: string
}

export interface FlowVariable {
  name: string
  type: 'text' | 'number' | 'boolean' | 'date'
  defaultValue?: unknown
}

export interface TriggerDefinition {
  type: TriggerType
  config: Record<string, unknown>
}

export interface FlowDefinition {
  nodes: Record<string, FlowNode>
  edges: FlowEdge[]
  variables: FlowVariable[]
}

export interface WaitCondition {
  type: 'user_input' | 'delay' | 'external'
  expiresAt?: string
  resumeNodeId: string
}

export interface ExecutionStep {
  nodeId: string
  nodeType: FlowNodeType
  enteredAt: string
  exitedAt?: string
  output?: unknown
  error?: string
  edgeTaken?: string
}
