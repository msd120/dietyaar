import 'server-only';
import { prisma } from '@/lib/prisma';
export async function setDayComplete(input: {
  userId: string;
  localDate: string;
  complete: boolean;
}) {
  const localDate = new Date(`${input.localDate}T00:00:00.000Z`);
  const now = new Date();
  return prisma.dayState.upsert({
    where: { userId_localDate: { userId: input.userId, localDate } },
    create: {
      userId: input.userId,
      localDate,
      completedAt: input.complete ? now : null,
      reopenedAt: input.complete ? null : now,
    },
    update: {
      completedAt: input.complete ? now : null,
      reopenedAt: input.complete ? null : now,
      revision: { increment: 1 },
    },
  });
}
