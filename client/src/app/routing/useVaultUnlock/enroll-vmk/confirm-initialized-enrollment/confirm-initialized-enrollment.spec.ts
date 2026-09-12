import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hydrateFinancialStores } from '#app/providers/hydrate-financial-stores';
import { confirmInitializedEnrollment } from '#app/routing/useVaultUnlock/enroll-vmk/confirm-initialized-enrollment';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

const boundary = vi.hoisted(() => ({
  hydrate: vi.fn<typeof hydrateFinancialStores>(),
  confirm: vi.fn<typeof vaultEnrollment.confirm>(),
}));
vi.mock('#app/providers/hydrate-financial-stores', () => ({
  hydrateFinancialStores: boundary.hydrate,
}));
vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: { confirm: boundary.confirm },
}));
vi.mock('#app/routing/useVaultUnlock/complete-enrollment-restore', () => ({
  completeEnrollmentRestore: vi.fn(async () => undefined),
}));

describe('confirmInitializedEnrollment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it('should restore only after server confirmation and reject failed restoration before publishing an unlock', async () => {
    const signing = await deviceSigningKey.generate();
    let confirmed = false;
    boundary.confirm.mockImplementation(async () => {
      confirmed = true;
    });
    const restore = vi.fn(async () => {
      expect(confirmed).toBe(true);
      throw new Error('Restore failed');
    });
    await expect(
      confirmInitializedEnrollment(
        buildEnrollmentTranscript(),
        'a'.repeat(64),
        signing.privateKey,
        () => {},
        () => true,
        restore,
      ),
    ).rejects.toThrow('Restore failed');
    expect(boundary.hydrate).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalledOnce();
  });
  it('never hydrates or confirms an invalidated native initialization', async () => {
    const signing = await deviceSigningKey.generate();
    await expect(
      confirmInitializedEnrollment(
        buildEnrollmentTranscript(),
        'a'.repeat(64),
        signing.privateKey,
        () => {},
        () => false,
      ),
    ).rejects.toThrow('invalidated');
    expect(boundary.hydrate).not.toHaveBeenCalled();
    expect(boundary.confirm).not.toHaveBeenCalled();
  });
  it('never confirms if hydration fails or invalidates the flow during its await', async () => {
    const signing = await deviceSigningKey.generate();
    for (const rejected of [false, true]) {
      let current = true;
      boundary.hydrate.mockImplementation(async () => {
        current = false;
        if (rejected) throw new Error('Hydration failed');
      });
      await expect(
        confirmInitializedEnrollment(
          buildEnrollmentTranscript(),
          'a'.repeat(64),
          signing.privateKey,
          () => {
            if (!current) throw new Error('Cancelled');
          },
          () => true,
        ),
      ).rejects.toThrow();
      expect(boundary.confirm).not.toHaveBeenCalled();
    }
  });
});
