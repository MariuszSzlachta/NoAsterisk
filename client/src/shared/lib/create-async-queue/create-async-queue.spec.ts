import { describe, expect, it } from 'vitest';

import { createAsyncQueue } from '#shared/lib/create-async-queue';

describe('createAsyncQueue', () => {
  it('should serialize operations when the first one is still pending', async () => {
    const queue = createAsyncQueue();
    const events: string[] = [];
    let finish: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const first = queue(async () => {
      events.push('first');
      await waiting;
      events.push('finished');
    });
    const second = queue(async () => {
      events.push('second');
      return 'result';
    });
    await Promise.resolve();
    expect(events).toEqual(['first']);
    finish?.();
    await first;
    await expect(second).resolves.toBe('result');
    expect(events).toEqual(['first', 'finished', 'second']);
  });

  it('should continue processing when an operation rejects', async () => {
    const queue = createAsyncQueue();
    await expect(
      queue(async () => {
        throw new Error('failed');
      }),
    ).rejects.toThrow('failed');
    await expect(queue(async () => 'recovered')).resolves.toBe('recovered');
  });
});
