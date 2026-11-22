import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DemoShell } from '@/features/demo/DemoShell';
import { getDemoScreen } from '@/features/demo/demo-screens';
import { auth } from '@/lib/auth';
import { listConfirmedMealsForToday } from '@/services/meals/meal-service';

export default async function DemoScreenPage({
  params,
}: {
  params: Promise<{ locale: string; screen: string }>;
}) {
  const { locale, screen: screenId } = await params;
  const screen = getDemoScreen(screenId.toUpperCase());
  if (!screen) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}`);
  const meals =
    screen.id === 'T01'
      ? await listConfirmedMealsForToday({ userId: session.user.id, timezone: 'Asia/Tehran' })
      : [];
  return (
    <DemoShell
      locale={locale}
      screen={screen}
      userName={session.user.name}
      todayMeals={meals.map((meal) => ({
        id: meal.id,
        consumedAt: meal.consumedAtUtc.toISOString(),
        items: meal.items.map((item) => ({
          id: item.id,
          displayName: item.displayName,
          energyKcal: item.energyKcal?.toString() ?? null,
        })),
      }))}
    />
  );
}
