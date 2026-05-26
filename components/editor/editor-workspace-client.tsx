"use client"

import { LiveObject, LiveMap } from "@liveblocks/client"
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react"
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
import { useProjectActions, type ProjectRow } from "@/hooks/use-project-actions"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

const ProjectDialogs = dynamic(
  () => import("@/components/editor/project-dialogs").then((mod) => mod.ProjectDialogs),
  { ssr: false }
)

const ProjectShareDialog = dynamic(
  () => import("@/components/editor/project-share-dialog").then((mod) => mod.ProjectShareDialog),
  { ssr: false }
)

const StarterTemplatesModal = dynamic(
  () => import("@/components/editor/starter-templates-modal").then((mod) => mod.StarterTemplatesModal),
  { ssr: false }
)

const AiSidebar = dynamic(
  () => import("@/components/editor/ai-sidebar").then((mod) => mod.AiSidebar),
  {
    ssr: false,
    loading: () => (
      <aside className="fixed inset-y-12 sm:inset-y-14 right-2 sm:right-3 top-14 sm:top-14 z-40 w-[calc(100%-1rem)] sm:w-96 flex items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </aside>
    ),
  }
)

interface EditorWorkspaceClientProps {
  currentProject: ProjectRow
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  roomId: string
}

export function EditorWorkspaceClient({
  currentProject,
  ownedProjects,
  sharedProjects,
  roomId,
}: EditorWorkspaceClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const saveFnRef = useRef<() => void>(() => { })
  const actions = useProjectActions()

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setAiSidebarOpen(true)
    }
  }, [])

  const handleSaveStatusChange = useCallback((status: SaveStatus) => setSaveStatus(status), [])
  const handleSaveReady = useCallback((fn: () => void) => { saveFnRef.current = fn }, [])

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={new LiveObject({
          flow: new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() }),
        })}
      >
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg-base">
          <EditorNavbar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((prev) => !prev)}
            projectName={currentProject.name}
            isAiSidebarOpen={aiSidebarOpen}
            onToggleAiSidebar={() => setAiSidebarOpen((prev) => !prev)}
            onOpenShareDialog={() => setShareDialogOpen(true)}
            onOpenTemplates={() => setTemplatesOpen(true)}
            saveStatus={saveStatus}
            onSave={() => saveFnRef.current()}
          />

          <main className="relative min-h-0 flex-1 overflow-hidden">
            <CanvasRoom
              projectId={currentProject.id}
              pendingTemplate={pendingTemplate}
              onTemplateImported={() => setPendingTemplate(null)}
              onSaveStatusChange={handleSaveStatusChange}
              onSaveReady={handleSaveReady}
            />
          </main>

          <ProjectSidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            onNewProject={actions.openCreate}
            onRename={actions.openRename}
            onDelete={actions.openDelete}
            onDuplicate={actions.duplicateProject}
            activeProjectId={currentProject.id}
          />

          <AiSidebar
            isOpen={aiSidebarOpen}
            onClose={() => setAiSidebarOpen(false)}
            roomId={roomId}
            projectId={currentProject.id}
          />

          <ProjectDialogs {...actions} />
          <ProjectShareDialog
            projectId={currentProject.id}
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
          />
          <StarterTemplatesModal
            open={templatesOpen}
            onOpenChange={setTemplatesOpen}
            onImport={(template) => setPendingTemplate(template)}
          />
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
