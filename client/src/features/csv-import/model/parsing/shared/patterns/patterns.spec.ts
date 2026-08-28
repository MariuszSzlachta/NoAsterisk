import { describe, expect, it } from 'vitest';

import { AMOUNT_PREFIX_SUFFIX_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/amount-prefix-suffix.pattern';
import { CRLF_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/crlf.pattern';
import { CURRENCY_SUFFIX_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/currency-suffix.pattern';
import { DATE_DELIMITER_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/date-delimiter.pattern';
import { DIGIT_SPACE_DIGIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/digit-space-digit.pattern';
import { DIGITS_ONLY_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/digits-only.pattern';
import { EN_THOUSANDS_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/en-thousands.pattern';
import { ENCODING_SEPARATOR_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/encoding-separator.pattern';
import { LEADING_HASH_GLOBAL_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/leading-hash-global.pattern';
import { LEADING_HASH_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/leading-hash.pattern';
import { LINE_SPLIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/line-split.pattern';
import { PL_THOUSANDS_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/pl-thousands.pattern';
import { SURROUNDING_QUOTES_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/surrounding-quotes.pattern';

describe('CRLF_PATTERN', () => {
  it('matches \\r\\n', () => {
    expect('a\r\nb'.replace(CRLF_PATTERN, '\n')).toBe('a\nb');
  });

  it('matches standalone \\r', () => {
    expect('a\rb'.replace(CRLF_PATTERN, '\n')).toBe('a\nb');
  });
});

describe('LINE_SPLIT_PATTERN', () => {
  it('splits on \\n', () => {
    expect('a\nb'.split(LINE_SPLIT_PATTERN)).toEqual(['a', 'b']);
  });

  it('splits on \\r\\n', () => {
    expect('a\r\nb'.split(LINE_SPLIT_PATTERN)).toEqual(['a', 'b']);
  });
});

describe('LEADING_HASH_PATTERN', () => {
  it('matches leading #', () => {
    expect('#Data'.replace(LEADING_HASH_PATTERN, '')).toBe('Data');
  });

  it('does not match mid-string #', () => {
    expect('Data#Op'.replace(LEADING_HASH_PATTERN, '')).toBe('Data#Op');
  });
});

describe('LEADING_HASH_GLOBAL_PATTERN', () => {
  it('matches leading # on multiple lines', () => {
    expect('#a\n#b'.replace(LEADING_HASH_GLOBAL_PATTERN, '')).toBe('a\nb');
  });
});

describe('SURROUNDING_QUOTES_PATTERN', () => {
  it('strips surrounding quotes', () => {
    expect('"Kwota"'.replace(SURROUNDING_QUOTES_PATTERN, '')).toBe('Kwota');
  });

  it('does not strip mid-string quotes', () => {
    expect('A"B'.replace(SURROUNDING_QUOTES_PATTERN, '')).toBe('A"B');
  });
});

describe('DATE_DELIMITER_PATTERN', () => {
  it('splits on dot', () => {
    expect('01.02.2025'.split(DATE_DELIMITER_PATTERN)).toEqual([
      '01',
      '02',
      '2025',
    ]);
  });

  it('splits on dash', () => {
    expect('2025-01-02'.split(DATE_DELIMITER_PATTERN)).toEqual([
      '2025',
      '01',
      '02',
    ]);
  });

  it('splits on slash', () => {
    expect('01/02/2025'.split(DATE_DELIMITER_PATTERN)).toEqual([
      '01',
      '02',
      '2025',
    ]);
  });
});

describe('ENCODING_SEPARATOR_PATTERN', () => {
  it('strips dashes and underscores', () => {
    expect('windows-1250'.replace(ENCODING_SEPARATOR_PATTERN, '')).toBe(
      'windows1250',
    );
    expect('utf_8'.replace(ENCODING_SEPARATOR_PATTERN, '')).toBe('utf8');
  });
});

describe('DIGITS_ONLY_PATTERN', () => {
  it('matches pure digits', () => {
    expect(DIGITS_ONLY_PATTERN.test('123')).toBe(true);
  });

  it('rejects non-digits', () => {
    expect(DIGITS_ONLY_PATTERN.test('12a')).toBe(false);
  });
});

describe('DIGIT_SPACE_DIGIT_PATTERN', () => {
  it('matches digit-space-digit', () => {
    expect(DIGIT_SPACE_DIGIT_PATTERN.test('1 234')).toBe(true);
  });

  it('rejects no-space amounts', () => {
    expect(DIGIT_SPACE_DIGIT_PATTERN.test('1234')).toBe(false);
  });
});

describe('AMOUNT_PREFIX_SUFFIX_PATTERN', () => {
  it('strips leading +/- and trailing parens', () => {
    expect('+(123)'.replace(AMOUNT_PREFIX_SUFFIX_PATTERN, '')).toBe('123');
  });
});

describe('PL_THOUSANDS_PATTERN', () => {
  it('strips spaces and dots', () => {
    expect('1 234.567'.replace(PL_THOUSANDS_PATTERN, '')).toBe('1234567');
  });
});

describe('EN_THOUSANDS_PATTERN', () => {
  it('strips commas and spaces', () => {
    expect('1,234 567'.replace(EN_THOUSANDS_PATTERN, '')).toBe('1234567');
  });
});

describe('CURRENCY_SUFFIX_PATTERN', () => {
  it('matches PLN suffix', () => {
    expect('100.00 PLN'.replace(CURRENCY_SUFFIX_PATTERN, '')).toBe('100.00');
  });

  it('matches EUR suffix', () => {
    expect('50.00EUR'.replace(CURRENCY_SUFFIX_PATTERN, '')).toBe('50.00');
  });

  it('does not match mid-string currency', () => {
    expect(CURRENCY_SUFFIX_PATTERN.test('PLN 100')).toBe(false);
  });
});
