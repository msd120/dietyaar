import { describe, expect, it } from 'vitest';
import { getAuthOriginConfiguration } from '@/lib/auth-origin';

const production = {
  NODE_ENV: 'production' as const,
  BETTER_AUTH_URL: 'https://dietyaar.example',
};

describe('Better Auth origin configuration', () => {
  it('allows exactly the Vercel-provided preview host', () => {
    expect(
      getAuthOriginConfiguration({
        ...production,
        VERCEL_ENV: 'preview',
        VERCEL_URL: 'dietyaar-git-feature-msd120.vercel.app',
      }),
    ).toEqual({
      baseURL: {
        allowedHosts: ['dietyaar.example', 'dietyaar-git-feature-msd120.vercel.app'],
        fallback: 'https://dietyaar.example',
        protocol: 'https',
      },
      trustedOrigins: [],
    });
  });

  it('rejects malformed, non-Vercel, and wildcard preview values', () => {
    for (const vercelUrl of [
      'attacker.example',
      '*.vercel.app',
      'dietyaar.vercel.app/path',
      'dietyaar.vercel.app:443',
    ]) {
      expect(
        getAuthOriginConfiguration({
          ...production,
          VERCEL_ENV: 'preview',
          VERCEL_URL: vercelUrl,
        }),
      ).toEqual({ baseURL: 'https://dietyaar.example', trustedOrigins: [] });
    }
  });

  it('keeps production and local development behavior fixed', () => {
    expect(
      getAuthOriginConfiguration({
        ...production,
        VERCEL_ENV: 'production',
        VERCEL_URL: 'dietyaar-production-msd120.vercel.app',
      }),
    ).toEqual({ baseURL: 'https://dietyaar.example', trustedOrigins: [] });

    expect(
      getAuthOriginConfiguration({
        NODE_ENV: 'development',
        BETTER_AUTH_URL: 'http://localhost:3000',
      }),
    ).toEqual({
      baseURL: 'http://localhost:3000',
      trustedOrigins: ['http://192.168.44.7:3000'],
    });
  });
});
