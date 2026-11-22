import 'dotenv/config';
import {
  Goal,
  MealDraftState,
  MealStatus,
  MealType,
  PrismaClient,
  UnitSystem,
} from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username as usernamePlugin } from 'better-auth/plugins';

const prisma = new PrismaClient();
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  plugins: [usernamePlugin({ immutableUsername: true })],
});

async function main() {
  const username = 'demo';
  const existing = await prisma.user.findUnique({ where: { username } });

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        name: 'کاربر دمو',
        email: 'demo@dietyaar.local',
        username,
        password: 'DietyaarDemo1405!',
      },
    });
    console.log('Demo user created.');
  } else {
    console.log('Demo user already exists.');
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { username } });
  const today = localDay(0);

  await prisma.$transaction(async (tx) => {
    // The demo account is synthetic and may be reset safely on every seed.
    await tx.mealDraft.deleteMany({ where: { userId: user.id } });
    await tx.meal.deleteMany({ where: { userId: user.id } });
    await tx.planDraft.deleteMany({ where: { userId: user.id } });
    await tx.dayState.deleteMany({ where: { userId: user.id } });

    await tx.profile.upsert({
      where: { userId: user.id },
      create: demoProfile(user.id),
      update: demoProfile(user.id),
    });
    await tx.planDraft.create({
      data: { userId: user.id, title: 'برنامهٔ تعادل هفتگی — دادهٔ نمونه' },
    });

    for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
      const localDate = localDay(daysAgo);
      for (const meal of mealsForDay(daysAgo)) {
        await tx.meal.create({
          data: {
            userId: user.id,
            status: MealStatus.CONFIRMED,
            consumedAtUtc: atTehranTime(localDate, meal.time),
            localDate: new Date(`${localDate}T00:00:00.000Z`),
            timezoneAtEntry: 'Asia/Tehran',
            mealType: meal.mealType,
            items: {
              create: meal.items.map((item) => ({
                ...item,
                sourceType: 'SEEDED_SAMPLE',
                snapshotBasis: 'synthetic-development-fixture',
              })),
            },
          },
        });
      }
      await tx.dayState.create({
        data: {
          userId: user.id,
          localDate: new Date(`${localDate}T00:00:00.000Z`),
          completedAt: daysAgo > 0 ? new Date(`${localDate}T20:30:00.000Z`) : null,
          reopenedAt: daysAgo === 0 ? new Date() : null,
        },
      });
    }

    await tx.mealDraft.create({
      data: {
        userId: user.id,
        state: MealDraftState.READY_FOR_REVIEW,
        consumedAtUtc: atTehranTime(today, '21:00'),
        localDate: new Date(`${today}T00:00:00.000Z`),
        timezoneAtEntry: 'Asia/Tehran',
        mealType: MealType.UNPLANNED,
        items: {
          create: {
            displayName: 'خوراک خانگی ثبت‌نشده',
            grams: 180,
            sourceType: 'SEEDED_SAMPLE',
            snapshotBasis: 'unknown-nutrients-development-fixture',
          },
        },
      },
    });
  });

  console.log(
    'Synthetic profile, plan draft, seven-day meals, day states, and review draft seeded.',
  );
}

function demoProfile(userId: string) {
  return {
    userId,
    preferredName: 'سارا',
    age: 31,
    goal: Goal.LOSE_WEIGHT,
    unitSystem: UnitSystem.METRIC,
    timezone: 'Asia/Tehran',
    locale: 'fa',
    onboardingStep: 9,
    onboardingCompleteAt: new Date(),
  };
}

function localDay(daysAgo: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(Date.now() - daysAgo * 86_400_000));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function atTehranTime(day: string, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(new Date(`${day}T00:00:00.000Z`).getTime() + (hour * 60 + minute - 210) * 60_000);
}

function mealsForDay(index: number) {
  const variations = [
    [
      ['نان سنگک', 70, 181, 6, 37, 1.2],
      ['پنیر سفید', 30, 79, 4.2, 1.2, 6.2],
      ['گردو', 12, 79, 1.8, 1.6, 7.8],
    ],
    [
      ['مرغ گریل‌شده', 140, 231, 43, 0, 5],
      ['برنج پخته', 150, 195, 4, 42, 0.5],
      ['سالاد شیرازی', 180, 54, 2, 10, 0.6],
    ],
    [
      ['عدسی', 260, 272, 18, 47, 1.2],
      ['ماست و خیار', 150, 105, 6, 9, 5],
    ],
  ];
  const item = (entry: (string | number)[]) => ({
    displayName: entry[0] as string,
    grams: entry[1] as number,
    energyKcal: entry[2] as number,
    proteinG: entry[3] as number,
    carbohydrateG: entry[4] as number,
    fatG: entry[5] as number,
  });
  const ordered = index % 3 === 2 ? [variations[1], variations[0]] : variations;
  return ordered.map((items, position) => ({
    time: ['08:00', '13:30', '20:00'][position],
    mealType: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER][position],
    items: items.map(item),
  }));
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
