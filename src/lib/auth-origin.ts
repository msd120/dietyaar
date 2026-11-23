type AuthEnvironment = {
  BETTER_AUTH_URL: string;
  NODE_ENV: 'development' | 'test' | 'production';
  VERCEL_ENV?: 'development' | 'preview' | 'production';
  VERCEL_URL?: string;
};

type DynamicBaseUrl = {
  allowedHosts: string[];
  fallback: string;
  protocol: 'https';
};

export type AuthOriginConfiguration = {
  baseURL: string | DynamicBaseUrl;
  trustedOrigins: string[];
};

function getPreviewHost(vercelUrl: string | undefined) {
  if (!vercelUrl || vercelUrl.includes('*') || vercelUrl.includes(':')) return undefined;

  try {
    const url = new URL(`https://${vercelUrl}`);
    if (
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.hostname === 'vercel.app' ||
      !url.hostname.endsWith('.vercel.app')
    ) {
      return undefined;
    }

    return url.host;
  } catch {
    return undefined;
  }
}

/**
 * Vercel exposes the exact preview deployment hostname as a system variable.
 * Dynamic resolution is enabled only for that one hostname, never for a
 * wildcard Vercel domain or caller-controlled forwarded header.
 */
export function getAuthOriginConfiguration(env: AuthEnvironment): AuthOriginConfiguration {
  const fixedOrigin = new URL(env.BETTER_AUTH_URL).origin;
  const previewHost = env.VERCEL_ENV === 'preview' ? getPreviewHost(env.VERCEL_URL) : undefined;

  if (previewHost) {
    return {
      baseURL: {
        allowedHosts: [new URL(fixedOrigin).host, previewHost],
        fallback: fixedOrigin,
        protocol: 'https',
      },
      trustedOrigins: [],
    };
  }

  return {
    baseURL: fixedOrigin,
    // Retain the existing LAN development origin only outside production.
    trustedOrigins: env.NODE_ENV === 'production' ? [] : ['http://192.168.44.7:3000'],
  };
}
