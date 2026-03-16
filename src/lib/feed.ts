import prisma from "./prisma";
import { createNotification } from "./notifications";

export async function fanOutToCircle(params: {
  circleId: string;
  type: string;
  actorId: string;
  postId?: string;
  courseId?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const members = await prisma.circleMembership.findMany({
    where: {
      circleId: params.circleId,
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
    },
    select: { userId: true },
  });

  const feedData = members
    .filter((m) => m.userId !== params.actorId)
    .map((m) => ({
      userId: m.userId,
      type: params.type,
      actorId: params.actorId,
      circleId: params.circleId,
      postId: params.postId ?? null,
      courseId: params.courseId ?? null,
      metadata: params.metadata ?? undefined,
    }));

  if (feedData.length > 0) {
    await prisma.feedItem.createMany({ data: feedData });
  }
}

export function extractMentionIds(content: string): string[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.push(match[2]);
  }
  return ids;
}

export async function processMentions(params: {
  content: string;
  authorId: string;
  postId?: string;
  commentId?: string;
}): Promise<void> {
  const userIds = extractMentionIds(params.content);
  if (userIds.length === 0) return;

  const mentionData = userIds.map((userId) => ({
    mentionedUserId: userId,
    postId: params.postId ?? null,
    commentId: params.commentId ?? null,
  }));

  await prisma.mention.createMany({ data: mentionData });

  const author = await prisma.user.findUnique({
    where: { id: params.authorId },
    select: { name: true },
  });

  for (const userId of userIds) {
    if (userId === params.authorId) continue;
    await createNotification({
      userId,
      type: "MENTION",
      title: `${author?.name ?? "Someone"} mentioned you`,
      body: params.content.slice(0, 100),
      actionUrl: params.postId ? `/feed?post=${params.postId}` : undefined,
    });
  }
}
