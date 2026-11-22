import 'server-only';
import { SlotExplicitState } from '@prisma/client';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';
import { prisma } from '@/lib/prisma';

export async function setSlotSkipped(input: {
  userId: string;
  localDate: string;
  planVersionId: string;
  slotId: string;
  skipped: boolean;
}) {
  const localDate = new Date(`${input.localDate}T00:00:00.000Z`);
  return prisma.$transaction(async (tx) => {
    const plan = await tx.dietPlanVersion.findFirst({
      where: {
        id: input.planVersionId,
        userId: input.userId,
        effectiveFrom: { lte: localDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: localDate } }],
      },
      select: { id: true, snapshot: true },
    });
    const structured = parseStructuredPlan(plan?.snapshot);
    if (!plan || !structured?.slots.some((slot) => slot.id === input.slotId)) {
      throw new Error('PLAN_SLOT_NOT_FOUND');
    }
    const occurrence = await tx.planSlotOccurrence.upsert({
      where: {
        userId_localDate_planVersionId_slotId: {
          userId: input.userId,
          localDate,
          planVersionId: input.planVersionId,
          slotId: input.slotId,
        },
      },
      create: {
        userId: input.userId,
        localDate,
        planVersionId: input.planVersionId,
        slotId: input.slotId,
        explicitState: input.skipped ? SlotExplicitState.SKIPPED : null,
      },
      update: {
        explicitState: input.skipped ? SlotExplicitState.SKIPPED : null,
        revision: { increment: 1 },
      },
    });
    await tx.dayState.upsert({
      where: { userId_localDate: { userId: input.userId, localDate } },
      create: { userId: input.userId, localDate, reopenedAt: new Date() },
      update: { completedAt: null, reopenedAt: new Date(), revision: { increment: 1 } },
    });
    return occurrence;
  });
}

export async function listSlotOccurrences(input: { userId: string; localDate: string }) {
  return prisma.planSlotOccurrence.findMany({
    where: {
      userId: input.userId,
      localDate: new Date(`${input.localDate}T00:00:00.000Z`),
    },
    orderBy: { slotId: 'asc' },
  });
}
