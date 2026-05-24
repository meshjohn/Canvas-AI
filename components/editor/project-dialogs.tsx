"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProjectActions } from "@/hooks/use-project-actions"

type ProjectDialogsProps = ReturnType<typeof useProjectActions>

export function ProjectDialogs({
  dialogType,
  activeProject,
  name,
  roomId,
  loading,
  close,
  handleNameChange,
  submit,
}: ProjectDialogsProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) close()
  }

  return (
    <>
      <Dialog open={dialogType === "create"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">New Project</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Give your project a name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              className="text-xs sm:text-sm touch-target"
            />
            <p className="min-h-4 text-[10px] sm:text-xs text-muted-foreground font-mono">
              {roomId ? roomId : ""}
            </p>
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={submit} disabled={!name.trim() || loading} className="touch-target text-xs sm:text-sm">
              {loading ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "rename"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Rename Project</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Renaming &ldquo;{activeProject?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) submit()
            }}
            autoFocus
            className="text-xs sm:text-sm touch-target"
          />

          <DialogFooter showCloseButton>
            <Button onClick={submit} disabled={!name.trim() || loading} className="touch-target text-xs sm:text-sm">
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "delete"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton className="w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Project</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete &ldquo;{activeProject?.name}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={submit} disabled={loading} className="touch-target text-xs sm:text-sm">
              {loading ? "Deleting…" : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
