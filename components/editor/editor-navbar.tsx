"use client"

import { LayoutTemplate, PanelLeftClose, PanelLeftOpen, Save, Share2, Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle: () => void
  projectName?: string
  isAiSidebarOpen?: boolean
  onToggleAiSidebar?: () => void
  onOpenShareDialog?: () => void
  onOpenTemplates?: () => void
  saveStatus?: SaveStatus
  onSave?: () => void
}

export function EditorNavbar({
  isOpen,
  onToggle,
  projectName,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onOpenShareDialog,
  onOpenTemplates,
  saveStatus,
  onSave,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-default/60 bg-bg-surface/85 backdrop-blur-md px-3 sm:px-4 relative z-40">
      {/* Neon Top Glow Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-accent-primary/20 via-accent-primary to-accent-ai opacity-85" />

      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggle} className="touch-target">
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {projectName ? (
          <div className="min-w-0">
            <p className="truncate text-xs sm:text-sm font-medium text-text-primary">{projectName}</p>
            <p className="text-[10px] sm:text-xs text-text-faint">Workspace</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onToggleAiSidebar ? (
          <>
            {onSave ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 touch-target px-2.5 sm:px-3 text-xs"
                onClick={onSave}
                disabled={saveStatus === "saving"}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {saveStatus === "saving"
                    ? "Saving..."
                    : saveStatus === "saved"
                    ? "Saved"
                    : saveStatus === "error"
                    ? "Error"
                    : "Save"}
                </span>
              </Button>
            ) : null}
            {onOpenTemplates ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 touch-target px-2.5 sm:px-3 text-xs"
                onClick={onOpenTemplates}
              >
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
            ) : null}
            {onOpenShareDialog ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 touch-target px-2.5 sm:px-3 text-xs"
                onClick={onOpenShareDialog}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            ) : null}
            <Button
              variant={isAiSidebarOpen ? "default" : "outline"}
              size="sm"
              className="gap-2 touch-target px-2.5 sm:px-3 text-xs"
              onClick={onToggleAiSidebar}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </Button>
          </>
        ) : null}

        {!onToggleAiSidebar ? <UserButton /> : null}
      </div>
    </header>
  )
}
