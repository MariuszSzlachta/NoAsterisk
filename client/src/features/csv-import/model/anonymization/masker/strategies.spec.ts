import { describe, expect, it } from 'vitest';

import { maskAddress } from './mask-address';
import { maskBirthDate } from './mask-birth-date';
import { maskCard } from './mask-card';
import { maskEmail } from './mask-email';
import { maskIban } from './mask-iban';
import { maskName } from './mask-name';
import { maskNationalId } from './mask-national-id';
import { maskNip } from './mask-nip';
import { maskPesel } from './mask-pesel';
import { maskPhone } from './mask-phone';

describe('maskIban', () => {
  it('shows first 4 + last 4 chars of spaced IBAN', () => {
    expect(maskIban('PL61 1090 1014 0000 0712 1981 2874')).toBe(
      'PL61 •••• •••• 2874',
    );
  });

  it('handles compact IBAN', () => {
    expect(maskIban('PL61109010140000071219812874')).toBe(
      'PL61 •••• •••• 2874',
    );
  });

  it('strips leading apostrophe (Excel artifact)', () => {
    expect(maskIban("'PL61109010140000071219812874")).toBe(
      'PL61 •••• •••• 2874',
    );
  });
});

describe('maskCard', () => {
  it('shows first 4 + last 4 for full number', () => {
    expect(maskCard('4532 0151 2345 6789')).toBe('4532 •••• •••• 6789');
  });

  it('handles already-masked short pattern', () => {
    const result = maskCard('****4820');
    expect(result).toContain('4820');
    expect(result).toContain('••••');
  });

  it('handles compact 16-digit number', () => {
    expect(maskCard('4532015123456789')).toBe('4532 •••• •••• 6789');
  });
});

describe('maskPesel', () => {
  it('shows first 2 + last 2 digits', () => {
    expect(maskPesel('44051401458')).toBe('44•••••••58');
  });
});

describe('maskNip', () => {
  it('shows first 3 + last 2 with dashes', () => {
    expect(maskNip('123-456-32-18')).toBe('123-•••-••-18');
  });

  it('handles compact NIP', () => {
    expect(maskNip('1234563218')).toBe('123-•••-••-18');
  });
});

describe('maskNationalId', () => {
  it('shows first 3 chars + bullets', () => {
    expect(maskNationalId('ABS 847291')).toBe('ABS ••••••');
  });
});

describe('maskBirthDate', () => {
  it('returns fixed mask regardless of input', () => {
    expect(maskBirthDate('ur. 14.05.1944')).toBe('ur. ••.••.••••');
  });
});

describe('maskName', () => {
  it('masks first + last name', () => {
    expect(maskName('Jan Kowalski')).toBe('J•• K••••••');
  });

  it('masks single word', () => {
    expect(maskName('Jan')).toBe('J••');
  });

  it('masks compound surname (hyphenated)', () => {
    expect(maskName('Anna Nowak-Wiśniewska')).toBe('A••• N•••• W••••••');
  });

  it('caps bullet length at 6 per word', () => {
    expect(maskName('Aleksandrowicz')).toBe('A••••••');
  });
});

describe('maskPhone', () => {
  it('shows last 3 digits', () => {
    expect(maskPhone('+48 601 234 567')).toBe('••• ••• 567');
  });

  it('handles compact number', () => {
    expect(maskPhone('601234567')).toBe('••• ••• 567');
  });
});

describe('maskEmail', () => {
  it('shows first char + domain', () => {
    expect(maskEmail('jan.kowalski@gmail.com')).toBe('j•••@gmail.com');
  });

  it('handles edge case without @', () => {
    expect(maskEmail('notat')).toBe('•••@•••');
  });
});

describe('maskAddress', () => {
  it('preserves street prefix', () => {
    expect(maskAddress('ul. Marszałkowska 15')).toBe('ul. •••');
  });

  it('preserves postal code prefix', () => {
    expect(maskAddress('00-123 Bielsko-Biała')).toBe('00-123 •••');
  });

  it('falls back to dots for unknown format', () => {
    expect(maskAddress('Nowa Wieś 5')).toBe('••• •••');
  });
});
