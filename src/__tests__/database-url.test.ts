import { describe, expect, it } from 'vitest';

import { requireTestDatabaseUrl } from '../../scripts/test-database-url.mjs';

describe('test database URL guard', () => {
  it('accepts the dedicated local integration database', () => {
    expect(
      requireTestDatabaseUrl(
        'postgresql://postgres:postgres@localhost:5433/dietyaar_test?schema=public',
      ),
    ).toContain('/dietyaar_test');
  });

  it.each([
    [undefined, 'required'],
    ['postgresql://postgres:postgres@localhost:5432/app', 'standalone test marker'],
    ['postgresql://postgres:postgres@db.example.com:5432/dietyaar_test', 'non-local'],
    ['https://localhost/dietyaar_test', 'postgresql://'],
  ])('rejects unsafe URL %s', (url, message) => {
    expect(() => requireTestDatabaseUrl(url)).toThrow(message);
  });
});
