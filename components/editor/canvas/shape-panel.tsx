"use client"

import { useState } from "react"
import { RectangleHorizontal, Diamond, Circle, Pill, Cylinder, Hexagon, Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NODE_SHAPES, SHAPE_DEFAULTS, NODE_COLORS, type NodeShape } from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

const PREVIEW_FILL = NODE_COLORS[0].fill
const PREVIEW_STROKE = "rgba(255,255,255,0.3)"

function PreviewDiamond() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="50,0 100,50 50,100 0,50" fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth="2" />
    </svg>
  )
}

function PreviewHexagon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth="2" />
    </svg>
  )
}

function PreviewCylinder() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="0" y="15" width="100" height="70" fill={PREVIEW_FILL} />
      <line x1="0" y1="15" x2="0" y2="85" stroke={PREVIEW_STROKE} strokeWidth="2" />
      <line x1="100" y1="15" x2="100" y2="85" stroke={PREVIEW_STROKE} strokeWidth="2" />
      <ellipse cx="50" cy="85" rx="50" ry="15" fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth="2" />
      <ellipse cx="50" cy="15" rx="50" ry="15" fill={PREVIEW_FILL} stroke={PREVIEW_STROKE} strokeWidth="2" />
    </svg>
  )
}

function previewBorderRadius(shape: NodeShape): string {
  if (shape === "pill") return "9999px"
  if (shape === "circle") return "50%"
  return "12px"
}

function ShapePreview({ shape }: { shape: NodeShape }) {
  const { width, height } = SHAPE_DEFAULTS[shape]
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"

  return (
    <div style={{ width, height, pointerEvents: "none" }}>
      {isSvg ? (
        <>
          {shape === "diamond" && <PreviewDiamond />}
          {shape === "hexagon" && <PreviewHexagon />}
          {shape === "cylinder" && <PreviewCylinder />}
        </>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: PREVIEW_FILL,
            border: `1px solid ${PREVIEW_STROKE}`,
            borderRadius: previewBorderRadius(shape),
          }}
        />
      )}
    </div>
  )
}

interface DragState {
  shape: NodeShape
  x: number
  y: number
}

interface ShapePanelProps {
  onSelectShape?: (shape: NodeShape) => void
}

export function ShapePanel({ onSelectShape }: ShapePanelProps) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  function handleDragStart(event: React.DragEvent, shape: NodeShape) {
    const payload = JSON.stringify({ shape, size: SHAPE_DEFAULTS[shape] })
    event.dataTransfer.setData("application/ghost-shape", payload)
    event.dataTransfer.effectAllowed = "copy"

    // Replace the default browser drag image with a transparent pixel
    const ghost = document.createElement("div")
    ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;"
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)

    setDrag({ shape, x: event.clientX, y: event.clientY })
  }

  function handleDrag(event: React.DragEvent, shape: NodeShape) {
    // clientX/clientY are 0,0 on the final drag event before dragend — skip it
    if (event.clientX === 0 && event.clientY === 0) return
    setDrag({ shape, x: event.clientX, y: event.clientY })
  }

  function handleDragEnd() {
    setDrag(null)
  }

  const previewSize = drag ? SHAPE_DEFAULTS[drag.shape] : null

  return (
    <>
      {drag && previewSize && (
        <div
          style={{
            position: "fixed",
            left: drag.x - previewSize.width / 2,
            top: drag.y - previewSize.height / 2,
            opacity: 0.65,
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <ShapePreview shape={drag.shape} />
        </div>
      )}

      {/* Desktop Panel (sm and above) */}
      <div
        className="hidden sm:flex pointer-events-none absolute inset-x-0 bottom-4 justify-center"
        style={{
          animation: "panelSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/95 px-3 py-2 shadow-xl backdrop-blur-xl">
          {NODE_SHAPES.map((shape, index) => {
            const Icon = SHAPE_ICONS[shape]
            const isDraggingThis = drag?.shape === shape
            return (
              <button
                key={shape}
                draggable
                onDragStart={(e) => handleDragStart(e, shape)}
                onDrag={(e) => handleDrag(e, shape)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectShape?.(shape)}
                style={{
                  animation: "panelSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
                  animationDelay: `${index * 30}ms`,
                }}
                className={`group relative flex h-9 w-9 cursor-grab items-center justify-center rounded-xl transition-all duration-200 active:cursor-grabbing ${
                  isDraggingThis
                    ? "bg-bg-subtle text-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)] shadow-[0_0_12px_rgba(0,200,212,0.3)]"
                    : "text-text-muted hover:bg-bg-elevated hover:text-text-primary hover:scale-110"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${isDraggingThis ? "scale-110" : "group-hover:scale-115"}`} />
                
                {/* Tooltip */}
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-bg-surface border border-border-default px-2 py-0.5 text-[10px] font-semibold tracking-wider text-text-primary opacity-0 shadow-xl transition-all duration-200 group-hover:-top-9 group-hover:opacity-100 uppercase scale-95 group-hover:scale-100 whitespace-nowrap z-50">
                  {shape}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Collapsible Shapes FAB (below sm) */}
      <div className="sm:hidden absolute bottom-4 right-4 z-40">
        {isExpanded && (
          <>
            {/* Backdrop click interceptor */}
            <div className="fixed inset-0 z-40" onClick={() => setIsExpanded(false)} />

            {/* Shape Selection Grid */}
            <div
              className="absolute bottom-12 right-0 z-50 flex flex-col gap-2.5 rounded-2xl border border-border-subtle bg-bg-surface/95 p-3.5 shadow-2xl backdrop-blur-2xl w-48 border-r-[1.5px] border-r-accent-ai"
              style={{
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px var(--color-accent-ai-dim)",
                animation: "panelSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
              }}
            >
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-border-default/60 pb-1.5 px-0.5">
                <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">Add Shape</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent-ai shadow-[0_0_6px_var(--color-accent-ai)] animate-pulse" />
              </div>

              {/* Grid of Shapes */}
              <div className="grid grid-cols-3 gap-2">
                {NODE_SHAPES.map((shape) => {
                  const Icon = SHAPE_ICONS[shape]
                  return (
                    <button
                      key={shape}
                      onClick={() => {
                        onSelectShape?.(shape)
                        setIsExpanded(false)
                      }}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border-default bg-bg-elevated/40 p-2 text-text-muted transition-all duration-200 active:scale-90 active:bg-accent-ai-dim active:text-accent-ai-text hover:text-text-primary active:border-accent-ai/30 touch-target cursor-pointer"
                    >
                      <Icon className="h-4.5 w-4.5 text-text-secondary" />
                      <span className="text-[8px] font-semibold tracking-wider uppercase truncate max-w-full">
                        {shape === "rectangle" ? "rect" : shape}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Floating Action Button Trigger */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            boxShadow: isExpanded
              ? "0 0 15px var(--color-accent-ai), 0 4px 20px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-bg-surface/95 shadow-xl backdrop-blur-xl transition-all duration-200 active:scale-90 z-50 cursor-pointer ${
            isExpanded
              ? "ring-2 ring-accent-ai border-transparent text-accent-ai scale-105"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Plus className={`h-5 w-5 transition-transform duration-250 ${isExpanded ? "rotate-45 text-accent-ai" : "text-text-muted"}`} />
        </button>
      </div>
    </>
  )
}

