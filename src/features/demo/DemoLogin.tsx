'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function DemoLogin({ locale }: { locale: string }) {
  const fa = locale === 'fa';
  const router = useRouter();
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('DietyaarDemo1405!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const Arrow = fa ? ArrowLeft : ArrowRight;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await authClient.signIn.username({ username, password });
    setLoading(false);
    if (result.error) {
      setError(fa ? 'نام کاربری یا رمز عبور درست نیست.' : 'The username or password is incorrect.');
      return;
    }
    router.push(`/${locale}/demo/T01`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--brand-500)/.2),transparent_42%)] px-5 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <section className="space-y-7">
          <div className="flex items-center gap-3 text-primary">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Leaf />
            </span>
            <span className="text-xl font-bold">{fa ? 'دیت‌یار' : 'Dietyaar'}</span>
          </div>
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold text-primary">
              {fa ? 'نسخه نمایشی دوره' : 'Course demo'}
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight sm:text-6xl">
              {fa
                ? 'برنامه غذایی‌ات را بهتر بفهم، نه سخت‌تر.'
                : 'Understand your nutrition plan—without making it harder.'}
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              {fa
                ? 'یک تجربه کامل برای برنامه، ثبت وعده، مرور روند و بازتاب صبحگاهی؛ با کنترل کامل در دست شما.'
                : 'A complete experience for plans, meal logging, progress and calm morning reflections—with you in control.'}
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              fa ? 'برنامه دستی و قابل اصلاح' : 'Editable manual plan',
              fa ? 'ثبت سریع وعده‌ها' : 'Fast meal logging',
              fa ? 'روند بدون قضاوت' : 'Judgment-free trends',
            ].map((item) => (
              <div key={item} className="rounded-2xl border bg-card/70 p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md border-primary/20 shadow-2xl shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-2xl">
              {fa ? 'ورود به دموی دیت‌یار' : 'Enter the Dietyaar demo'}
            </CardTitle>
            <CardDescription>
              {fa ? 'اطلاعات حساب دمو از قبل وارد شده است.' : 'The demo credentials are prefilled.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="username">{fa ? 'نام کاربری' : 'Username'}</Label>
                <Input
                  id="username"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{fa ? 'رمز عبور' : 'Password'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    className="pe-11"
                    dir="ltr"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute end-1 top-1 grid size-8 place-items-center rounded-md text-muted-foreground"
                    aria-label={fa ? 'نمایش یا پنهان‌کردن رمز' : 'Show or hide password'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <Button className="h-12 w-full rounded-xl" loading={loading} type="submit">
                {fa ? 'ورود به دمو' : 'Enter demo'} <Arrow />
              </Button>
              <p className="text-center text-xs leading-6 text-muted-foreground">
                {fa
                  ? 'این حساب فقط برای نمایش دوره است و اطلاعات آن نمونه هستند.'
                  : 'This account is for the course demo and contains sample data only.'}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
