import { describe, expect, it } from 'vitest';
import { isSameOrigin } from '@/lib/request-security';

describe('request origin boundary', () => {
  it('accepts same-origin or non-browser requests and rejects mismatches', () => {
    expect(isSameOrigin(new Request('https://dietyaar.example/api/account/delete'))).toBe(true);
    expect(
      isSameOrigin(
        new Request('https://dietyaar.example/api/account/delete', {
          headers: { origin: 'https://dietyaar.example' },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request('https://dietyaar.example/api/account/delete', {
          headers: { origin: 'https://attacker.example' },
        }),
      ),
    ).toBe(false);
  });
});
