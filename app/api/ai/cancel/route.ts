import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import { runs } from "@trigger.dev/sdk/v3"

export async function POST(request: Request) {
  try {
    const identity = await getCurrentProjectIdentity()
    if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body: unknown = await request.json().catch(() => ({}))
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
    const runId = typeof b.runId === "string" ? b.runId.trim() : ""

    if (!runId) {
      return Response.json({ error: "Missing runId" }, { status: 400 })
    }

    // Lookup task run in the database to fetch the associated project
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
      select: { projectId: true },
    })

    if (!taskRun) {
      return Response.json({ error: "Run not found" }, { status: 404 })
    }

    // Verify user has access to this project before canceling the task run
    const project = await getAccessibleProject(taskRun.projectId, identity)
    if (!project) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    await runs.cancel(runId)
    return Response.json({ success: true })
  } catch (err) {
    console.error("Failed to cancel run:", err)
    return Response.json({ error: "Failed to cancel run" }, { status: 500 })
  }
}
