import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { securityHeaders } from './src/lib/security-headers';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: ['192.168.44.7'],

  // pino's pretty transport runs in a worker thread the bundler cannot trace.
  serverExternalPackages: ['pino', 'pino-pretty'],

  images: {
    remotePatterns: [
      // Add remote image hosts here as needed.
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react'],
  },

  // Next.js already sets immutable Cache-Control on /_next/static and /_next/image;
  // only security headers are added here.
  async headers() {
    return [{ source: '/(.*)', headers: [...securityHeaders] }];
  },
};

export default withNextIntl(nextConfig);
