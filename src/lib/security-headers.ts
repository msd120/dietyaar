const development = process.env.NODE_ENV !== 'production';
const plainHttpE2E = process.env.DIETYAAR_E2E_HTTP === 'true';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "manifest-src 'self'",
  ...(development || plainHttpE2E ? [] : ['upgrade-insecure-requests']),
].join('; ');

export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera remains disabled until MED-01 verifies the user-initiated capture flow.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: development ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  // Browsers ignore HSTS over plain HTTP, so it is safe to send in development too.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
] as const;
