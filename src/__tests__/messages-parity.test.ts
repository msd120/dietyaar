import { describe, expect, it } from 'vitest';
import { en } from '@/messages/en';
import { fa } from '@/messages/fa';

function keys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object'
      ? keys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('runtime locale dictionaries', () => {
  it('keep Persian and English keys in parity', () => {
    expect(keys(fa)).toEqual(keys(en));
  });
});
