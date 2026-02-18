'use client'

import { useCallback, useRef, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFlowBuilderStore, type FlowNode, type FlowEdge } from '@/stores/flow-builder.store'
import { FlowNodeMemo } from './nodes/flow-node'
import { NodePalette } from './node-palette'
import { NodeConfigPanel } from './panels/node-config-panel'
import { Toolbar } from './toolbar'
import { FlowAiAssistant } from '../ai/flow-ai-assistant'
import { type NodeDefinition } from './node-registry'

const nodeTypes: NodeTypes = {
  flowNode: FlowNodeMemo,
}

export const FlowCanvas = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reactFlowInstance = useRef<any>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const nodes = useFlowBuilderStore((s) => s.nodes)
  const edges = useFlowBuilderStore((s) => s.edges)
  const onNodesChange = useFlowBuilderStore((s) => s.onNodesChange)
  const onEdgesChange = useFlowBuilderStore((s) => s.onEdgesChange)
  const onConnect = useFlowBuilderStore((s) => s.onConnect)
  const addNode = useFlowBuilderStore((s) => s.addNode)
  const selectNode = useFlowBuilderStore((s) => s.selectNode)
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId)

  const onDragStart = useCallback(
    (event: React.DragEvent, definition: NodeDefinition) => {
      event.dataTransfer.setData('application/flowchat-node', JSON.stringify(definition))
      event.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const data = event.dataTransfer.getData('application/flowchat-node')
      if (!data) return

      const definition: NodeDefinition = JSON.parse(data)
      const rfInstance = reactFlowInstance.current
      if (!rfInstance || !reactFlowWrapper.current) return

      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      addNode(definition.type, definition.category, definition.label, position)
    },
    [addNode],
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onInit = useCallback((instance: any) => {
    reactFlowInstance.current = instance
  }, [])

  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  const handleSave = useCallback(() => {
    const state = useFlowBuilderStore.getState()
    console.log('Saving flow:', {
      nodes: state.nodes,
      edges: state.edges,
    })
    state.markSaved()
  }, [])

  const handlePublish = useCallback(() => {
    const state = useFlowBuilderStore.getState()
    console.log('Publishing flow:', {
      nodes: state.nodes,
      edges: state.edges,
    })
  }, [])

  const handleAiFlowGenerated = useCallback(
    (flow: {
      nodes: Record<string, { id: string; type: string; config: Record<string, unknown>; position: { x: number; y: number } }>
      edges: Array<{ source: string; target: string; sourceHandle?: string }>
    }) => {
      const state = useFlowBuilderStore.getState()
      const convertedNodes: FlowNode[] = Object.values(flow.nodes).map((n) => ({
        id: n.id,
        type: 'flowNode',
        position: n.position,
        data: {
          label: n.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          nodeType: n.type,
          category: n.type.startsWith('trigger_')
            ? 'trigger'
            : n.type.startsWith('send_')
              ? 'message'
              : n.type.startsWith('action_')
                ? 'action'
                : n.type.startsWith('ai_')
                  ? 'ai'
                  : 'logic',
          config: n.config,
        },
      }))
      const convertedEdges: FlowEdge[] = flow.edges.map((e, i) => ({
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        type: 'smoothstep',
        animated: true,
      }))
      state.loadFlow(convertedNodes, convertedEdges)
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2 })
      }, 100)
    },
    [],
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { strokeWidth: 2, stroke: '#94a3b8' },
    }),
    [],
  )

  return (
    <div className="flex h-screen flex-col">
      <Toolbar onSave={handleSave} onPublish={handlePublish} />

      <div className="flex flex-1 overflow-hidden">
        <NodePalette onDragStart={onDragStart} />

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
            <Controls
              showInteractive={false}
              className="!bg-white !border-gray-200 !shadow-sm"
            />
            <MiniMap
              nodeColor={(node) => {
                const fn = node as FlowNode
                const category = fn.data?.category
                const colors: Record<string, string> = {
                  trigger: '#22c55e',
                  message: '#3b82f6',
                  action: '#f59e0b',
                  logic: '#8b5cf6',
                  ai: '#ec4899',
                }
                return colors[category as string] ?? '#94a3b8'
              }}
              className="!bg-white !border-gray-200"
              maskColor="rgba(0,0,0,0.05)"
            />
          </ReactFlow>
        </div>

        {selectedNodeId && <NodeConfigPanel />}
      </div>

      <FlowAiAssistant onFlowGenerated={handleAiFlowGenerated} />
    </div>
  )
}
