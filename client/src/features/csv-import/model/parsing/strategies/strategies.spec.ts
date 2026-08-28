import { describe, expect, it } from 'vitest';

import type { ReassemblyConfig } from '#features/csv-import/model/parsing/types/reassembly-config';

import { anchorStrategy } from '#features/csv-import/model/parsing/strategies/anchor-strategy';
import { directStrategy } from '#features/csv-import/model/parsing/strategies/direct-strategy';
import { overflowMergeStrategy } from '#features/csv-import/model/parsing/strategies/overflow-merge-strategy';

const config = (
  overrides: Partial<ReassemblyConfig> = {},
): ReassemblyConfig => ({
  expectedColumnCount: 6,
  separator: ';',
  ...overrides,
});

describe('directStrategy', () => {
  it('has type "direct"', () => {
    expect(directStrategy.type).toBe('direct');
  });

  it('passes through when token count matches expected', () => {
    const tokens = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(directStrategy.reassemble(tokens, config())).toEqual(tokens);
  });

  it('pads with empty strings when fewer tokens', () => {
    const tokens = ['a', 'b', 'c'];
    expect(directStrategy.reassemble(tokens, config())).toEqual([
      'a',
      'b',
      'c',
      '',
      '',
      '',
    ]);
  });

  it('truncates when more tokens than expected', () => {
    const tokens = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(directStrategy.reassemble(tokens, config())).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });

  it('handles empty tokens array', () => {
    expect(directStrategy.reassemble([], config())).toEqual([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  });

  it('handles single-column config', () => {
    expect(
      directStrategy.reassemble(['a', 'b'], config({ expectedColumnCount: 1 })),
    ).toEqual(['a']);
  });
});

describe('overflowMergeStrategy', () => {
  it('has type "overflow-merge"', () => {
    expect(overflowMergeStrategy.type).toBe('overflow-merge');
  });

  it('merges overflow tokens into designated column', () => {
    // mBank example: [Data, ZUS, PRZELEW, 436..., mBiznes, Ubezp, -2635 PLN, ""]
    const tokens = [
      '2026-07-01',
      'ZUS',
      'PRZELEW',
      '436000',
      'mBiznes',
      'Ubezp',
      '-2635 PLN',
      '',
    ];
    const result = overflowMergeStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 6,
        separator: ';',
        overflowColumnIndex: 1,
      }),
    );

    expect(result).toEqual([
      '2026-07-01',
      'ZUS;PRZELEW;436000',
      'mBiznes',
      'Ubezp',
      '-2635 PLN',
      '',
    ]);
  });

  it('pads when token count is less than expected', () => {
    const tokens = ['a', 'b', 'c'];
    expect(overflowMergeStrategy.reassemble(tokens, config())).toEqual([
      'a',
      'b',
      'c',
      '',
      '',
      '',
    ]);
  });

  it('passes through when token count equals expected', () => {
    const tokens = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(overflowMergeStrategy.reassemble(tokens, config())).toEqual(tokens);
  });

  it('defaults overflowColumnIndex to 1 when not specified', () => {
    const tokens = [
      'head',
      'over1',
      'over2',
      'tail1',
      'tail2',
      'tail3',
      'tail4',
    ];
    const result = overflowMergeStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 6,
        separator: ';',
      }),
    );

    expect(result[0]).toBe('head');
    expect(result[1]).toBe('over1;over2');
    expect(result.length).toBe(6);
  });

  it('handles overflowColumnIndex 0 (first column overflows)', () => {
    const tokens = ['over1', 'over2', 'over3', 'tail1', 'tail2'];
    const result = overflowMergeStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 3,
        separator: ',',
        overflowColumnIndex: 0,
      }),
    );

    expect(result).toEqual(['over1,over2,over3', 'tail1', 'tail2']);
  });

  it('handles large overflow (many extra tokens)', () => {
    const tokens = ['date', 'a', 'b', 'c', 'd', 'e', 'amount'];
    const result = overflowMergeStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 3,
        separator: ';',
        overflowColumnIndex: 1,
      }),
    );

    expect(result).toEqual(['date', 'a;b;c;d;e', 'amount']);
  });
});

describe('anchorStrategy', () => {
  it('has type "overflow-merge"', () => {
    expect(anchorStrategy.type).toBe('overflow-merge');
  });

  it('anchors on dates (start) and amounts (end), merges middle', () => {
    // 2 dates at start, 2 amounts at end, overflow in middle
    const tokens = [
      '14.06.2025',
      '14.06.2025',
      'ZAKUP',
      'ŻABKA',
      '',
      '-14,80',
      '3 840,67',
    ];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 5,
        separator: ';',
      }),
    );

    expect(result[0]).toBe('14.06.2025');
    expect(result[1]).toBe('14.06.2025');
    expect(result[2]).toBe('ZAKUP;ŻABKA;');
    expect(result[3]).toBe('-14,80');
    expect(result[4]).toBe('3 840,67');
  });

  it('pads when token count <= expected', () => {
    const tokens = ['14.06.2025', 'opis', '-14,80'];
    expect(
      anchorStrategy.reassemble(
        tokens,
        config({
          expectedColumnCount: 5,
          separator: ';',
        }),
      ),
    ).toEqual(['14.06.2025', 'opis', '-14,80', '', '']);
  });

  it('falls back to truncate when no start anchors found', () => {
    const tokens = [
      'text',
      'more',
      'stuff',
      'extra',
      '100,00',
      '200,00',
      '300,00',
    ];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 4,
        separator: ';',
      }),
    );

    expect(result).toEqual(['text', 'more', 'stuff', 'extra']);
  });

  it('falls back to truncate when no end anchors found', () => {
    const tokens = ['14.06.2025', '15.06.2025', 'text', 'more', 'stuff'];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 3,
        separator: ';',
      }),
    );

    expect(result).toEqual(['14.06.2025', '15.06.2025', 'text']);
  });

  it('falls back when more anchors than expected columns', () => {
    const tokens = [
      '14.06.2025',
      '15.06.2025',
      '16.06.2025',
      '100,00',
      '200,00',
    ];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 3,
        separator: ';',
      }),
    );

    expect(result).toEqual(['14.06.2025', '15.06.2025', '16.06.2025']);
  });

  it('handles single date anchor and single amount anchor', () => {
    const tokens = ['14.06.2025', 'desc1', 'desc2', '-87,43'];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 3,
        separator: ';',
      }),
    );

    expect(result[0]).toBe('14.06.2025');
    expect(result[1]).toBe('desc1;desc2');
    expect(result[2]).toBe('-87,43');
  });

  it('pads middle slots when more middle tokens than single slot', () => {
    // 1 date, 3 middle tokens, 1 amount, expected 4 → 2 middle slots
    const tokens = ['14.06.2025', 'desc', 'extra', 'more', '-87,43'];
    const result = anchorStrategy.reassemble(
      tokens,
      config({
        expectedColumnCount: 4,
        separator: ';',
      }),
    );

    expect(result[0]).toBe('14.06.2025');
    expect(result[1]).toBe('desc;extra;more');
    expect(result[2]).toBe('');
    expect(result[3]).toBe('-87,43');
  });
});
