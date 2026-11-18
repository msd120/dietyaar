import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { securityHeaders } from '@/lib/security-headers';

describe('security boundaries', () => {
  it('keeps camera disabled and ships a restrictive CSP', () => {
    const headers = new Map(securityHeaders.map(({ key, value }) => [key, value]));
    expect(headers.get('Permissions-Policy')).toContain('camera=()');

    const csp =
      headers.get('Content-Security-Policy') ?? headers.get('Content-Security-Policy-Report-Only');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('*');
  });

  it('does not expose privileged variable names through NEXT_PUBLIC variables', () => {
    const example = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    expect(example).not.toMatch(/NEXT_PUBLIC_.*(?:SERVICE_ROLE|API_KEY|DATABASE_URL|SECRET)/);
  });
});
