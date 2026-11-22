import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AppNav } from '@/features/app-shell/AppNav';
import { ManualMealForm } from '@/features/meals/ManualMealForm';
import { SavedMeals } from '@/features/meals/SavedMeals';
import { UserFoodForm } from '@/features/meals/UserFoodForm';
import { parseStructuredPlan } from '@/domain/plans/structured-plan';
import { auth } from '@/lib/auth';
import { listSavedMeals } from '@/services/meals/saved-meal-service';
import { listCatalogFoods, listUserFoods } from '@/services/nutrition/nutrition-service';
import { getApplicablePlan } from '@/services/plans/plan-service';
import { getOnboardingData } from '@/services/profiles/profile-service';

export default async function NewMealPage({
  params,
}: Readonly<{ params: Promise<{ locale: 'fa' | 'en' }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${locale}/login`);
  const onboarding = await getOnboardingData(session.user.id);
  const timezone = onboarding.profile?.timezone ?? 'Asia/Tehran';
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  const [savedMeals, catalogFoods, userFoods, applicablePlan] = await Promise.all([
    listSavedMeals(session.user.id),
    listCatalogFoods(),
    listUserFoods(session.user.id),
    getApplicablePlan({ userId: session.user.id, localDate }),
  ]);
  const structuredPlan = parseStructuredPlan(applicablePlan?.snapshot);
  const t = await getTranslations('meal');
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <AppNav locale={locale} />
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
        <ManualMealForm
          locale={locale}
          slots={structuredPlan?.slots.map((slot) => ({ id: slot.id, label: slot.label })) ?? []}
          foodOptions={[
            ...catalogFoods.map((food) => ({
              id: food.id,
              name:
                locale === 'fa'
                  ? food.canonicalNameFa
                  : (food.canonicalNameEn ?? food.canonicalNameFa),
              type: 'CATALOG' as const,
              hasNutrients: [food.energyKcal, food.proteinG, food.carbohydrateG, food.fatG].some(
                Boolean,
              ),
            })),
            ...userFoods.map((food) => ({
              id: food.id,
              name: food.name,
              type: 'USER_FOOD' as const,
              hasNutrients: [food.energyKcal, food.proteinG, food.carbohydrateG, food.fatG].some(
                Boolean,
              ),
            })),
          ]}
        />
      </section>
      <SavedMeals
        locale={locale}
        meals={savedMeals.map((meal) => ({ id: meal.id, name: meal.name }))}
      />
      <UserFoodForm
        locale={locale}
        foods={userFoods.map((food) => ({ id: food.id, name: food.name }))}
      />
    </main>
  );
}
