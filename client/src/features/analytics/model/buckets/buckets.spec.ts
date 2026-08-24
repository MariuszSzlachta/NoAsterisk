import { describe, expect, it } from 'vitest';

import { getBuckets } from './buckets';

describe('getBuckets — monthly', () => {
  it('generates one bucket per month', () => {
    const from = new Date(2026, 0, 1); // Jan 1
    const to = new Date(2026, 2, 31);   // Mar 31
    const buckets = getBuckets(from, to, 'monthly');
    expect(buckets).toHaveLength(3);
  });

  it('bucket start is first day of month', () => {
    const from = new Date(2026, 0, 15);
    const to = new Date(2026, 2, 15);
    const buckets = getBuckets(from, to, 'monthly');
    expect(buckets[0].start).toBe('2026-01-01');
  });

  it('bucket end is last day of month', () => {
    const from = new Date(2026, 1, 1); // Feb
    const to = new Date(2026, 1, 28);
    const buckets = getBuckets(from, to, 'monthly');
    expect(buckets[0].end).toBe('2026-02-28');
  });

  it('label contains month key and 2-digit year', () => {
    const from = new Date(2026, 5, 1); // Jun
    const to = new Date(2026, 5, 30);
    const buckets = getBuckets(from, to, 'monthly');
    expect(buckets[0].label).toBe('months.jun:26');
  });
});

describe('getBuckets — weekly', () => {
  it('generates 7-day buckets', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 21);
    const buckets = getBuckets(from, to, 'weekly');
    expect(buckets).toHaveLength(3);
  });

  it('last bucket end does not exceed range end', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 10);
    const buckets = getBuckets(from, to, 'weekly');
    expect(buckets[1].end).toBe('2026-01-10');
  });

  it('label is day.month format', () => {
    const from = new Date(2026, 2, 5); // Mar 5
    const to = new Date(2026, 2, 11);
    const buckets = getBuckets(from, to, 'weekly');
    expect(buckets[0].label).toBe('5.03');
  });
});

describe('getBuckets — daily', () => {
  it('generates one bucket per day', () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 0, 5);
    const buckets = getBuckets(from, to, 'daily');
    expect(buckets).toHaveLength(5);
  });

  it('bucket start equals end (single day)', () => {
    const from = new Date(2026, 3, 10);
    const to = new Date(2026, 3, 10);
    const buckets = getBuckets(from, to, 'daily');
    expect(buckets[0].start).toBe('2026-04-10');
    expect(buckets[0].end).toBe('2026-04-10');
  });

  it('label is day.month format', () => {
    const from = new Date(2026, 11, 25); // Dec 25
    const to = new Date(2026, 11, 25);
    const buckets = getBuckets(from, to, 'daily');
    expect(buckets[0].label).toBe('25.12');
  });
});
