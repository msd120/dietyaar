import 'server-only';
import { prisma } from '@/lib/prisma';

export async function addWeightEntry(input: {
  userId: string;
  measuredOn: string;
  weightKg: number;
  note?: string;
}) {
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0 || input.weightKg > 600) {
    throw new Error('INVALID_WEIGHT');
  }
  return prisma.weightEntry.create({
    data: {
      userId: input.userId,
      measuredOn: new Date(`${input.measuredOn}T00:00:00.000Z`),
      weightKg: input.weightKg,
      note: input.note?.trim() || null,
    },
  });
}

export async function listWeightEntries(userId: string) {
  return prisma.weightEntry.findMany({
    where: { userId },
    orderBy: [{ measuredOn: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function deleteWeightEntry(input: { userId: string; entryId: string }) {
  const deleted = await prisma.weightEntry.deleteMany({
    where: { id: input.entryId, userId: input.userId },
  });
  if (deleted.count !== 1) throw new Error('WEIGHT_ENTRY_NOT_FOUND');
}

export async function updateWeightEntry(input: {
  userId: string;
  entryId: string;
  measuredOn: string;
  weightKg: number;
  note?: string;
}) {
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0 || input.weightKg > 600) {
    throw new Error('INVALID_WEIGHT');
  }
  const updated = await prisma.weightEntry.updateMany({
    where: { id: input.entryId, userId: input.userId },
    data: {
      measuredOn: new Date(`${input.measuredOn}T00:00:00.000Z`),
      weightKg: input.weightKg,
      note: input.note?.trim() || null,
      revision: { increment: 1 },
    },
  });
  if (updated.count !== 1) throw new Error('WEIGHT_ENTRY_NOT_FOUND');
}
