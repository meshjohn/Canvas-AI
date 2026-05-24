"use client"

import { useState, useCallback } from "react"
import { Trash2 } from "lucide-react"
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react"
import type { EdgeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import type { CanvasEdge } from "@/types/canvas"

type LiveEdgeData = LiveObject<{
  data: LiveObject<{ label?: string }>
}>

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")

  const updateEdgeLabel = useMutation(
    ({ storage }, newLabel: string) => {
      const edge = storage.get("flow").get("edges").get(id)
      if (!edge) return
      ;(edge as unknown as LiveEdgeData).get("data").set("label", newLabel)
    },
    [id]
  )

  const deleteEdge = useMutation(
    ({ storage }) => {
      const flow = storage.get("flow")
      if (!flow) return
      flow.get("edges").delete(id)
    },
    [id]
  )

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const label = data?.label ?? ""
  const isActive = selected || isHovered || isEditing

  // Core colors mapping the sleek dark-cyberpunk aesthetic
  const stroke = isActive ? "var(--color-accent-primary)" : "rgba(255, 255, 255, 0.35)"
  const glowStroke = isActive ? "var(--color-accent-primary)" : "rgba(255, 255, 255, 0.1)"

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setDraftLabel(label)
      setIsEditing(true)
    },
    [label]
  )

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    updateEdgeLabel(draftLabel.trim())
  }, [draftLabel, updateEdgeLabel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        e.currentTarget.blur()
      }
    },
    []
  )

  return (
    <>
      {/* Background glow "tube" path */}
      <path
        d={edgePath}
        fill="none"
        stroke={glowStroke}
        strokeWidth={isActive ? 5 : 2}
        style={{
          filter: isActive ? "blur(4px) drop-shadow(0 0 4px var(--color-accent-primary))" : "none",
          opacity: isActive ? 0.65 : 0.15,
          transition: "stroke 0.25s, stroke-width 0.25s, filter 0.25s, opacity 0.25s",
          pointerEvents: "none",
        }}
      />

      {/* Wide invisible stroke makes the edge easy to hover and click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={startEditing}
      />

      {/* Main flowing edge line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: isActive ? 2 : 1.5,
          strokeDasharray: isActive ? "6 4" : "none",
          strokeLinecap: "round",
          animation: isActive ? "dashFlow 1.2s linear infinite" : "none",
          transition: "stroke 0.25s, stroke-width 0.25s",
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex items-center gap-1.5"
        >
          {isEditing ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: `${Math.max((draftLabel.length + 2) * 8, 80)}px`,
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-accent-primary)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 12,
                outline: "none",
                textAlign: "center",
                boxShadow: "0 0 12px rgba(0, 200, 212, 0.25)",
              }}
            />
          ) : (
            <>
              {label ? (
                <div
                  onClick={startEditing}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    background: "rgba(17, 17, 20, 0.8)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: "var(--color-text-primary)",
                    border: isActive ? "1px solid rgba(0, 200, 212, 0.4)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 9999,
                    padding: "3px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    boxShadow: isActive ? "0 0 10px rgba(0, 200, 212, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 10px rgba(0, 0, 0, 0.3)",
                    transition: "border 0.2s, box-shadow 0.2s, background 0.2s",
                  }}
                >
                  {label}
                </div>
              ) : selected ? (
                <div
                  onClick={startEditing}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    color: "var(--color-accent-primary)",
                    background: "rgba(0, 200, 212, 0.08)",
                    border: "1px dashed rgba(0, 200, 212, 0.35)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    padding: "3px 10px",
                    userSelect: "none",
                    animation: "breathe 2s ease-in-out infinite",
                    boxShadow: "0 2px 8px rgba(0, 200, 212, 0.1)",
                  }}
                >
                  tap to label
                </div>
              ) : null}

              {selected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteEdge()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    background: "rgba(17, 17, 20, 0.8)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: "var(--color-text-muted)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.2s",
                  }}
                  className="hover:bg-red-950/40 hover:text-[var(--color-state-error)] hover:border-red-500/30 hover:scale-110 active:scale-95 touch-target"
                  title="Delete Edge"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
