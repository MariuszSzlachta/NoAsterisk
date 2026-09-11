import { describe, expect, it } from 'vitest';

import { isAutoLockEnabled } from './auto-lock-config';

describe('isAutoLockEnabled', () => {
  it('always disables automatic locking in development', () => {
    expect(isAutoLockEnabled(true, 'true')).toBe(false);
  });

  it('requires an explicit production opt-in', () => {
    expect(isAutoLockEnabled(false, undefined)).toBe(false);
    expect(isAutoLockEnabled(false, 'false')).toBe(false);
    expect(isAutoLockEnabled(false, 'true')).toBe(true);
  });
});
