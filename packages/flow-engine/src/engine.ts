import type { FlowDefinition, ExecutionStep } from '@flowchat/shared'
import type { NodeExecutor, ExecutionContext, ExecutionServices, NodeExecutionResult } from './types'

const MAX_STEPS = 100

export class FlowExecutionEngine {
  private executors: Map<string, NodeExecutor> = new Map()

  registerExecutor(executor: NodeExecutor): void {
    this.executors.set(executor.type, executor)
  }

  async execute(
    flow: FlowDefinition,
    startNodeId: string,
    context: ExecutionContext,
    services: ExecutionServices,
  ): Promise<{ status: 'completed' | 'waiting' | 'failed'; history: ExecutionStep[] }> {
    const history: ExecutionStep[] = []
    let currentNodeId: string | null = startNodeId

    while (currentNodeId) {
      if (context.stepCount >= MAX_STEPS) {
        return {
          status: 'failed',
          history,
        }
      }

      const node = flow.nodes[currentNodeId]
      if (!node) {
        return { status: 'failed', history }
      }

      const executor = this.executors.get(node.type)
      if (!executor) {
        return { status: 'failed', history }
      }

      context.currentNodeId = currentNodeId
      context.stepCount++

      let result: NodeExecutionResult
      const enteredAt = new Date().toISOString()

      try {
        result = await executor.execute(node, context, services)
      } catch (error) {
        history.push({
          nodeId: currentNodeId,
          nodeType: node.type,
          enteredAt,
          exitedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        return { status: 'failed', history }
      }

      history.push({
        nodeId: currentNodeId,
        nodeType: node.type,
        enteredAt,
        exitedAt: new Date().toISOString(),
        edgeTaken: result.outputHandle,
        output: result.data,
      })

      if (result.waitFor) {
        return { status: 'waiting', history }
      }

      const nextEdge = flow.edges.find(
        (e) => e.source === currentNodeId && e.sourceHandle === result.outputHandle,
      )

      currentNodeId = nextEdge?.target ?? null
    }

    return { status: 'completed', history }
  }
}
