'use client'

import { Undo2, Redo2, Save, Upload, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useFlowBuilderStore } from '@/stores/flow-builder.store'

interface ToolbarProps {
  onSave: () => void
  onPublish: () => void
}

export const Toolbar = ({ onSave, onPublish }: ToolbarProps) => {
  const flowName = useFlowBuilderStore((s) => s.flowName)
  const flowStatus = useFlowBuilderStore((s) => s.flowStatus)
  const isDirty = useFlowBuilderStore((s) => s.isDirty)
  const isSaving = useFlowBuilderStore((s) => s.isSaving)
  const undo = useFlowBuilderStore((s) => s.undo)
  const redo = useFlowBuilderStore((s) => s.redo)
  const canUndo = useFlowBuilderStore((s) => s.canUndo)
  const canRedo = useFlowBuilderStore((s) => s.canRedo)

  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/flows"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="h-6 w-px bg-gray-200" />

        <div>
          <h2 className="text-sm font-semibold text-gray-800">{flowName}</h2>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                flowStatus === 'published' ? 'bg-green-500' : 'bg-amber-500',
              )}
            />
            <span className="text-[10px] capitalize text-gray-500">{flowStatus}</span>
            {isDirty && <span className="text-[10px] text-amber-600">(unsaved)</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>

        <button
          onClick={onPublish}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Publish
        </button>
      </div>
    </div>
  )
}
