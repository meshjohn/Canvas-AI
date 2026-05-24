import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { auth as triggerAuth } from "@trigger.dev/sdk/v3"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const body: unknown = await request.json().catch(() => ({}))
    const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
    const runId = typeof b.runId === "string" ? b.runId.trim() : ""

    if (!runId) return Response.json({ error: "Missing runId" }, { status: 400 })

    const taskRun = await prisma.taskRun.findUnique({ where: { runId } })
    if (!taskRun) {
      console.error(`[Token] TaskRun not found for runId: ${runId}`)
      return Response.json({ error: "Run not found" }, { status: 404 })
    }
    
    if (taskRun.userId !== userId) {
      console.error(`[Token] Unauthorized: taskRun.userId=${taskRun.userId}, userId=${userId}`)
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [runId] } },
      expirationTime: "1h",
    })

    return Response.json({ token })
  } catch (error) {
    console.error("[Token] Error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
