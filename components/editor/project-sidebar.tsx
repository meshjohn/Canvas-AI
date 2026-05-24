"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import { X, Plus, Pencil, Trash2, Copy, Search, ArrowUpDown, Layout, FolderHeart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ProjectRow } from "@/hooks/use-project-actions"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  onNewProject: () => void
  onRename: (project: ProjectRow) => void
  onDelete: (project: ProjectRow) => void
  onDuplicate: (project: ProjectRow) => void
  activeProjectId?: string
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  onNewProject,
  onRename,
  onDelete,
  onDuplicate,
  activeProjectId,
}: ProjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "alpha">("newest")

  const initialTab = sharedProjects.some((project) => project.id === activeProjectId)
    ? "shared"
    : "my-projects"

  const filterAndSort = (projects: ProjectRow[]) => {
    let filtered = projects
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }
    return filtered.sort((a, b) => {
      if (sortOrder === "alpha") {
        return a.name.localeCompare(b.name)
      }
      // Assuming original order is newest first
      return 0
    })
  }

  const filteredOwned = useMemo(() => filterAndSort(ownedProjects), [ownedProjects, searchQuery, sortOrder])
  const filteredShared = useMemo(() => filterAndSort(sharedProjects), [sharedProjects, searchQuery, sortOrder])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-base/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-[3.75rem] left-2 top-[3.75rem] z-50 flex w-[calc(100%-1rem)] sm:w-72 flex-col rounded-2xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.5rem)] sm:-translate-x-[calc(100%+1rem)]"
        )}
      >
        <div className="flex h-12 sm:h-14 shrink-0 items-center justify-between border-b border-border-default px-3 sm:px-4">
          <span className="text-sm font-medium text-text-primary">Projects</span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="touch-target">
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-2 sm:p-3">
          <Tabs
            key={`${activeProjectId ?? "home"}-${initialTab}`}
            defaultValue={initialTab}
            className="flex flex-1 flex-col"
          >
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1 text-xs sm:text-sm">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1 text-xs sm:text-sm">
                Shared
              </TabsTrigger>
            </TabsList>

            <div className="my-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-faint" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="pl-8 h-8 text-xs sm:text-sm border-border-default bg-bg-surface"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="icon-sm" className="h-8 w-8 shrink-0 touch-target border-border-default">
                      <ArrowUpDown className="h-4 w-4 text-text-muted" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => setSortOrder("newest")}>Newest (Default)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("alpha")}>Alphabetical (A-Z)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <TabsContent value="my-projects" className="flex-1 overflow-y-auto mt-0">
              {filteredOwned.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Layout className="h-10 w-10 text-border-default mb-3" />
                  <p className="text-sm font-medium text-text-primary">No projects found</p>
                  <p className="text-xs text-text-muted mt-1 max-w-[200px]">
                    {searchQuery ? "Try a different search term" : "Create a new project to get started"}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {filteredOwned.map((project) => (
                    <li key={project.id}>
                      <ProjectItem
                        project={project}
                        active={project.id === activeProjectId}
                        onRename={onRename}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="shared" className="flex-1 overflow-y-auto mt-0">
              {filteredShared.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <FolderHeart className="h-10 w-10 text-border-default mb-3" />
                  <p className="text-sm font-medium text-text-primary">No shared projects</p>
                  <p className="text-xs text-text-muted mt-1 max-w-[200px]">
                    {searchQuery ? "Try a different search term" : "Projects shared with you will appear here"}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {filteredShared.map((project) => (
                    <li key={project.id}>
                      <ProjectItem
                        project={project}
                        active={project.id === activeProjectId}
                        onDuplicate={onDuplicate}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="shrink-0 p-2 sm:p-3 border-t border-border-default safe-bottom">
          <Button
            variant="default"
            size="default"
            className="w-full gap-2 touch-target"
            onClick={onNewProject}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectItemProps {
  project: ProjectRow
  active?: boolean
  onRename?: (project: ProjectRow) => void
  onDelete?: (project: ProjectRow) => void
  onDuplicate?: (project: ProjectRow) => void
}

function ProjectItem({ project, active = false, onRename, onDelete, onDuplicate }: ProjectItemProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border px-2 py-2 sm:py-1.5 transition-colors touch-target",
        active
          ? "border-border-subtle bg-accent-primary-dim"
          : "border-transparent hover:bg-bg-subtle"
      )}
    >
      {isNavigating ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-accent-primary" />
      ) : (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full bg-border-subtle",
            active && "bg-accent-primary"
          )}
        />
      )}
      {active ? (
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-xs sm:text-sm text-text-primary font-medium cursor-default select-none"
          )}
        >
          {project.name}
        </span>
      ) : (
        <Link
          href={`/editor/${project.id}`}
          onClick={() => setIsNavigating(true)}
          className={cn(
            "min-w-0 flex-1 truncate text-xs sm:text-sm text-text-secondary hover:text-text-primary"
          )}
        >
          {project.name}
        </Link>
      )}
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
        {onDuplicate && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.preventDefault()
              onDuplicate(project)
            }}
            className="touch-target"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Duplicate</span>
          </Button>
        )}
        {onRename && onDelete && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault()
                onRename(project)
              }}
              className="touch-target"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Rename</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.preventDefault()
                onDelete(project)
              }}
              className="touch-target text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
