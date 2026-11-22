'use client';

import { RouteError } from '@/features/system/RouteStates';

export default function Error({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return <RouteError reset={reset} />;
}
