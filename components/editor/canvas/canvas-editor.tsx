"use client"

import { useCallback, useEffect, useRef } from "react"
import { useMyPresence } from "@liveblocks/react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  MarkerType,
  useNodes,
  useEdges,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useReactFlow } from "@xyflow/react"
import type { Connection } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react"
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"
import { CanvasNodeComponent } from "@/components/editor/canvas/canvas-node"
import { CanvasEdgeComponent } from "@/components/editor/canvas/canvas-edge"
import { ShapePanel } from "@/components/editor/canvas/shape-panel"
import { CanvasControls } from "@/components/editor/canvas/canvas-controls"
import { PresenceCursors } from "@/components/editor/canvas/presence-cursors"
import { CollaboratorAvatars } from "@/components/editor/canvas/collaborator-avatars"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"
import { useAutoLayout, type LayoutDirection } from "@/hooks/use-auto-layout"
import { useState } from "react"

const nodeTypes = { canvasNode: CanvasNodeComponent }
const edgeTypes = { canvasEdge: CanvasEdgeComponent }

const CONNECTION_LINE_STYLE: React.CSSProperties = {
  stroke: "var(--color-accent-primary)",
  strokeWidth: 2,
  strokeDasharray: "6 4",
  strokeLinecap: "round",
  animation: "dashFlow 1.2s linear infinite",
}

let nodeCounter = 0
let edgeCounter = 0

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeCounter}`
}

function generateEdgeId(): string {
  return `edge-${Date.now()}-${++edgeCounter}`
}

interface CanvasEditorProps {
  projectId: string
  pendingTemplate?: CanvasTemplate | null
  onTemplateImported?: () => void
  onSaveStatusChange?: (status: SaveStatus) => void
  onSaveReady?: (saveFn: () => void) => void
}

export function CanvasEditor({ projectId, pendingTemplate, onTemplateImported, onSaveStatusChange, onSaveReady }: CanvasEditorProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })

  const reactFlow = useReactFlow()
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = reactFlow
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Keep stable refs to the latest nodes/edges so the import effect
  // can read current state without being in its dependency array.
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  })

  useEffect(() => {
    if (!pendingTemplate) return
    const currentNodes = nodesRef.current
    const currentEdges = edgesRef.current

    onNodesChange([
      ...currentNodes.map((nd) => ({ type: "remove" as const, id: nd.id })),
      ...pendingTemplate.nodes.map((nd) => ({ type: "add" as const, item: nd })),
    ])
    onEdgesChange([
      ...currentEdges.map((ed) => ({ type: "remove" as const, id: ed.id })),
      ...pendingTemplate.edges.map((ed) => ({ type: "add" as const, item: ed })),
    ])

    onTemplateImported?.()
    setTimeout(() => fitView({ duration: 300 }), 120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTemplate])

  // Load saved canvas from Vercel Blob when room is empty on first mount.
  const didLoadRef = useRef(false)
  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true

    if (nodesRef.current.length > 0 || edgesRef.current.length > 0) return

    fetch(`/api/projects/${projectId}/canvas`)
      .then((res) => res.json())
      .then(({ canvas }: { canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null }) => {
        if (!canvas) return
        if (canvas.nodes?.length) {
          onNodesChange(canvas.nodes.map((nd) => ({ type: "add" as const, item: nd })))
        }
        if (canvas.edges?.length) {
          onEdgesChange(canvas.edges.map((ed) => ({ type: "add" as const, item: ed })))
        }
        setTimeout(() => fitView({ duration: 300 }), 120)
      })
      .catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { status: saveStatus, save } = useCanvasAutosave(projectId, nodes, edges)
  const autoLayout = useAutoLayout<CanvasNode>()
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("TB")
  
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    )
  }, [])

  const onSelectShape = useCallback(
    (shape: NodeShape) => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      const clientX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
      const clientY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
      const center = screenToFlowPosition({ x: clientX, y: clientY })
      const size = SHAPE_DEFAULTS[shape]
      const position = {
        x: center.x - size.width / 2,
        y: center.y - size.height / 2,
      }

      const id = generateNodeId(shape)
      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: NODE_COLORS[0].fill, textColor: NODE_COLORS[0].text, shape },
        width: size.width,
        height: size.height,
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange]
  )

  const onTidyUp = useCallback(() => {
    autoLayout(layoutDirection, onNodesChange)
  }, [autoLayout, layoutDirection, onNodesChange])

  const onToggleLayoutDirection = useCallback(() => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"))
  }, [])

  const onExportImage = useCallback(() => {
    const reactFlowEl = document.querySelector(".react-flow__viewport") as HTMLElement
    if (!reactFlowEl) return

    import("html-to-image")
      .then((module) => {
        module.toPng(reactFlowEl, {
          backgroundColor: "var(--color-bg-base)",
          quality: 1,
        })
          .then((dataUrl) => {
            const link = document.createElement("a")
            link.download = `canvas-${projectId}.png`
            link.href = dataUrl
            link.click()
          })
      })
      .catch((err) => {
        console.error("Failed to export image", err)
      })
  }, [projectId])

  useEffect(() => { onSaveStatusChange?.(saveStatus) }, [saveStatus, onSaveStatusChange])
  useEffect(() => { onSaveReady?.(save) }, [save, onSaveReady])

  // Delete selected nodes/edges on Delete or Backspace via Liveblocks mutation helpers.
  const rfNodes = useNodes<CanvasNode>()
  const rfEdges = useEdges<CanvasEdge>()
  const rfNodesRef = useRef(rfNodes)
  const rfEdgesRef = useRef(rfEdges)
  useEffect(() => {
    rfNodesRef.current = rfNodes
    rfEdgesRef.current = rfEdges
  })
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      const selNodes = rfNodesRef.current.filter((n) => n.selected)
      const selEdges = rfEdgesRef.current.filter((ed) => ed.selected)
      if (selNodes.length || selEdges.length) onDelete({ nodes: selNodes, edges: selEdges })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onDelete])

  const [, updateMyPresence] = useMyPresence()

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      updateMyPresence({ cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }) })
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0]
        updateMyPresence({ cursor: screenToFlowPosition({ x: touch.clientX, y: touch.clientY }) })
      }
    },
    [screenToFlowPosition, updateMyPresence]
  )

  const onTouchEnd = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts({ reactFlow, undo, redo })

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      onEdgesChange([
        {
          type: "add",
          item: {
            id: generateEdgeId(),
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle ?? null,
            targetHandle: connection.targetHandle ?? null,
            type: "canvasEdge",
            data: { label: "" },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "rgba(255,255,255,0.4)",
              width: 16,
              height: 16,
            },
          } as CanvasEdge,
        },
      ])
    },
    [onEdgesChange]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData("application/ghost-shape")
      if (!raw) return

      let payload: { shape: NodeShape; size: { width: number; height: number } }
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      const center = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const position = {
        x: center.x - payload.size.width / 2,
        y: center.y - payload.size.height / 2,
      }

      const id = generateNodeId(payload.shape)
      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: NODE_COLORS[0].fill, textColor: NODE_COLORS[0].text, shape: payload.shape },
        width: payload.size.width,
        height: payload.size.height,
      }

      onNodesChange([{ type: "add", item: newNode }])
    },
    [screenToFlowPosition, onNodesChange]
  )

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Touch-friendly overrides for shape handles and resizers */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          border: 2px solid var(--color-bg-base) !important;
          background-color: var(--color-accent-primary) !important;
          z-index: 50;
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
          opacity: 0 !important;
          transform: scale(0.5);
        }
        /* Expand hit area for handles without increasing visual size */
        .react-flow__handle::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
        }
        /* Show and animate handles when the node is hovered */
        .group\\/node:hover .react-flow__handle {
          opacity: 1 !important;
          transform: scale(1) !important;
          animation: handlePulse 2s ease-out infinite;
        }
        /* Show and animate handles when the node is selected (for touch screens) */
        .react-flow__node.selected .react-flow__handle {
          opacity: 1 !important;
          transform: scale(1) !important;
          animation: handlePulse 2s ease-out infinite;
        }
        /* Style handle specifically on hover */
        .react-flow__handle:hover {
          background-color: #ffffff !important;
          transform: scale(1.3) !important;
          box-shadow: 0 0 8px var(--color-accent-primary) !important;
        }
        /* Larger resizer handles for touch accessibility */
        .react-flow__node-resizer__handle {
          width: 16px !important;
          height: 16px !important;
          background: #fff !important;
          border: 1px solid var(--color-accent-primary) !important;
          border-radius: 4px !important;
          position: relative;
        }
        /* Expand touch target for resizer handles */
        .react-flow__node-resizer__handle::after {
          content: '';
          position: absolute;
          top: -12px;
          left: -12px;
          right: -12px;
          bottom: -12px;
        }
        /* Ensure the selection pane doesn't block touch gestures */
        .react-flow__selectionpane {
          pointer-events: none;
        }
      `}} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={CONNECTION_LINE_STYLE}
        connectionLineType={ConnectionLineType.SmoothStep}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
        selectionOnDrag={isTouch ? false : true}
        panOnDrag={isTouch ? true : [1, 2]} // Allows panning with single finger on touch, or middle/right click on desktop
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(0, 200, 212, 0.04) 0%, var(--color-bg-base) 100%)",
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--color-border-subtle)"
        />

      </ReactFlow>
      <CanvasControls
        onZoomIn={() => zoomIn({ duration: 200 })}
        onZoomOut={() => zoomOut({ duration: 200 })}
        onFitView={() => fitView({ duration: 200 })}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onTidyUp={onTidyUp}
        layoutDirection={layoutDirection}
        onToggleLayoutDirection={onToggleLayoutDirection}
        onExportImage={onExportImage}
      />
      <ShapePanel onSelectShape={onSelectShape} />
      <PresenceCursors />
      <CollaboratorAvatars />
      <SaveStatusIndicator status={saveStatus} />
    </div>
  )
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null
  return (
    <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2">
      <span
        className={
          "rounded-full px-3 py-1 text-xs font-medium " +
          (status === "saving"
            ? "bg-bg-elevated text-text-faint"
            : status === "saved"
              ? "bg-bg-elevated text-text-secondary"
              : "bg-bg-elevated text-red-400")
        }
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save failed"}
      </span>
    </div>
  )
}
