"use client"

import { Mail, Link2, Shield, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useProjectShare,
  type ProjectSharePerson,
} from "@/hooks/use-project-share"
import { cn } from "@/lib/utils"

interface ProjectShareDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getInitials(person: ProjectSharePerson) {
  const source = person.displayName || person.email || "?"
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")
}

function CollaboratorAvatar({ person }: { person: ProjectSharePerson }) {
  if (person.avatarUrl) {
    return (
      <div
        role="img"
        aria-label={person.displayName}
        className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg sm:rounded-2xl border border-border-subtle bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url(${person.avatarUrl})` }}
      />
    )
  }

  return (
    <div className="flex h-9 sm:h-10 w-9 sm:w-10 items-center justify-center rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated text-[10px] sm:text-xs font-medium text-text-secondary shrink-0">
      {getInitials(person)}
    </div>
  )
}

function CollaboratorRow({
  person,
  canManage,
  removing,
  onRemove,
}: {
  person: ProjectSharePerson
  canManage: boolean
  removing: boolean
  onRemove?: (email: string) => void
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/70 px-2 sm:px-3 py-2 sm:py-3">
      <CollaboratorAvatar person={person} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <p className="truncate text-xs sm:text-sm font-medium text-text-primary">
            {person.displayName}
          </p>
          <span
            className={cn(
              "rounded-full border px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.08em] sm:tracking-[0.16em] whitespace-nowrap",
              person.role === "owner"
                ? "border-accent-primary/30 bg-accent-primary-dim text-accent-primary"
                : "border-border-subtle bg-bg-subtle text-text-faint"
            )}
          >
            {person.role}
          </span>
        </div>
        {person.email ? (
          <p className="truncate text-[10px] sm:text-xs text-text-muted">{person.email}</p>
        ) : null}
      </div>

      {canManage && person.role === "collaborator" && person.email && onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(person.email!)}
          disabled={removing}
          className="touch-target shrink-0"
        >
          <Trash2 className="h-4 w-4 text-state-error" />
          <span className="sr-only">Remove collaborator</span>
        </Button>
      ) : null}
    </div>
  )
}

export function ProjectShareDialog({
  projectId,
  open,
  onOpenChange,
}: ProjectShareDialogProps) {
  const {
    data,
    inviteEmail,
    loading,
    submitting,
    removingEmail,
    error,
    copied,
    setInviteEmail,
    invite,
    remove,
    copyLink,
  } = useProjectShare(projectId, open)

  const canManage = data?.canManage ?? false
  const people = data ? [data.owner, ...data.collaborators] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 rounded-2xl sm:rounded-3xl border border-border-subtle bg-bg-surface p-0 text-text-primary sm:max-w-xl">
        <DialogHeader className="border-b border-border-default px-3 sm:px-6 py-3 sm:py-5">
          <DialogTitle className="text-base sm:text-lg">Share project</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-text-muted">
            {canManage
              ? "Invite collaborators, copy the workspace link, and manage access."
              : "You can view who has access to this workspace. Only the owner can manage access."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-3 sm:gap-5 overflow-y-auto px-3 sm:px-6 py-3 sm:py-5">
          {canManage ? (
            <div className="rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/60 p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-text-primary">Workspace link</p>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs leading-5 text-text-muted">
                    Share a direct link with teammates.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={copied ? "default" : "outline"}
                  size="sm"
                  className="gap-1 sm:gap-2 touch-target text-xs sm:text-sm shrink-0"
                  onClick={copyLink}
                >
                  <Link2 className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Copy link"}</span>
                  <span className="sm:hidden">{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>
            </div>
          ) : null}

          {canManage ? (
            <form
              className="rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/60 p-2 sm:p-4"
              onSubmit={(event) => {
                event.preventDefault()
                void invite()
              }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg sm:rounded-xl border border-border-subtle bg-bg-surface px-2 sm:px-3">
                  <Mail className="h-3 sm:h-4 w-3 sm:w-4 text-text-faint shrink-0" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="email@company.com"
                    className="border-0 bg-transparent px-0 text-xs sm:text-sm focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent touch-target"
                  />
                </div>
                <Button type="submit" size="sm" disabled={!inviteEmail.trim() || submitting} className="w-full sm:w-auto touch-target text-xs sm:text-sm">
                  {submitting ? "Inviting…" : "Invite"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/60 p-2 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="rounded-lg sm:rounded-xl border border-border-subtle bg-bg-surface p-1.5 sm:p-2 shrink-0">
                  <Shield className="h-3 sm:h-4 w-3 sm:w-4 text-text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-text-primary">Read-only access</p>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs leading-5 text-text-muted">
                    The project owner controls access.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 sm:mb-3 flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-text-primary">People with access</p>
              {data ? (
                <p className="text-[10px] sm:text-xs text-text-faint">{people.length} total</p>
              ) : null}
            </div>

            {loading && !data ? (
              <div className="rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/40 px-2 sm:px-4 py-3 sm:py-6 text-xs sm:text-sm text-text-muted">
                Loading access list…
              </div>
            ) : people.length > 0 ? (
              <div className="flex flex-col gap-1.5 sm:gap-3">
                {people.map((person) => (
                  <CollaboratorRow
                    key={`${person.role}-${person.email ?? person.displayName}`}
                    person={person}
                    canManage={canManage}
                    removing={removingEmail === person.email}
                    onRemove={remove}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg sm:rounded-2xl border border-border-subtle bg-bg-elevated/40 px-2 sm:px-4 py-3 sm:py-6 text-xs sm:text-sm text-text-muted">
                No collaborators yet.
              </div>
            )}
          </div>

          {error ? (
            <p className="rounded-lg sm:rounded-2xl border border-state-error/30 bg-state-error/10 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-state-error">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
