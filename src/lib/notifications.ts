import prisma from "./prisma";
import { Prisma } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  // Check user notification preference (global = circleId null)
  const pref = await prisma.notificationPref.findFirst({
    where: { userId: params.userId, circleId: null },
  });

  // If the user has muted all notifications, skip
  if (pref?.level === "MUTED") return;

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      actionUrl: params.actionUrl ?? null,
      metadata: params.metadata ?? Prisma.JsonNull,
    },
  });
}
