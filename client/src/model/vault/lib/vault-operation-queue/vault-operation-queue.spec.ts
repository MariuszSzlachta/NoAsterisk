import { describe, expect, it } from 'vitest';

import { vaultOperationQueue } from './vault-operation-queue';

describe('vaultOperationQueue', () => {
  it('serializes vault operations and remains usable after rejection', async () => {
    const events: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = vaultOperationQueue(async () => {
      events.push('first');
      await firstGate;
    });
    const second = vaultOperationQueue(async () => {
      events.push('second');
      throw new Error('expected failure');
    });

    await Promise.resolve();
    expect(events).toEqual(['first']);
    releaseFirst?.();
    await first;
    await expect(second).rejects.toThrow('expected failure');
    await expect(vaultOperationQueue(async () => 'recovered')).resolves.toBe(
      'recovered',
    );
  });
});
