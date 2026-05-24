"use client"

import { Minus, Maximize, Plus, Undo2, Redo2, Wand2, ImageDown, ArrowDownUp, ArrowRightLeft } from "lucide-react"

interface CanvasControlsProps {
  onZoomOut: () => void
  onFitView: () => void
  onZoomIn: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onTidyUp?: () => void
  layoutDirection?: "TB" | "LR"
  onToggleLayoutDirection?: () => void
  onExportImage?: () => void
}

export function CanvasControls({
  onZoomOut,
  onFitView,
  onZoomIn,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onTidyUp,
  layoutDirection = "TB",
  onToggleLayoutDirection,
  onExportImage,
}: CanvasControlsProps) {
  return (
    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-10 flex items-center gap-0.5 rounded-full border border-border-default bg-bg-surface/95 px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-xl backdrop-blur-xl touch-target">
      <ControlButton onClick={onZoomOut} title="Zoom out">
        <Minus className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-200 group-hover/btn:scale-115 group-active/btn:scale-90" />
      </ControlButton>
      <ControlButton onClick={onFitView} title="Fit view">
        <Maximize className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-200 group-hover/btn:scale-115 group-active/btn:scale-90" />
      </ControlButton>
      <ControlButton onClick={onZoomIn} title="Zoom in">
        <Plus className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-200 group-hover/btn:scale-115 group-active/btn:scale-90" />
      </ControlButton>

      <div className="mx-0.5 sm:mx-1 h-4 w-px bg-border-default" />

      <ControlButton onClick={onUndo} title="Undo" disabled={!canUndo}>
        <Undo2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-300 group-hover/btn:-rotate-12 group-active/btn:-rotate-45" />
      </ControlButton>
      <ControlButton onClick={onRedo} title="Redo" disabled={!canRedo}>
        <Redo2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-300 group-hover/btn:rotate-12 group-active/btn:rotate-45" />
      </ControlButton>

      {onTidyUp && (
        <>
          <div className="mx-0.5 sm:mx-1 h-4 w-px bg-border-default" />
          <ControlButton onClick={onTidyUp} title="Tidy Up (Auto Layout)">
            <Wand2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-all duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-115 group-active/btn:scale-90" />
          </ControlButton>
          {onToggleLayoutDirection && (
            <ControlButton onClick={onToggleLayoutDirection} title={`Toggle Direction (Current: ${layoutDirection === "TB" ? "Top-to-Bottom" : "Left-to-Right"})`}>
              {layoutDirection === "TB" ? (
                <ArrowDownUp className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-350 group-hover/btn:translate-y-[1px]" />
              ) : (
                <ArrowRightLeft className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-350 group-hover/btn:translate-x-[1px]" />
              )}
            </ControlButton>
          )}
        </>
      )}

      {onExportImage && (
        <>
          <div className="mx-0.5 sm:mx-1 h-4 w-px bg-border-default" />
          <ControlButton onClick={onExportImage} title="Export as PNG">
            <ImageDown className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-300 group-hover/btn:translate-y-[1.5px] group-active/btn:scale-90" />
          </ControlButton>
        </>
      )}
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function ControlButton({ onClick, title, disabled, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="group/btn flex h-8 sm:h-7 w-8 sm:w-7 items-center justify-center rounded-full text-text-muted transition-all duration-200 hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30 touch-target active:scale-90 active:duration-75 ease-out"
    >
      {children}
    </button>
  )
}
