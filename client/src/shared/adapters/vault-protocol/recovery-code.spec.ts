import { describe, expect, it } from 'vitest';

import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';

describe('vault recovery code', () => {
  it('roundtrips a random 256-bit VMK locally', async () => {
    const created = await recoveryCode.create();
    expect(created.code).toMatch(/^[0-9a-f]{72}$/);
    await expect(recoveryCode.restore(created.code)).resolves.toEqual(
      created.vmk,
    );
  });

  it('rejects truncation and checksum tampering', async () => {
    const created = await recoveryCode.create();
    await expect(
      recoveryCode.restore(created.code.slice(0, -2)),
    ).rejects.toThrow();
    const changed = `${created.code.slice(0, -1)}${created.code.endsWith('0') ? '1' : '0'}`;
    await expect(recoveryCode.restore(changed)).rejects.toThrow();
  });
});
