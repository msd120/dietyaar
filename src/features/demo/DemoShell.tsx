'use client';

import { useState, useTransition } from 'react';
import {
  Activity,
  Apple,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Home,
  Languages,
  Leaf,
  LogOut,
  Menu,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Utensils,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  confirmMealDraftAction,
  createManualMealDraftAction,
  saveOnboardingProgressAction,
} from '@/actions/manual-core';
import { authClient } from '@/lib/auth-client';
import { demoScreens, type DemoScreen } from './demo-screens';

const groupLabels = {
  auth: ['حساب', 'Account'],
  onboarding: ['شروع کار', 'Onboarding'],
  today: ['امروز', 'Today'],
  meals: ['وعده‌ها', 'Meals'],
  history: ['تاریخچه', 'History'],
  plans: ['برنامه', 'Plan'],
  settings: ['تنظیمات', 'Settings'],
  legal: ['حقوقی', 'Legal'],
} as const;

export type TodayMeal = {
  id: string;
  consumedAt: string;
  items: Array<{ id: string; displayName: string; energyKcal: string | null }>;
};

function ScreenBody({
  screen,
  fa,
  locale,
  onNavigate,
  nextScreen,
  todayMeals,
}: {
  screen: DemoScreen;
  fa: boolean;
  locale: string;
  onNavigate: (screenId: string) => void;
  nextScreen: DemoScreen;
  todayMeals: TodayMeal[];
}) {
  const group = screen.group;
  if (screen.id === 'T01') return <Today fa={fa} onNavigate={onNavigate} meals={todayMeals} />;
  if (group === 'meals')
    return (
      <Meals
        screen={screen}
        fa={fa}
        locale={locale}
        onNavigate={onNavigate}
        nextScreen={nextScreen}
      />
    );
  if (group === 'history') return <HistoryView screen={screen} fa={fa} />;
  if (group === 'plans')
    return <PlanView screen={screen} fa={fa} onNavigate={onNavigate} nextScreen={nextScreen} />;
  if (group === 'onboarding')
    return (
      <Onboarding
        screen={screen}
        fa={fa}
        locale={locale}
        onNavigate={onNavigate}
        nextScreen={nextScreen}
      />
    );
  if (group === 'settings') return <SettingsView fa={fa} />;
  return <GenericView screen={screen} fa={fa} onNavigate={onNavigate} nextScreen={nextScreen} />;
}

export function DemoShell({
  locale,
  screen,
  userName,
  todayMeals,
}: {
  locale: string;
  screen: DemoScreen;
  userName: string;
  todayMeals: TodayMeal[];
}) {
  const fa = locale === 'fa';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = demoScreens.findIndex((item) => item.id === screen.id);
  const previous = demoScreens[Math.max(0, current - 1)];
  const next = demoScreens[Math.min(demoScreens.length - 1, current + 1)];

  async function signOut() {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  function navigateTo(screenId: string) {
    router.push(`/${locale}/demo/${screenId}`);
  }

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button aria-label={fa ? 'بازکردن فهرست' : 'Open menu'} onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span className="font-bold">{fa ? 'دیت‌یار' : 'Dietyaar'}</span>
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">DEMO</span>
        </div>
      </header>
      <aside
        className={`${open ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'} fixed inset-y-0 start-0 z-50 w-80 border-e bg-background transition-transform lg:!translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Leaf />
            </span>
            <div>
              <div className="font-bold">{fa ? 'دیت‌یار' : 'Dietyaar'}</div>
              <div className="text-xs text-muted-foreground">
                {fa ? 'نسخه نمایشی' : 'Demo experience'}
              </div>
            </div>
          </div>
          <button
            className="lg:hidden"
            aria-label={fa ? 'بستن فهرست' : 'Close menu'}
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <nav className="custom-scrollbar h-[calc(100vh-10rem)] overflow-y-auto p-3">
          {Object.keys(groupLabels).map((group) => {
            const items = demoScreens.filter((item) => item.group === group);
            return (
              <div key={group} className="mb-4">
                <p className="mb-1 px-3 text-xs font-semibold text-muted-foreground">
                  {groupLabels[group as keyof typeof groupLabels][fa ? 0 : 1]}
                </p>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${locale}/demo/${item.id}`}
                    onClick={() => setOpen(false)}
                    className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${item.id === screen.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    <span className="w-9 shrink-0 font-mono text-xs opacity-75">{item.id}</span>
                    <span>{fa ? item.fa : item.en}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t bg-background p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted"
          >
            <LogOut /> {fa ? 'خروج از دمو' : 'Sign out'}{' '}
            <span className="ms-auto text-xs text-muted-foreground" dir="auto">
              {userName}
            </span>
          </button>
        </div>
      </aside>

      <main className="lg:ms-80">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-8 lg:py-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                  {screen.id}
                </span>
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {fa ? 'داده نمونه' : 'Sample data'}
                </span>
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{fa ? screen.fa : screen.en}</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {fa ? screen.descriptionFa : screen.descriptionEn}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${fa ? 'en' : 'fa'}/demo/${screen.id}`}>
                  <Languages />
                  {fa ? 'English' : 'فارسی'}
                </Link>
              </Button>
            </div>
          </div>
          <ScreenBody
            screen={screen}
            fa={fa}
            locale={locale}
            onNavigate={navigateTo}
            nextScreen={next}
            todayMeals={todayMeals}
          />
          <div className="mt-10 flex flex-col items-stretch gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button className="w-full sm:w-auto" variant="outline" asChild disabled={current === 0}>
              <Link href={`/${locale}/demo/${previous.id}`}>
                {fa ? <ChevronRight /> : <ChevronLeft />}
                {fa ? previous.fa : previous.en}
              </Link>
            </Button>
            <span className="order-first text-center text-xs text-muted-foreground sm:order-none">
              {current + 1} / {demoScreens.length}
            </span>
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              asChild
              disabled={current === demoScreens.length - 1}
            >
              <Link href={`/${locale}/demo/${next.id}`}>
                {fa ? next.fa : next.en}
                {fa ? <ChevronLeft /> : <ChevronRight />}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      {open ? (
        <button
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label={fa ? 'بستن' : 'Close'}
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

const metric = (icon: React.ReactNode, label: string, value: string, note: string) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-5">
      <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </CardContent>
  </Card>
);

function Today({
  fa,
  onNavigate,
  meals,
}: {
  fa: boolean;
  onNavigate: (screenId: string) => void;
  meals: TodayMeal[];
}) {
  const knownEnergy = meals.reduce(
    (total, meal) =>
      total +
      meal.items.reduce((sum, item) => sum + (item.energyKcal ? Number(item.energyKcal) : 0), 0),
    0,
  );
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/15 to-card">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles />
            {fa ? 'بازتاب صبحگاهی' : 'Morning reflection'}
          </div>
          <CardTitle className="text-2xl">
            {fa
              ? 'امروز روی پیوستگی تمرکز کن، نه بی‌نقص‌بودن.'
              : 'Focus on consistency today, not perfection.'}
          </CardTitle>
          <CardDescription>
            {fa
              ? 'دیروز ۳ وعده را کامل ثبت کردی. صبحانه امروز از ساعت ۸ برنامه‌ریزی شده است.'
              : 'You logged 3 complete meals yesterday. Breakfast is planned for 8:00.'}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metric(
          <Activity />,
          fa ? 'انرژی ثبت‌شده' : 'Energy logged',
          `${knownEnergy.toLocaleString(fa ? 'fa-IR' : 'en-US')} kcal`,
          fa ? 'فقط مقادیر شناخته‌شده' : 'known values only',
        )}
        {metric(
          <Apple />,
          fa ? 'پروتئین' : 'Protein',
          fa ? '۷۲ گرم' : '72 g',
          fa ? 'مقدار شناخته‌شده' : 'known total',
        )}
        {metric(
          <Utensils />,
          fa ? 'وعده‌ها' : 'Meals',
          meals.length.toLocaleString(fa ? 'fa-IR' : 'en-US'),
          fa ? 'وعدهٔ تأییدشدهٔ امروز' : 'confirmed meals today',
        )}
        {metric(
          <Clock3 />,
          fa ? 'وضعیت روز' : 'Day status',
          meals.length ? (fa ? 'در حال ثبت' : 'In progress') : fa ? 'شروع نشده' : 'Not started',
          fa ? 'با تأیید هر وعده به‌روز می‌شود' : 'updates after each confirmation',
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'وعده‌های امروز' : "Today's meals"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {meals.length ? (
            meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-4 rounded-xl border p-4">
                <span className="font-mono text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat(fa ? 'fa-IR' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Tehran',
                  }).format(new Date(meal.consumedAt))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{fa ? 'وعده ثبت‌شده' : 'Logged meal'}</p>
                  <p className="truncate text-sm text-muted-foreground" dir="auto">
                    {meal.items.map((item) => item.displayName).join('، ')}
                  </p>
                </div>
                <span className="text-sm">
                  {meal.items.reduce(
                    (total, item) => total + (item.energyKcal ? Number(item.energyKcal) : 0),
                    0,
                  )}{' '}
                  kcal
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {fa
                ? 'هنوز وعدهٔ تأییدشده‌ای برای امروز نداری.'
                : 'You have no confirmed meals for today yet.'}
            </p>
          )}
        </CardContent>
      </Card>
      <Button size="lg" onClick={() => onNavigate('M01')}>
        <Plus />
        {fa ? 'ثبت وعده' : 'Log meal'}
      </Button>
    </div>
  );
}

function Onboarding({
  screen,
  fa,
  locale,
  onNavigate,
  nextScreen,
}: {
  screen: DemoScreen;
  fa: boolean;
  locale: string;
  onNavigate: (screenId: string) => void;
  nextScreen: DemoScreen;
}) {
  const step = Number(screen.id.slice(1));
  const [isSaving, startSaving] = useTransition();

  function continueOnboarding() {
    startSaving(async () => {
      await saveOnboardingProgressAction({
        locale: locale === 'en' ? 'en' : 'fa',
        nextStep: Math.min(step + 1, 9),
      });
      onNavigate(nextScreen.id);
    });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <Card>
        <CardHeader>
          <CardTitle>{fa ? screen.fa : screen.en}</CardTitle>
          <CardDescription>
            {fa
              ? 'برای دیدن جریان، مرحله‌به‌مرحله ادامه بده. این محیط اطلاعات واقعی را ذخیره نمی‌کند.'
              : 'Continue step by step to view the flow. This environment does not save real data.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="rounded-xl border border-primary bg-primary/5 p-5">
              <input type="radio" defaultChecked className="me-3" />
              {fa ? 'مسیر تمرینی نمونه' : 'Sample walkthrough'}
            </label>
            <label className="rounded-xl border p-5">
              <input type="radio" className="me-3" />
              {fa ? 'مرور مسیر ورود دستی' : 'Review the manual-entry path'}
            </label>
          </div>
          <div className="rounded-xl bg-muted p-4 text-sm leading-7">
            {fa
              ? 'در محصول، هوش مصنوعی اختیاری است و هر نتیجه پیش از ثبت به تأیید شما نیاز دارد. مسیر دستی همیشه در دسترس است.'
              : 'In the product, AI is optional and every result needs your confirmation before it is saved. Manual entry is always available.'}
          </div>
          <div className="flex justify-end">
            <Button loading={isSaving} onClick={continueOnboarding}>
              {fa ? `ادامه به ${nextScreen.fa}` : `Continue to ${nextScreen.en}`}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'پیشرفت شروع کار' : 'Onboarding progress'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(step * 11, 100)} />
          <p className="mt-3 text-sm text-muted-foreground">
            {fa ? `مرحله ${step} از ۹` : `Step ${step} of 9`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Meals({
  screen,
  fa,
  locale,
  onNavigate,
  nextScreen,
}: {
  screen: DemoScreen;
  fa: boolean;
  locale: string;
  onNavigate: (screenId: string) => void;
  nextScreen: DemoScreen;
}) {
  const searchParams = useSearchParams();
  const [isSaving, startSaving] = useTransition();
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('');
  const [energyKcal, setEnergyKcal] = useState('');
  const draftId = searchParams.get('draft');

  function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSaving(async () => {
      const draft = await createManualMealDraftAction({
        locale: locale === 'en' ? 'en' : 'fa',
        displayName: name,
        grams,
        energyKcal,
      });
      onNavigate(`M03?draft=${draft.id}`);
    });
  }

  function confirmDraft() {
    if (!draftId) return;
    startSaving(async () => {
      await confirmMealDraftAction({ locale: locale === 'en' ? 'en' : 'fa', draftId });
      onNavigate('T01');
    });
  }

  if (screen.id === 'M01') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'روش ثبت وعده' : 'Meal method'}</CardTitle>
          <CardDescription>
            {fa ? 'ثبت دستی در این مرحله فعال است.' : 'Manual entry is available in this step.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onNavigate('M02')}>
            <Plus />
            {fa ? 'ثبت دستی وعده' : 'Log a meal manually'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (screen.id === 'M02') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'جزئیات وعده' : 'Meal details'}</CardTitle>
          <CardDescription>
            {fa
              ? 'حداقل نام غذا را وارد کن. مقدار و انرژی اختیاری هستند.'
              : 'Enter at least a food name. Portion and energy are optional.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={createDraft}>
            <label className="block space-y-2 text-sm font-medium">
              {fa ? 'نام غذا' : 'Food name'}
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                dir="auto"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                {fa ? 'مقدار (گرم)' : 'Portion (g)'}
                <Input
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                  inputMode="decimal"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                {fa ? 'انرژی (کیلوکالری)' : 'Energy (kcal)'}
                <Input
                  value={energyKcal}
                  onChange={(event) => setEnergyKcal(event.target.value)}
                  inputMode="decimal"
                />
              </label>
            </div>
            <Button loading={isSaving} type="submit">
              {fa ? 'مرور پیش از تأیید' : 'Review before confirming'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (screen.id === 'M03') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'مرور وعده' : 'Meal review'}</CardTitle>
          <CardDescription>
            {draftId
              ? fa
                ? 'این وعده پس از تأیید در مجموع امروز لحاظ می‌شود.'
                : 'This meal will count toward Today only after you confirm it.'
              : fa
                ? 'ابتدا جزئیات وعده را وارد کن.'
                : 'Enter meal details first.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button disabled={!draftId} loading={isSaving} onClick={confirmDraft}>
            <ShieldCheck />
            {fa ? 'تأیید و ثبت وعده' : 'Confirm and log meal'}
          </Button>
          {!draftId ? (
            <Button variant="outline" onClick={() => onNavigate('M02')}>
              {fa ? 'ورود به جزئیات وعده' : 'Enter meal details'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{fa ? 'وعده نمونه' : 'Sample meal'}</CardTitle>
          <CardDescription>{fa ? screen.descriptionFa : screen.descriptionEn}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            [fa ? 'برنج پخته' : 'Cooked rice', '180 g', '234 kcal'],
            [fa ? 'جوجه کباب' : 'Chicken kebab', '150 g', '250 kcal'],
            [fa ? 'سالاد شیرازی' : 'Shirazi salad', '120 g', '55 kcal'],
          ].map((item) => (
            <div
              key={item[0]}
              className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl border p-4"
            >
              <span dir="auto">{item[0]}</span>
              <span>{item[1]}</span>
              <span>{item[2]}</span>
            </div>
          ))}
          <Button onClick={() => onNavigate(nextScreen.id)}>
            <ShieldCheck />
            {fa ? 'تأیید وعده' : 'Confirm meal'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'جمع شناخته‌شده' : 'Known totals'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-bold">
            539 <small className="text-sm font-normal">kcal</small>
          </p>
          <div>
            <div className="flex justify-between text-sm">
              <span>{fa ? 'پروتئین' : 'Protein'}</span>
              <span>48 g</span>
            </div>
            <Progress value={72} />
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            {fa
              ? 'منبع: پایگاه غذایی نمونه. مقادیر ناشناخته صفر فرض نمی‌شوند.'
              : 'Source: sample food catalog. Unknown values are never treated as zero.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryView({ screen, fa }: { screen: DemoScreen; fa: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {metric(
          <CalendarDays />,
          fa ? 'روزهای کامل' : 'Complete days',
          fa ? '۵ روز' : '5 days',
          fa ? 'در ۷ روز اخیر' : 'in the last 7 days',
        )}
        {metric(
          <Scale />,
          fa ? 'آخرین وزن' : 'Latest weight',
          fa ? '۷۸٫۴ کیلوگرم' : '78.4 kg',
          fa ? 'ثبت اختیاری' : 'optional tracking',
        )}
        {metric(
          <Activity />,
          fa ? 'تغییر دوره' : 'Period change',
          fa ? '۰٫۶− کیلوگرم' : '−0.6 kg',
          fa ? 'بدون ادعای علت' : 'no causal claim',
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{fa ? screen.fa : screen.en}</CardTitle>
        </CardHeader>
        <CardContent>
          {[88, 64, 92, 78, 70, 96, 55].map((value, index) => (
            <div key={index} className="mb-3 grid grid-cols-[5rem_1fr_auto] items-center gap-4">
              <span className="text-sm">
                {fa
                  ? ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'][index]
                  : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index]}
              </span>
              <Progress value={value} />
              <span className="text-xs text-muted-foreground">{value}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanView({
  screen,
  fa,
  onNavigate,
  nextScreen,
}: {
  screen: DemoScreen;
  fa: boolean;
  onNavigate: (screenId: string) => void;
  nextScreen: DemoScreen;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>{fa ? 'برنامه تعادل هفتگی' : 'Weekly balance plan'}</CardTitle>
          <CardDescription>
            {fa
              ? 'نسخه فعال از ۲۵ آبان ۱۴۰۵ • منبع: متخصص تغذیه'
              : 'Active since Nov 16, 2026 • Source: dietitian'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ['08:00', fa ? 'صبحانه' : 'Breakfast'],
            ['11:00', fa ? 'میان‌وعده' : 'Snack'],
            ['13:30', fa ? 'ناهار' : 'Lunch'],
            ['20:00', fa ? 'شام' : 'Dinner'],
          ].map((slot, index) => (
            <div key={slot[0]} className="flex gap-4 rounded-xl border p-4">
              <span className="font-mono text-primary">{slot[0]}</span>
              <div>
                <p className="font-semibold">{slot[1]}</p>
                <p className="text-sm text-muted-foreground" dir="auto">
                  {index % 2
                    ? fa
                      ? 'میوه فصل یا ماست'
                      : 'Seasonal fruit or yogurt'
                    : fa
                      ? 'یک سهم پروتئین + غلات + سبزیجات'
                      : 'Protein + grain + vegetables'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{fa ? screen.fa : screen.en}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{fa ? 'هدف: کاهش وزن' : 'Goal: weight loss'}</p>
          <p>{fa ? 'انرژی: ۱۶۰۰ تا ۱۸۰۰' : 'Energy: 1,600–1,800'}</p>
          <p>{fa ? 'وضعیت: فعال' : 'Status: active'}</p>
          <Button className="w-full" onClick={() => onNavigate(nextScreen.id)}>
            <ClipboardList />
            {fa ? 'مشاهده نسخه' : 'View version'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsView({ fa }: { fa: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        [
          <Home key="a" />,
          fa ? 'پروفایل دمو' : 'Demo profile',
          fa ? 'سارا • کاهش وزن • متریک' : 'Sara • weight loss • metric',
        ],
        [
          <Languages key="b" />,
          fa ? 'زبان و ظاهر' : 'Language & appearance',
          fa ? 'فارسی • تیره' : 'English • dark',
        ],
        [
          <Clock3 key="c" />,
          fa ? 'زمان و پیام صبح' : 'Time & morning check-in',
          fa ? 'تهران • ساعت ۸:۰۰' : 'Tehran • 8:00',
        ],
        [
          <ShieldCheck key="d" />,
          fa ? 'حریم خصوصی' : 'Privacy',
          fa ? 'AI غیرفعال • مسیر دستی فعال' : 'AI off • manual available',
        ],
      ].map((item) => (
        <Card key={String(item[1])}>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-xl bg-muted text-primary">
              {item[0]}
            </span>
            <div>
              <p className="font-semibold">{item[1]}</p>
              <p className="text-sm text-muted-foreground">{item[2]}</p>
            </div>
            <ChevronLeft className="ms-auto rtl:block ltr:hidden" />
            <ChevronRight className="ms-auto ltr:block rtl:hidden" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GenericView({
  screen,
  fa,
  onNavigate,
  nextScreen,
}: {
  screen: DemoScreen;
  fa: boolean;
  onNavigate: (screenId: string) => void;
  nextScreen: DemoScreen;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{fa ? screen.fa : screen.en}</CardTitle>
        <CardDescription>{fa ? screen.descriptionFa : screen.descriptionEn}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/40 p-5">
          <p className="font-semibold">
            {fa ? 'حالت نمونه آماده نمایش' : 'Demo-ready sample state'}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {fa
              ? 'این نما وضعیت موفق، راهنمای خطا و مسیر بازگشت را برای ارائه دوره نشان می‌دهد. اطلاعات حساس یا واقعی در آن وجود ندارد.'
              : 'This view demonstrates success, recoverable error and return paths for the course. It contains no real or sensitive data.'}
          </p>
        </div>
        <Button onClick={() => onNavigate(nextScreen.id)}>
          <Target />
          {fa ? 'ادامه مسیر دمو' : 'Continue demo journey'}
        </Button>
      </CardContent>
    </Card>
  );
}
