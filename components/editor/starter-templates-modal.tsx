"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates"

// Internal viewBox coordinate space — nodes are scaled/offset to fit here.
const VB_W = 500
const VB_H = 280
const VB_PAD = 20

interface TemplatePreviewProps {
  template: CanvasTemplate
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  if (template.nodes.length === 0) return null

  const minX = Math.min(...template.nodes.map((nd) => nd.position.x))
  const minY = Math.min(...template.nodes.map((nd) => nd.position.y))
  const maxX = Math.max(...template.nodes.map((nd) => nd.position.x + (nd.width ?? 140)))
  const maxY = Math.max(...template.nodes.map((nd) => nd.position.y + (nd.height ?? 60)))

  const bw = maxX - minX || 1
  const bh = maxY - minY || 1
  const scale = Math.min(
    (VB_W - VB_PAD * 2) / bw,
    (VB_H - VB_PAD * 2) / bh
  )

  const offsetX = (VB_W - bw * scale) / 2 - minX * scale
  const offsetY = (VB_H - bh * scale) / 2 - minY * scale

  const nodeMap = new Map(template.nodes.map((nd) => [nd.id, nd]))
  const markerId = `arr-${template.id}`

  return (
    // Wrapper keeps the 500:280 aspect ratio at any card width.
    <div className="w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>

        {/* edges drawn before nodes so they sit underneath */}
        {template.edges.map((edge) => {
          const src = nodeMap.get(edge.source)
          const tgt = nodeMap.get(edge.target)
          if (!src || !tgt) return null
          const sx = (src.position.x + (src.width ?? 140) / 2) * scale + offsetX
          const sy = (src.position.y + (src.height ?? 60) / 2) * scale + offsetY
          const tx = (tgt.position.x + (tgt.width ?? 140) / 2) * scale + offsetX
          const ty = (tgt.position.y + (tgt.height ?? 60) / 2) * scale + offsetY
          return (
            <line
              key={edge.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
              markerEnd={`url(#${markerId})`}
            />
          )
        })}

        {template.nodes.map((nd) => {
          const x = nd.position.x * scale + offsetX
          const y = nd.position.y * scale + offsetY
          const nw = (nd.width ?? 140) * scale
          const nh = (nd.height ?? 60) * scale
          const fill = nd.data.color ?? "#1F1F1F"
          const stroke = "rgba(255,255,255,0.2)"
          const sw = 1
          const shape = nd.data.shape ?? "rectangle"

          if (shape === "circle") {
            return (
              <ellipse
                key={nd.id}
                cx={x + nw / 2}
                cy={y + nh / 2}
                rx={nw / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "diamond") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw / 2},${y} ${x + nw},${y + nh / 2} ${x + nw / 2},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "hexagon") {
            return (
              <polygon
                key={nd.id}
                points={`${x + nw * 0.25},${y} ${x + nw * 0.75},${y} ${x + nw},${y + nh / 2} ${x + nw * 0.75},${y + nh} ${x + nw * 0.25},${y + nh} ${x},${y + nh / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          if (shape === "pill") {
            return (
              <rect
                key={nd.id}
                x={x}
                y={y}
                width={nw}
                height={nh}
                rx={nh / 2}
                ry={nh / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={sw}
              />
            )
          }
          // rectangle and cylinder both render as rounded rect
          return (
            <rect
              key={nd.id}
              x={x}
              y={y}
              width={nw}
              height={nh}
              rx={shape === "cylinder" ? Math.min(nw * 0.12, 6) : 4}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface StarterTemplatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (template: CanvasTemplate) => void
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1520px,calc(100vw-2rem))]! gap-0 p-0">
        <DialogHeader className="border-b border-border-default px-3 sm:px-6 md:px-10 py-4 sm:py-5 md:py-7">
          <DialogTitle className="text-base sm:text-lg md:text-xl">Import Template</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be
            replaced — use <kbd className="rounded border border-border-default bg-bg-elevated px-1 py-0.5 font-mono text-[9px] sm:text-[11px] text-text-muted">⌘Z</kbd> to undo.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-2 sm:px-5 md:px-8 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col overflow-hidden rounded-lg sm:rounded-2xl border border-border-default bg-bg-elevated transition-colors hover:border-border-subtle"
              >
                {/* Preview */}
                <div className="bg-bg-base px-2 sm:px-4 md:px-5 pt-2 sm:pt-4 md:pt-5 pb-2 sm:pb-3 md:pb-4">
                  <TemplatePreview template={template} />
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-2 sm:gap-3 md:gap-4 border-t border-border-default p-2 sm:p-4 md:p-5">
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-text-primary">{template.name}</p>
                    <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm leading-relaxed text-text-muted">
                      {template.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-auto w-full gap-1 sm:gap-2 text-xs sm:text-sm touch-target"
                    onClick={() => handleImport(template)}
                  >
                    <Download className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    Import
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
