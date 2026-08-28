import { describe, expect, it, vi } from 'vitest';

import { sleep } from '#features/csv-import/ui/hooks/useImportSubmit/sleep';

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('returns a promise', () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
  });
});
