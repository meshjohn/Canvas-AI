"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Handle, Position, NodeResizer, NodeToolbar } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import type { CanvasNode, NodeShape } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"

const DEFAULT_FILL = NODE_COLORS[0].fill
const DEFAULT_TEXT = NODE_COLORS[0].text
const BORDER_REST = "rgba(255,255,255,0.08)"
const BORDER_HOVER = "rgba(255,255,255,0.2)"
const BORDER_SELECTED = "rgba(255,255,255,0.35)"
const RESIZER_COLOR = "rgba(255,255,255,0.3)"

const MIN_WIDTH = 60
const MIN_HEIGHT = 40

const HANDLE_CLS =
  "!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-all duration-200 group-hover/node:opacity-100 group-hover/node:scale-100"

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.2)",
}

const RESIZER_LINE_STYLE: React.CSSProperties = {
  borderColor: RESIZER_COLOR,
  borderWidth: 1,
}

/** Lighten a hex color by mixing toward white */
function lightenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  const lr = Math.min(255, Math.round(r + (255 - r) * amount))
  const lg = Math.min(255, Math.round(g + (255 - g) * amount))
  const lb = Math.min(255, Math.round(b + (255 - b) * amount))
  return `rgb(${lr}, ${lg}, ${lb})`
}

function DiamondShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ filter: `drop-shadow(0 0 8px ${fill})` }}>
      <defs>
        <linearGradient id={`dg-${fill.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lightenColor(fill, 0.12)} />
          <stop offset="100%" stopColor={fill} />
        </linearGradient>
      </defs>
      <polygon points="50,0 100,50 50,100 0,50" fill={`url(#dg-${fill.replace("#", "")})`} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function HexagonShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ filter: `drop-shadow(0 0 8px ${fill})` }}>
      <defs>
        <linearGradient id={`hg-${fill.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lightenColor(fill, 0.12)} />
          <stop offset="100%" stopColor={fill} />
        </linearGradient>
      </defs>
      <polygon points="25,0 75,0 100,50 75,100 25,100 0,50" fill={`url(#hg-${fill.replace("#", "")})`} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function CylinderShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ filter: `drop-shadow(0 0 8px ${fill})` }}>
      <defs>
        <linearGradient id={`cg-${fill.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lightenColor(fill, 0.1)} />
          <stop offset="100%" stopColor={fill} />
        </linearGradient>
      </defs>
      <rect x="0" y="15" width="100" height="70" fill={`url(#cg-${fill.replace("#", "")})`} />
      <line x1="0" y1="15" x2="0" y2="85" stroke={stroke} strokeWidth="1.5" />
      <line x1="100" y1="15" x2="100" y2="85" stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="85" rx="50" ry="15" fill={`url(#cg-${fill.replace("#", "")})`} stroke={stroke} strokeWidth="1.5" />
      <ellipse cx="50" cy="15" rx="50" ry="15" fill={lightenColor(fill, 0.08)} stroke={stroke} strokeWidth="1.5" />
    </svg>
  )
}

function cssBorderRadius(shape: NodeShape): string {
  if (shape === "pill") return "9999px"
  if (shape === "circle") return "50%"
  return "12px"
}

interface ColorSwatchProps {
  pair: (typeof NODE_COLORS)[number]
  isActive: boolean
  onSelect: (fill: string, text: string) => void
}

function ColorSwatch({ pair, isActive, onSelect }: ColorSwatchProps) {
  return (
    <button
      className="nodrag nopan"
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: pair.fill,
        border: isActive ? `2px solid ${pair.text}` : "2px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        flexShrink: 0,
        outline: "none",
        transition: "box-shadow 0.15s, transform 0.15s",
        transform: isActive ? "scale(1.15)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 6px 2px ${pair.text}55`
        ;(e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = "none"
        ;(e.currentTarget as HTMLButtonElement).style.transform = isActive ? "scale(1.15)" : "scale(1)"
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(pair.fill, pair.text)
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  )
}

type LiveNodeData = LiveObject<{
  data: LiveObject<{ label: string; color?: string; textColor?: string; shape?: NodeShape }>
}>

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const fill = data.color ?? DEFAULT_FILL
  const textColor = data.textColor ?? DEFAULT_TEXT
  const shape = data.shape ?? "rectangle"
  const stroke = selected ? BORDER_SELECTED : BORDER_REST
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder"

  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const editRef = useRef<HTMLDivElement>(null)

  const updateNodeLabel = useMutation(({ storage }, newLabel: string) => {
    const node = storage.get("flow").get("nodes").get(id)
    if (!node) return
    ;(node as unknown as LiveNodeData).get("data").set("label", newLabel)
  }, [id])

  const updateNodeColor = useMutation(({ storage }, colorFill: string, colorText: string) => {
    const node = storage.get("flow").get("nodes").get(id)
    if (!node) return
    const liveData = (node as unknown as LiveNodeData).get("data")
    liveData.set("color", colorFill)
    liveData.set("textColor", colorText)
  }, [id])

  const deleteNode = useMutation(({ storage }) => {
    const flow = storage.get("flow")
    if (!flow) return
    const nodes = flow.get("nodes")
    const edges = flow.get("edges")
    
    // Delete the node
    nodes.delete(id)
    
    // Delete connected edges
    for (const edgeId of edges.keys()) {
      const edge = edges.get(edgeId)
      if (edge) {
        const source = edge.get("source")
        const target = edge.get("target")
        if (source === id || target === id) {
          edges.delete(edgeId)
        }
      }
    }
  }, [id])

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const commitEdit = useCallback(() => {
    const value = editRef.current?.textContent ?? ""
    setIsEditing(false)
    updateNodeLabel(value)
  }, [updateNodeLabel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === "Escape" || e.key === "Enter") {
      commitEdit()
    }
  }, [commitEdit])

  useEffect(() => {
    if (!isEditing || !editRef.current) return
    const el = editRef.current
    el.textContent = data.label ?? ""
    el.focus()
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  // Build the glow box-shadow based on state
  const glowShadow = selected
    ? `0 0 20px 4px ${textColor}40, 0 0 40px 8px ${fill}30`
    : isHovered
      ? `0 0 14px 2px ${fill}35`
      : `0 0 8px 1px ${fill}18`

  const currentBorder = selected ? BORDER_SELECTED : isHovered ? BORDER_HOVER : BORDER_REST

  const labelContent = (
    <span
      className={isSvg ? "relative z-10 truncate px-3" : "truncate px-3"}
      style={{
        color: textColor,
        visibility: isEditing ? "hidden" : "visible",
        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
      }}
    >
      {data.label || (
        <span style={{ animation: "breathe 3s ease-in-out infinite" }}>
          Label
        </span>
      )}
    </span>
  )

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        animation: "nodeAppear 0.3s ease-out",
        transition: "transform 0.2s ease, box-shadow 0.25s ease",
        transform: isHovered && !selected ? "scale(1.02)" : "scale(1)",
      }}
      className="group/node relative flex items-center justify-center text-sm font-medium"
      onDoubleClick={startEditing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeResizer
        isVisible={selected ?? false}
        color={RESIZER_COLOR}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={RESIZER_HANDLE_STYLE}
        lineStyle={RESIZER_LINE_STYLE}
      />

      <NodeToolbar isVisible={selected ?? false} position={Position.Top}>
        <div className="nodrag nopan flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface/95 px-2.5 py-1.5 shadow-xl backdrop-blur-xl"
          style={{ animation: "nodeAppear 0.2s ease-out" }}>
          <button
            onClick={startEditing}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-5 w-5 items-center justify-center rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors cursor-pointer touch-target"
            title="Edit Label"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <div className="w-[1px] h-3 bg-border-default mx-0.5" />
          {NODE_COLORS.map((pair) => (
            <ColorSwatch
              key={pair.fill}
              pair={pair}
              isActive={pair.fill === fill}
              onSelect={updateNodeColor}
            />
          ))}
          <div className="w-[1px] h-3 bg-border-default mx-0.5" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteNode()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-5 w-5 items-center justify-center rounded-full text-text-muted hover:bg-red-950/40 hover:text-[var(--color-state-error)] transition-colors cursor-pointer touch-target"
            title="Delete Node"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </NodeToolbar>

      {isSvg ? (
        <>
          <div className="absolute inset-0" style={{ filter: selected ? `drop-shadow(0 0 12px ${textColor}50)` : undefined }}>
            {shape === "diamond" && <DiamondShape fill={fill} stroke={currentBorder} />}
            {shape === "hexagon" && <HexagonShape fill={fill} stroke={currentBorder} />}
            {shape === "cylinder" && <CylinderShape fill={fill} stroke={currentBorder} />}
          </div>
          {labelContent}
        </>
      ) : (
        <div
          style={{
            background: `linear-gradient(145deg, ${lightenColor(fill, 0.08)}, ${fill})`,
            borderRadius: cssBorderRadius(shape),
            border: `1px solid ${currentBorder}`,
            width: "100%",
            height: "100%",
            boxShadow: `${glowShadow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
            transition: "box-shadow 0.25s ease, border-color 0.2s ease",
          }}
          className="flex items-center justify-center"
        >
          {labelContent}
        </div>
      )}

      {isEditing && (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center text-center text-sm font-medium outline-none cursor-text"
          style={{ color: textColor, wordBreak: "break-word", padding: "0 12px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}

      <Handle id="top" type="source" position={Position.Top} className={HANDLE_CLS} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={HANDLE_CLS} />
      <Handle id="left" type="source" position={Position.Left} className={HANDLE_CLS} />
      <Handle id="right" type="source" position={Position.Right} className={HANDLE_CLS} />
    </div>
  )
}
