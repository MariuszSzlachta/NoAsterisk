import { describe, expect, it } from 'vitest';

import { recoveryQr } from '#shared/adapters/vault-protocol/recovery-qr';

describe('vault recovery QR', () => {
  it('renders the canonical recovery code as transient SVG', async () => {
    const svg = await recoveryQr.render('a'.repeat(72));

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).not.toContain('a'.repeat(72));
  });

  it('rejects values that are not canonical recovery codes', async () => {
    await expect(recoveryQr.render('not-a-recovery-code')).rejects.toThrow(
      'Invalid recovery code',
    );
  });
});
