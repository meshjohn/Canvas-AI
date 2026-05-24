import { auth, currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserColor } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await request.json().catch(() => ({}));

  if (!room || typeof room !== "string") {
    return new Response("Bad Request", { status: 400 });
  }

  // Look up the project in the database to check ownership directly.
  // This is a fast indexed query (~10-50ms) vs Clerk currentUser() (~800ms).
  const project = await prisma.project.findUnique({
    where: { id: room },
    select: { ownerId: true },
  });

  if (!project) {
    return new Response("Not Found", { status: 404 });
  }

  const isOwner = project.ownerId === userId;
  let name: string;
  let avatar: string;

  if (isOwner) {
    // Owner path — skip the slow Clerk currentUser() network call entirely.
    // Use placeholder metadata; the client-side UserButton and presence
    // components will show the real name/avatar from the Clerk session.
    name = "Project Owner";
    avatar = "";
  } else {
    // Collaborator path — we need the email to verify access.
    const user = await currentUser();
    const primaryEmail =
      user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

    if (!primaryEmail) {
      return new Response("Forbidden", { status: 403 });
    }

    // Check if this email is listed as a collaborator on the project
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId: room,
          email: primaryEmail,
        },
      },
    });

    if (!collaborator) {
      return new Response("Forbidden", { status: 403 });
    }

    name = user?.fullName ?? primaryEmail ?? "Anonymous";
    avatar = user?.imageUrl ?? "";
  }

  const color = getUserColor(userId);
  const lb = getLiveblocks();

  // Fire-and-forget: rooms are pre-created at project creation time,
  // so this is just a safety net that should not block token issuance.
  lb.getOrCreateRoom(room, { defaultAccesses: [] }).catch((error) => {
    console.error("Background getOrCreateRoom failed:", error);
  });

  const session = lb.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}

