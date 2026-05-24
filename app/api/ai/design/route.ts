import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk/v3"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import type { designAgent } from "@/trigger/design-agent"

export async function POST(request: Request) {
  try {
    const identity = await getCurrentProjectIdentity()
    if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body: unknown = await request.json().catch(() => ({}))
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
    const prompt = typeof b.prompt === "string" ? b.prompt.trim() : ""
    const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
    const projectId = typeof b.projectId === "string" ? b.projectId.trim() : ""

    if (!prompt || !roomId || !projectId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Secure check: verify user has access to this project before executing AI work
    const project = await getAccessibleProject(projectId, identity)
    if (!project) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
      userId: identity.userId,
    })

    await prisma.taskRun.create({
      data: { runId: handle.id, projectId, userId: identity.userId },
    })

    return Response.json({ runId: handle.id }, { status: 201 })
  } catch (error) {
    console.error("[DesignRoute] Error triggering design agent:", error)
    const message = error instanceof Error ? error.message : "Internal error"
    return Response.json({ error: message }, { status: 500 })
  }
}
