import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client"
import { getProjectsForUser } from "@/lib/projects"
import {
  getAccessibleProject,
  getCurrentProjectIdentity,
} from "@/lib/project-access"

export default async function EditorWorkspacePage(
  props: PageProps<"/editor/[roomId]">
) {
  const identity = await getCurrentProjectIdentity()

  if (!identity.userId) redirect("/sign-in")

  const { roomId } = await props.params

  // Run database queries in parallel to cut query resolution times in half
  const [project, projectsList] = await Promise.all([
    getAccessibleProject(roomId, identity),
    getProjectsForUser(identity.userId, identity.primaryEmailAddress ?? ""),
  ])

  if (!project) {
    return <AccessDenied />
  }

  const { owned, shared } = projectsList

  return (
    <EditorWorkspaceClient
      currentProject={{ id: project.id, name: project.name }}
      ownedProjects={owned.map((item) => ({ id: item.id, name: item.name }))}
      sharedProjects={shared.map((item) => ({ id: item.id, name: item.name }))}
      roomId={roomId}
    />
  )
}
