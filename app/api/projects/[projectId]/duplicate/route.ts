import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { get, put } from "@vercel/blob"
import { getLiveblocks } from "@/lib/liveblocks"
import type { NextRequest } from "next/server"

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/duplicate">
) {
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  const name = typeof b.name === "string" && b.name.trim() ? b.name.trim() : "Copy of Project"
  
  const suffix = Math.random().toString(36).substring(2, 6)
  const newProjectId = `${slugify(name)}-${suffix}`

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) return Response.json({ error: "Not found" }, { status: 404 })

  let newCanvasBlobUrl = null

  if (project.canvasBlobUrl) {
    try {
      const result = await get(project.canvasBlobUrl, { access: "private" })
      if (result && result.statusCode === 200 && result.stream) {
        const canvas = await new Response(result.stream).json()
        const newBlob = await put(`canvas/${newProjectId}.json`, JSON.stringify(canvas), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        })
        newCanvasBlobUrl = newBlob.url
      }
    } catch (e) {
      console.error("Failed to duplicate canvas blob", e)
    }
  }

  const newProject = await prisma.project.create({
    data: {
      id: newProjectId,
      ownerId: identity.userId,
      name,
      canvasBlobUrl: newCanvasBlobUrl,
    },
  })

  // Pre-create the Liveblocks room to optimize future auth requests
  try {
    const lb = getLiveblocks()
    await lb.getOrCreateRoom(newProject.id, { defaultAccesses: [] })
  } catch (error) {
    console.error("Failed to pre-create Liveblocks room on project duplication:", error)
  }

  return Response.json({ project: newProject }, { status: 201 })
}
