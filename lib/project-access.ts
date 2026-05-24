import { auth, currentUser } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export interface ProjectIdentity {
  userId: string | null
  primaryEmailAddress: string | null
}

export async function getCurrentProjectIdentity(): Promise<ProjectIdentity> {
  const authObj = await auth()
  const { userId } = authObj

  if (!userId) {
    return {
      userId: null,
      primaryEmailAddress: null,
    }
  }

  // 1. Try to read email from custom sessionClaims if configured in Clerk Dashboard (fastest)
  const sessionEmail = authObj.sessionClaims?.email as string | undefined
  if (sessionEmail) {
    return {
      userId,
      primaryEmailAddress: sessionEmail.trim().toLowerCase(),
    }
  }

  // 2. Try to read email from client-synced cookie (fast fallback)
  try {
    const cookieStore = await cookies()
    const cachedEmail = cookieStore.get("ghost_user_email")?.value
    if (cachedEmail) {
      return {
        userId,
        primaryEmailAddress: cachedEmail.trim().toLowerCase(),
      }
    }
  } catch (e) {
    // cookies() might throw in some static rendering/build contexts, fail silently
    console.warn("Failed to read ghost_user_email cookie:", e)
  }

  // 3. Fallback to slow Clerk API call
  const user = await currentUser()

  return {
    userId,
    primaryEmailAddress:
      user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null,
  }
}

export async function getAccessibleProject(
  projectId: string,
  identity: ProjectIdentity
) {
  if (!identity.userId) return null

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: identity.primaryEmailAddress
        ? [
            { ownerId: identity.userId },
            {
              collaborators: {
                some: {
                  email: {
                    equals: identity.primaryEmailAddress,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]
        : [{ ownerId: identity.userId }],
    },
  })
}

export async function userHasProjectAccess(
  projectId: string,
  identity: ProjectIdentity
) {
  const project = await getAccessibleProject(projectId, identity)
  return Boolean(project)
}
