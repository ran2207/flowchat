import type { FlowNode, FlowNodeType, WaitCondition } from '@flowchat/shared'

export interface NodeExecutionResult {
  outputHandle: string
  data?: Record<string, unknown>
  waitFor?: WaitCondition
}

export interface NodeExecutor {
  readonly type: FlowNodeType
  execute(
    node: FlowNode,
    context: ExecutionContext,
    services: ExecutionServices,
  ): Promise<NodeExecutionResult>
}

export interface ExecutionContext {
  executionId: string
  flowId: string
  contactId: string
  tenantId: string
  currentNodeId: string
  variables: Record<string, unknown>
  stepCount: number
}

export interface ExecutionServices {
  sendMessage: (contactId: string, content: unknown) => Promise<void>
  getContact: (contactId: string) => Promise<Record<string, unknown>>
  updateContact: (contactId: string, data: Record<string, unknown>) => Promise<void>
  addTag: (contactId: string, tagName: string) => Promise<void>
  removeTag: (contactId: string, tagName: string) => Promise<void>
  httpRequest: (config: HttpRequestConfig) => Promise<unknown>
  scheduleResume: (executionId: string, delayMs: number) => Promise<void>
}

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers?: Record<string, string>
  body?: unknown
}
