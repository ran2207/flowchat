'use client'

import { create } from 'zustand'
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type XYPosition,
} from '@xyflow/react'

export type FlowNodeData = {
  label: string
  nodeType: string
  category: string
  config: Record<string, unknown>
  [key: string]: unknown
}

export type FlowNode = Node<FlowNodeData>
export type FlowEdge = Edge

interface HistoryEntry {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface FlowBuilderState {
  flowId: string | null
  flowName: string
  flowStatus: 'draft' | 'published' | 'archived'
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  isDirty: boolean
  isSaving: boolean

  history: HistoryEntry[]
  historyIndex: number

  setFlowMeta: (id: string, name: string, status: 'draft' | 'published' | 'archived') => void
  onNodesChange: OnNodesChange<FlowNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (type: string, category: string, label: string, position: XYPosition) => string
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  loadFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  markSaved: () => void
  setSaving: (saving: boolean) => void
}

let nodeCounter = 0

const generateNodeId = () => {
  nodeCounter++
  return `node_${Date.now()}_${nodeCounter}`
}

const pushHistory = (state: FlowBuilderState): Partial<FlowBuilderState> => {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push({ nodes: structuredClone(state.nodes), edges: structuredClone(state.edges) })

  if (newHistory.length > 50) {
    newHistory.shift()
  }

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }
}

export const useFlowBuilderStore = create<FlowBuilderState>((set, get) => ({
  flowId: null,
  flowName: 'Untitled Flow',
  flowStatus: 'draft',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  isSaving: false,
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,

  setFlowMeta: (id, name, status) => set({ flowId: id, flowName: name, flowStatus: status }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
      isDirty: true,
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }))
  },

  onConnect: (connection: Connection) => {
    set((state) => {
      const newEdges = addEdge(
        {
          ...connection,
          id: `edge_${connection.source}_${connection.sourceHandle ?? 'default'}_${connection.target}`,
          type: 'smoothstep',
          animated: true,
        },
        state.edges,
      )
      return {
        edges: newEdges,
        isDirty: true,
        ...pushHistory({ ...state, edges: newEdges }),
      }
    })
  },

  addNode: (type, category, label, position) => {
    const id = generateNodeId()
    const newNode: FlowNode = {
      id,
      type: 'flowNode',
      position,
      data: {
        label,
        nodeType: type,
        category,
        config: {},
      },
    }

    set((state) => {
      const newNodes = [...state.nodes, newNode]
      return {
        nodes: newNodes,
        selectedNodeId: id,
        isDirty: true,
        ...pushHistory({ ...state, nodes: newNodes }),
      }
    })

    return id
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n,
      ),
      isDirty: true,
    }))
  },

  updateNodeLabel: (nodeId, label) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
      ),
      isDirty: true,
    }))
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const newNodes = state.nodes.filter((n) => n.id !== nodeId)
      const newEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      return {
        nodes: newNodes,
        edges: newEdges,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
        ...pushHistory({ ...state, nodes: newNodes, edges: newEdges }),
      }
    })
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  loadFlow: (nodes, edges) => {
    set({
      nodes,
      edges,
      isDirty: false,
      history: [{ nodes: structuredClone(nodes), edges: structuredClone(edges) }],
      historyIndex: 0,
      selectedNodeId: null,
    })
  },

  undo: () => {
    const state = get()
    if (state.historyIndex <= 0) return

    const prevIndex = state.historyIndex - 1
    const entry = state.history[prevIndex]
    set({
      nodes: structuredClone(entry.nodes),
      edges: structuredClone(entry.edges),
      historyIndex: prevIndex,
      isDirty: true,
    })
  },

  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return

    const nextIndex = state.historyIndex + 1
    const entry = state.history[nextIndex]
    set({
      nodes: structuredClone(entry.nodes),
      edges: structuredClone(entry.edges),
      historyIndex: nextIndex,
      isDirty: true,
    })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  markSaved: () => set({ isDirty: false }),
  setSaving: (saving) => set({ isSaving: saving }),
}))
