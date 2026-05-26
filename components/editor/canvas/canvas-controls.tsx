"use client"

import { useState } from "react"
import { Minus, Maximize, Plus, Undo2, Redo2, Wand2, ImageDown, ArrowDownUp, ArrowRightLeft, SlidersHorizontal } from "lucide-react"

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
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="absolute bottom-4 left-4 z-40">
      {/* Desktop Toolbar (sm and above) */}
      <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-border-default bg-bg-surface/95 px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-xl backdrop-blur-xl touch-target">
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

      {/* Mobile Collapsible Panel (below sm) */}
      <div className="sm:hidden relative flex flex-col items-start">
        {isExpanded && (
          <>
            {/* Backdrop click interceptor */}
            <div className="fixed inset-0 z-40" onClick={() => setIsExpanded(false)} />

            {/* Glassmorphic Grouped Popover Menu */}
            <div
              className="absolute bottom-12 left-0 z-50 flex flex-col gap-2.5 rounded-2xl border border-border-subtle bg-bg-surface/95 p-3.5 shadow-2xl backdrop-blur-2xl w-48 border-l-[1.5px] border-l-accent-primary"
              style={{
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7), 0 0 15px var(--color-accent-primary-dim)",
                animation: "panelSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
              }}
            >
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-border-default/60 pb-1.5 px-0.5">
                <span className="text-[10px] font-bold tracking-wider text-text-muted uppercase">Canvas Tools</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shadow-[0_0_6px_var(--color-accent-primary)] animate-pulse" />
              </div>

              {/* Group: Zoom */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-text-muted/70 tracking-wider uppercase px-0.5">Zoom</span>
                <div className="flex items-center gap-1 bg-bg-elevated/70 p-1 rounded-xl border border-border-default/40">
                  <button
                    onClick={onZoomOut}
                    className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary touch-target"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onFitView}
                    className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary touch-target"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onZoomIn}
                    className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary touch-target"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Group: History */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-text-muted/70 tracking-wider uppercase px-0.5">History</span>
                <div className="flex items-center gap-1 bg-bg-elevated/70 p-1 rounded-xl border border-border-default/40">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary disabled:opacity-20 disabled:pointer-events-none touch-target"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary disabled:opacity-20 disabled:pointer-events-none touch-target"
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Group: Layout */}
              {onTidyUp && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-text-muted/70 tracking-wider uppercase px-0.5">Layout</span>
                  <div className="flex items-center gap-1 bg-bg-elevated/70 p-1 rounded-xl border border-border-default/40">
                    <button
                      onClick={onTidyUp}
                      className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary touch-target"
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>
                    {onToggleLayoutDirection && (
                      <button
                        onClick={onToggleLayoutDirection}
                        className="flex-1 flex h-8 items-center justify-center rounded-lg text-text-secondary active:bg-bg-subtle active:text-text-primary touch-target"
                      >
                        {layoutDirection === "TB" ? <ArrowDownUp className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Group: Export */}
              {onExportImage && (
                <button
                  onClick={() => {
                    onExportImage()
                    setIsExpanded(false)
                  }}
                  className="w-full flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-accent-primary-dim border border-accent-primary/20 text-[11px] font-semibold text-accent-primary active:bg-accent-primary/25 active:text-white transition-all touch-target mt-1"
                >
                  <ImageDown className="h-3.5 w-3.5" />
                  <span>Export PNG</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Collapsed FAB Trigger Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            boxShadow: isExpanded
              ? "0 0 15px var(--color-accent-primary), 0 4px 20px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-bg-surface/95 shadow-xl backdrop-blur-xl transition-all duration-200 active:scale-90 z-50 cursor-pointer ${
            isExpanded
              ? "ring-2 ring-accent-primary border-transparent text-accent-primary scale-105"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>
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

