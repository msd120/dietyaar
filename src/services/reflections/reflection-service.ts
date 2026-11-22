import 'server-only';
import { ReflectionFeedbackValue } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getOrCreateDeterministicReflection(input: {
  userId: string;
  localDate: string;
  mealCount: number;
  unknownEnergyItemCount: number;
  sourceRevision: number;
}) {
  const localDate = new Date(`${input.localDate}T00:00:00.000Z`);
  const templateKey =
    input.mealCount === 0
      ? 'noMeals'
      : input.unknownEnergyItemCount > 0
        ? 'someUnknowns'
        : 'mealsRecorded';
  return prisma.reflection.upsert({
    where: { userId_localDate: { userId: input.userId, localDate } },
    create: {
      userId: input.userId,
      localDate,
      sourceRevision: input.sourceRevision,
      templateKey,
      facts: {
        mealCount: input.mealCount,
        unknownEnergyItemCount: input.unknownEnergyItemCount,
      },
    },
    update: {
      sourceRevision: input.sourceRevision,
      templateKey,
      facts: {
        mealCount: input.mealCount,
        unknownEnergyItemCount: input.unknownEnergyItemCount,
      },
    },
  });
}

export async function setReflectionFeedback(input: {
  userId: string;
  reflectionId: string;
  value: ReflectionFeedbackValue | null;
}) {
  const reflection = await prisma.reflection.findFirst({
    where: { id: input.reflectionId, userId: input.userId },
    select: { id: true },
  });
  if (!reflection) throw new Error('REFLECTION_NOT_FOUND');
  if (input.value === null) {
    await prisma.reflectionFeedback.deleteMany({
      where: { reflectionId: reflection.id, userId: input.userId },
    });
    return null;
  }
  return prisma.reflectionFeedback.upsert({
    where: { reflectionId_userId: { reflectionId: reflection.id, userId: input.userId } },
    create: { reflectionId: reflection.id, userId: input.userId, value: input.value },
    update: { value: input.value },
  });
}
