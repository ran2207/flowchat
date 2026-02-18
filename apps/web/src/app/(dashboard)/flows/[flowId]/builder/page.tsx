'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowCanvas } from '@/components/flow-builder/flow-canvas'
import { useFlowBuilderStore } from '@/stores/flow-builder.store'

export default function FlowBuilderPage() {
  const params = useParams()
  const flowId = params.flowId as string
  const setFlowMeta = useFlowBuilderStore((s) => s.setFlowMeta)
  const loadFlow = useFlowBuilderStore((s) => s.loadFlow)

  useEffect(() => {
    if (flowId === 'new') {
      setFlowMeta('new', 'Untitled Flow', 'draft')
      loadFlow([], [])
    } else {
      setFlowMeta(flowId, `Flow ${flowId}`, 'draft')
      loadFlow([], [])
    }
  }, [flowId, setFlowMeta, loadFlow])

  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
