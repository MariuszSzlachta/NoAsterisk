import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import { ApiError } from '#shared/api';

import { useVaultSection } from './useVaultSection';

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  bootstrapGet: vi.fn(),
  buildVaultRecords: vi.fn(),
  captureScope: vi.fn(),
  confirmRecoveryCode: vi.fn(),
  createPayload: vi.fn(),
  currentHighSecurityDisable: vi.fn(),
  currentHighSecurityEnable: vi.fn(),
  estimateSizeKb: vi.fn(),
  passkeyEnable: vi.fn(),
  parseVaultPayload: vi.fn(),
  registerCredential: vi.fn(),
  requireVaultSyncMaterial: vi.fn(),
  restoreRemoteVault: vi.fn(),
  restoreVaultPayload: vi.fn(),
  rotate: vi.fn(),
  rotateWithPasskey: vi.fn(),
  rotateWithRecoveryAuthority: vi.fn(),
  rotationResume: vi.fn(),
  serializeVaultPayload: vi.fn(),
  snapshotGet: vi.fn(),
  synchronizeVault: vi.fn(),
  syncSubscribers: new Set<() => void>(),
  vaultOperationQueue: vi.fn(),
}));

const stores = vi.hoisted(() => ({
  budgets: [{ id: 'budget-1' }],
  categories: [{ id: 'category-1' }],
  importHistory: [{ id: 'import-1' }],
  periodHistory: [{ id: 'period-1' }],
  rules: [{ id: 'rule-1' }],
  transactions: [{ id: 'transaction-1' }],
}));

const rotationConfirmation = {
  recoveryCode: undefined,
  confirmation: '',
  canConfirm: false,
  confirmationError: undefined,
  confirmRecoveryCode: mocks.confirmRecoveryCode,
  handleConfirmationChange: vi.fn(),
  handleConfirm: vi.fn(),
  handleCancel: vi.fn(),
  handleDownload: vi.fn(),
};

interface TestSyncMetadata {
  readonly isDirty: boolean;
  readonly observedRevision: number | undefined;
  readonly lastSuccessfulSyncAt: string | undefined;
}

let syncMetadata: TestSyncMetadata = {
  isDirty: false,
  observedRevision: undefined,
  lastSuccessfulSyncAt: undefined,
};

const createFileInputChange = (
  files: ReadonlyArray<File>,
): {
  readonly event: React.ChangeEvent<HTMLInputElement>;
  readonly input: HTMLInputElement;
} => {
  const input = document.createElement('input');
  input.value = files.length === 0 ? '' : 'selected';
  Object.defineProperty(input, 'files', { value: files });
  return {
    input,
    event: {
      bubbles: false,
      cancelable: false,
      currentTarget: input,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      nativeEvent: new Event('change'),
      preventDefault: vi.fn(),
      isDefaultPrevented: () => false,
      stopPropagation: vi.fn(),
      isPropagationStopped: () => false,
      persist: vi.fn(),
      target: input,
      timeStamp: 0,
      type: 'change',
    },
  };
};

const remoteSnapshot = (revision = 1) => ({
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  revision,
  previousEnvelopeHash: 'previous',
  envelopeHash: 'current',
  header: '{}',
  ciphertext: 'opaque',
  signature: 'signature',
  signingPublicKey: '{}',
  createdAt: '2026-01-01T00:00:00.000Z',
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#features/user-settings/api/synchronize-vault', () => ({
  synchronizeVault: mocks.synchronizeVault,
}));

vi.mock(
  '#features/user-settings/model/build-vault-records',
  () => ({ buildVaultRecords: mocks.buildVaultRecords }),
);

vi.mock('#features/user-settings/model/create-validated-vault-payload', () => ({
  createValidatedVaultPayload: mocks.createPayload,
}));

vi.mock('#features/user-settings/model/estimate-size-kb', () => ({
  estimateSizeKb: mocks.estimateSizeKb,
}));

vi.mock('#features/user-settings/model/format-sync-date', () => ({
  formatSyncDate: (value: string) => `formatted:${value}`,
}));

vi.mock('#features/user-settings/model/parse-vault-payload', () => ({
  parseVaultPayload: mocks.parseVaultPayload,
}));

vi.mock('#features/user-settings/model/vault-payload', () => ({
  serializeVaultPayload: mocks.serializeVaultPayload,
}));

vi.mock('#features/user-settings/ui/hooks/capture-vault-restore-scope', () => ({
  captureVaultRestoreScope: mocks.captureScope,
}));

vi.mock('#features/user-settings/ui/hooks/restore-remote-vault', () => ({
  restoreRemoteVault: mocks.restoreRemoteVault,
}));

vi.mock('#features/user-settings/ui/hooks/restore-vault-payload', () => ({
  restoreVaultPayload: mocks.restoreVaultPayload,
}));

vi.mock(
  '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation',
  () => ({ useRotationRecoveryConfirmation: () => rotationConfirmation }),
);

vi.mock('#features/budgets/store', () => ({
  useBudgetsStore: (selector: (state: { budgets: unknown[] }) => unknown) =>
    selector({ budgets: stores.budgets }),
  usePeriodHistoryStore: (
    selector: (state: { history: unknown[] }) => unknown,
  ) => selector({ history: stores.periodHistory }),
}));

vi.mock('#model/category', () => ({
  useCategoriesStore: (
    selector: (state: { categories: unknown[] }) => unknown,
  ) => selector({ categories: stores.categories }),
}));

vi.mock('#features/csv-import/store/useImportHistoryStore', () => ({
  useImportHistoryStore: (
    selector: (state: { history: unknown[] }) => unknown,
  ) => selector({ history: stores.importHistory }),
}));

vi.mock('#model/rule', () => ({
  useRulesStore: (selector: (state: { rules: unknown[] }) => unknown) =>
    selector({ rules: stores.rules }),
}));

vi.mock('#model/transaction', () => ({
  useTransactionsStore: (
    selector: (state: { transactions: unknown[] }) => unknown,
  ) => selector({ transactions: stores.transactions }),
}));

vi.mock('#model/vault/lib/vault-operation-queue', () => ({
  vaultOperationQueue: mocks.vaultOperationQueue,
}));

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: mocks.requireVaultSyncMaterial,
  },
  persistenceSyncMetadata: {
    subscribe: (listener: () => void) => {
      mocks.syncSubscribers.add(listener);
      return () => mocks.syncSubscribers.delete(listener);
    },
    get: () => syncMetadata,
  },
}));

vi.mock('#shared/adapters/vault-protocol/current-high-security', () => ({
  currentHighSecurity: {
    disable: mocks.currentHighSecurityDisable,
    enable: mocks.currentHighSecurityEnable,
  },
}));

vi.mock('#shared/adapters/vault-protocol/dual-root-vault-rotation', () => ({
  rotateWithRecoveryAuthority: mocks.rotateWithRecoveryAuthority,
}));

vi.mock('#shared/adapters/vault-protocol/passkey-unlock', () => ({
  passkeyUnlock: { enable: mocks.passkeyEnable },
}));

vi.mock('#shared/adapters/vault-protocol/vault-rotation', () => ({
  vaultRotation: {
    resumePending: mocks.rotationResume,
    rotate: mocks.rotate,
    rotateWithPasskey: mocks.rotateWithPasskey,
  },
}));

vi.mock('#shared/api/vault-protocol/sync-snapshot-api', () => ({
  syncSnapshotApi: { get: mocks.snapshotGet },
}));

vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: mocks.bootstrapGet },
}));

vi.mock('#shared/api/vault-protocol/webauthn-credentials', () => ({
  webauthnCredentials: { register: mocks.registerCredential },
}));

vi.mock('#shared/hooks/useToast', () => ({
  useToast: (
    selector: (state: { addToast: typeof mocks.addToast }) => unknown,
  ) => selector({ addToast: mocks.addToast }),
}));

const renderSubject = () => renderHook(() => useVaultSection());

const notifySyncMetadata = (): void => {
  for (const listener of mocks.syncSubscribers) listener();
};

describe('useVaultSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.syncSubscribers.clear();
    syncMetadata = {
      isDirty: false,
      observedRevision: undefined,
      lastSuccessfulSyncAt: undefined,
    };
    mocks.requireVaultSyncMaterial.mockReturnValue({
      context: { vaultId: 'vault-1' },
    });
    mocks.snapshotGet.mockResolvedValue({
      status: 'available',
      snapshot: remoteSnapshot(),
    });
    mocks.bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      deviceEnvelope: '{}',
    });
    mocks.createPayload.mockImplementation((records: unknown) => records);
    mocks.serializeVaultPayload.mockReturnValue('{}');
    mocks.estimateSizeKb.mockReturnValue(1);
    mocks.synchronizeVault.mockResolvedValue({
      status: 'saved',
      snapshot: remoteSnapshot(2),
    });
    mocks.restoreRemoteVault.mockResolvedValue(undefined);
    mocks.buildVaultRecords.mockReturnValue(stores);
    mocks.parseVaultPayload.mockReturnValue({ transactions: [] });
    mocks.captureScope.mockReturnValue({ assertCurrent: vi.fn() });
    mocks.restoreVaultPayload.mockResolvedValue(undefined);
    mocks.vaultOperationQueue.mockImplementation(
      async (operation: () => Promise<unknown>) => operation(),
    );
    mocks.currentHighSecurityEnable.mockResolvedValue(undefined);
    mocks.currentHighSecurityDisable.mockResolvedValue(undefined);
    mocks.registerCredential.mockResolvedValue(undefined);
    mocks.passkeyEnable.mockResolvedValue(undefined);
    mocks.rotationResume.mockResolvedValue(false);
    mocks.rotate.mockResolvedValue(undefined);
    mocks.rotateWithPasskey.mockResolvedValue(undefined);
    mocks.rotateWithRecoveryAuthority.mockResolvedValue(undefined);
    mocks.confirmRecoveryCode.mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'prompt').mockReturnValue('recovery-code');
  });

  it('loads remote state and derives status, last sync and data statistics', async () => {
    syncMetadata = {
      isDirty: false,
      observedRevision: 1,
      lastSuccessfulSyncAt: '2026-09-24T12:00:00.000Z',
    };

    const { result } = renderSubject();

    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('up-to-date'),
    );
    expect(result.current.vaultInfo).toEqual({
      status: 'up-to-date',
      lastSync: 'formatted:2026-09-24T12:00:00.000Z',
      remoteRevision: 1,
    });
    expect(result.current.dataStats).toEqual({
      transactions: 1,
      categories: 1,
      budgets: 1,
      rules: 1,
      periodHistory: 1,
      importHistory: 1,
      sizeKb: 1,
    });
  });

  it('falls back safely when vault security-profile inspection fails', async () => {
    mocks.bootstrapGet.mockRejectedValueOnce(new Error('offline'));

    const { result } = renderSubject();

    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalledOnce());
    expect(result.current.isHighSecurity).toBe(false);
    expect(result.current.isPasskeyUnlock).toBe(false);
  });

  it('distinguishes never-synced, local changes, remote-newer and remote errors', async () => {
    mocks.snapshotGet.mockResolvedValueOnce({ status: 'empty' });
    const first = renderSubject();
    await waitFor(() =>
      expect(first.result.current.vaultInfo.status).toBe('never-synced'),
    );

    syncMetadata = { ...syncMetadata, isDirty: true };
    act(notifySyncMetadata);
    expect(first.result.current.vaultInfo.status).toBe('local-changes');
    first.unmount();

    syncMetadata = { ...syncMetadata, isDirty: false, observedRevision: 1 };
    mocks.snapshotGet.mockResolvedValueOnce({
      status: 'available',
      snapshot: remoteSnapshot(3),
    });
    const second = renderSubject();
    await waitFor(() =>
      expect(second.result.current.vaultInfo.status).toBe('remote-newer'),
    );
    second.unmount();

    mocks.snapshotGet.mockRejectedValueOnce(new Error('offline'));
    const third = renderSubject();
    await waitFor(() =>
      expect(third.result.current.vaultInfo.status).toBe('error'),
    );
  });

  it('synchronizes normally and forces an explicitly confirmed overwrite', async () => {
    const { result } = renderSubject();
    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('up-to-date'),
    );

    act(() => result.current.handleSync());
    await waitFor(() =>
      expect(mocks.synchronizeVault).toHaveBeenCalledWith({ force: false }),
    );
    expect(mocks.addToast).toHaveBeenCalledWith(
      'settings.vault.syncSuccess',
      'success',
    );

    mocks.synchronizeVault.mockResolvedValueOnce({
      status: 'conflict',
      snapshot: remoteSnapshot(4),
    });
    act(() => result.current.handleSync());
    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('conflict'),
    );

    vi.mocked(window.confirm).mockReturnValueOnce(false);
    act(() => result.current.handleSync());
    expect(mocks.synchronizeVault).toHaveBeenCalledTimes(2);

    act(() => result.current.handleSync());
    await waitFor(() =>
      expect(mocks.synchronizeVault).toHaveBeenLastCalledWith({ force: true }),
    );
  });

  it('maps conflict and ordinary synchronization failures separately', async () => {
    const { result } = renderSubject();
    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('up-to-date'),
    );

    mocks.synchronizeVault.mockRejectedValueOnce(new ApiError('conflict', 409));
    act(() => result.current.handleSync());
    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('conflict'),
    );

    mocks.synchronizeVault.mockRejectedValueOnce(new Error('offline'));
    act(() => result.current.handleSync());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.syncError',
        'error',
      ),
    );
  });

  it('refreshes remote state when a successful sync has no snapshot', async () => {
    mocks.synchronizeVault.mockResolvedValueOnce({ status: 'saved' });
    const { result } = renderSubject();
    await waitFor(() => expect(mocks.snapshotGet).toHaveBeenCalledOnce());

    act(() => result.current.handleSync());

    await waitFor(() => expect(mocks.snapshotGet).toHaveBeenCalledTimes(2));
    expect(mocks.addToast).toHaveBeenCalledWith(
      'settings.vault.syncSuccess',
      'success',
    );
  });

  it('restores the remote vault and reports restore failures', async () => {
    const { result } = renderSubject();
    await waitFor(() =>
      expect(result.current.vaultInfo.status).toBe('up-to-date'),
    );

    act(() => result.current.handleRestore());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.restoreSuccess',
        'success',
      ),
    );
    expect(mocks.snapshotGet).toHaveBeenCalledTimes(2);

    mocks.restoreRemoteVault.mockRejectedValueOnce(new Error('invalid'));
    act(() => result.current.handleRestore());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.restoreError',
        'error',
      ),
    );
  });

  it('exports a validated JSON payload and triggers the hidden file input', async () => {
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:vault');
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const { result } = renderSubject();
    await waitFor(() => expect(mocks.snapshotGet).toHaveBeenCalled());

    act(() => result.current.handleExport());
    expect(mocks.buildVaultRecords).toHaveBeenCalledOnce();
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:vault');

    const inputClick = vi.fn();
    const input = document.createElement('input');
    input.click = inputClick;
    result.current.fileInputRef.current = input;
    act(() => result.current.handleTriggerImport());
    expect(inputClick).toHaveBeenCalledOnce();
  });

  it('imports a valid file and clears the input value', async () => {
    const scope = { assertCurrent: vi.fn() };
    mocks.captureScope.mockReturnValue(scope);
    const { result } = renderSubject();
    const { event, input } = createFileInputChange([
      new File(['{}'], 'vault.json'),
    ]);

    act(() => result.current.handleFileInputChange(event));

    await waitFor(() => expect(mocks.restoreVaultPayload).toHaveBeenCalled());
    expect(scope.assertCurrent).toHaveBeenCalledOnce();
    expect(mocks.vaultOperationQueue).toHaveBeenCalledOnce();
    expect(mocks.addToast).toHaveBeenCalledWith(
      'settings.vault.importSuccess',
      'success',
    );
    expect(input.value).toBe('');
  });

  it('rejects oversized, structurally invalid and unreadable imports', async () => {
    const { result } = renderSubject();
    const choose = (file: File): void => {
      const { event } = createFileInputChange([file]);
      act(() => result.current.handleFileInputChange(event));
    };

    choose(new File(['x'.repeat(10_000_001)], 'large.json'));
    await waitFor(() =>
      expect(result.current.importError).toBe('settings.vault.tooLarge'),
    );

    mocks.parseVaultPayload.mockImplementationOnce(() => {
      throw new VaultPayloadError('shape');
    });
    choose(new File(['{}'], 'shape.json'));
    await waitFor(() =>
      expect(result.current.importError).toBe(
        'settings.vault.importInvalidFormat',
      ),
    );

    mocks.parseVaultPayload.mockImplementationOnce(() => {
      throw new SyntaxError('json');
    });
    choose(new File(['{'], 'syntax.json'));
    await waitFor(() =>
      expect(result.current.importError).toBe(
        'settings.vault.importInvalidJson',
      ),
    );

    const emptySelection = createFileInputChange([]);
    act(() => result.current.handleFileInputChange(emptySelection.event));
  });

  it('enables and disables high-security mode with explicit recovery authority', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      securityProfile: 'high-security',
      passkeyEnvelope: '{}',
    });
    const { result } = renderSubject();
    await waitFor(() => expect(result.current.isHighSecurity).toBe(true));

    act(() => result.current.handleEnableHighSecurity());
    await waitFor(() =>
      expect(mocks.currentHighSecurityDisable).toHaveBeenCalledWith(
        'recovery-code',
      ),
    );
    await waitFor(() => expect(result.current.isHighSecurity).toBe(false));
    await waitFor(() => expect(result.current.isChangingSecurity).toBe(false));

    act(() => result.current.handleEnableHighSecurity());
    await waitFor(() =>
      expect(mocks.currentHighSecurityEnable).toHaveBeenCalledWith(
        'recovery-code',
      ),
    );
    await waitFor(() => expect(result.current.isHighSecurity).toBe(true));
    expect(result.current.isPasskeyUnlock).toBe(true);
  });

  it('reports high-security failures and ignores cancelled prompts', async () => {
    mocks.currentHighSecurityEnable.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderSubject();
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalled());

    act(() => result.current.handleEnableHighSecurity());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.highSecurityError',
        'error',
      ),
    );

    vi.mocked(window.prompt).mockReturnValueOnce(null).mockReturnValueOnce('');
    act(() => result.current.handleEnableHighSecurity());
    act(() => result.current.handleEnableHighSecurity());
    expect(mocks.currentHighSecurityEnable).toHaveBeenCalledTimes(1);
  });

  it('registers passkey unlock and rejects unavailable vault bootstrap', async () => {
    const { result } = renderSubject();
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalled());

    act(() => result.current.handleEnablePasskeyUnlock());
    await waitFor(() =>
      expect(mocks.passkeyEnable).toHaveBeenCalledWith('recovery-code'),
    );
    expect(mocks.registerCredential).toHaveBeenCalledWith({
      vaultId: 'vault-1',
      deviceId: 'device-1',
    });
    expect(result.current.isPasskeyUnlock).toBe(true);

    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const second = renderSubject();
    await waitFor(() => expect(mocks.snapshotGet).toHaveBeenCalled());
    act(() => second.result.current.handleEnablePasskeyUnlock());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.passkeyError',
        'error',
      ),
    );
  });

  it('does not start passkey enrollment when recovery authority is cancelled', async () => {
    vi.mocked(window.prompt).mockReturnValueOnce(null);
    const { result } = renderSubject();
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalledOnce());

    act(() => result.current.handleEnablePasskeyUnlock());

    expect(mocks.registerCredential).not.toHaveBeenCalled();
    expect(mocks.passkeyEnable).not.toHaveBeenCalled();
    expect(result.current.isChangingSecurity).toBe(false);
  });

  it('rotates through recovery authority, resumed, passkey and standard paths', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      recoveryPublicKey: 'public-key',
    });
    const recovery = renderSubject();
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalled());
    act(() => recovery.result.current.handleRotateVmk());
    await waitFor(() =>
      expect(mocks.rotateWithRecoveryAuthority).toHaveBeenCalled(),
    );
    recovery.unmount();

    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    mocks.rotationResume.mockResolvedValueOnce(true);
    const resumed = renderSubject();
    act(() => resumed.result.current.handleRotateVmk());
    await waitFor(() => expect(mocks.rotationResume).toHaveBeenCalled());
    resumed.unmount();

    mocks.bootstrapGet.mockResolvedValue({
      status: 'available',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      securityProfile: 'high-security',
      passkeyEnvelope: '{}',
    });
    const highSecurity = renderSubject();
    await waitFor(() =>
      expect(highSecurity.result.current.isHighSecurity).toBe(true),
    );
    act(() => highSecurity.result.current.handleRotateVmk());
    await waitFor(() => expect(mocks.rotateWithPasskey).toHaveBeenCalled());
    highSecurity.unmount();

    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const standard = renderSubject();
    act(() => standard.result.current.handleRotateVmk());
    await waitFor(() =>
      expect(mocks.rotate).toHaveBeenCalledWith({
        recoveryCode: 'recovery-code',
        confirmRecoveryCode: mocks.confirmRecoveryCode,
      }),
    );
  });

  it('reports rotation failure and ignores a cancelled rotation prompt', async () => {
    mocks.rotate.mockRejectedValueOnce(new Error('failed'));
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const { result } = renderSubject();
    act(() => result.current.handleRotateVmk());
    await waitFor(() =>
      expect(mocks.addToast).toHaveBeenCalledWith(
        'settings.vault.rotationError',
        'error',
      ),
    );

    vi.mocked(window.prompt).mockReturnValueOnce(null);
    act(() => result.current.handleRotateVmk());
    expect(mocks.rotate).toHaveBeenCalledTimes(1);
  });
});
