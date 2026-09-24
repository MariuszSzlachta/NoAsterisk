import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';

import { synchronizeVault } from '#features/user-settings/api/synchronize-vault';
import { buildVaultRecords } from '#features/user-settings/api/synchronize-vault/build-vault-records';
import type { RemoteVaultSnapshot } from '#features/user-settings/api/synchronize-vault/types';
import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';
import { estimateSizeKb } from '#features/user-settings/model/estimate-size-kb';
import { formatSyncDate } from '#features/user-settings/model/format-sync-date';
import { parseVaultPayload } from '#features/user-settings/model/parse-vault-payload';
import type { DataStats } from '#features/user-settings/model/types/data-stats';
import type { VaultInfo } from '#features/user-settings/model/types/vault-info';
import { MAX_PLAINTEXT_VAULT_LENGTH } from '#features/user-settings/model/vault-limits';
import {
  serializeVaultPayload,
  type VaultRecords,
} from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import { captureVaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope';
import { restoreRemoteVault } from '#features/user-settings/ui/hooks/restore-remote-vault';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import { useRotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation';
import type { UseVaultSectionResult } from '#features/user-settings/ui/hooks/useVaultSection/use-vault-section-result';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { vaultOperationQueue } from '#entities/vault/lib/vault-operation-queue';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { currentHighSecurity } from '#shared/adapters/vault-protocol/current-high-security';
import { rotateWithRecoveryAuthority } from '#shared/adapters/vault-protocol/dual-root-vault-rotation';
import { passkeyUnlock } from '#shared/adapters/vault-protocol/passkey-unlock';
import { vaultRotation } from '#shared/adapters/vault-protocol/vault-rotation';
import { ApiError } from '#shared/api';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { webauthnCredentials } from '#shared/api/vault-protocol/webauthn-credentials';
import { useToast } from '#shared/hooks/useToast';

export const useVaultSection = (): UseVaultSectionResult => {
  const { t } = useTranslation();
  const addToast = useToast((s) => s.addToast);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChangingSecurity, setIsChangingSecurity] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const rotationRecoveryConfirmation = useRotationRecoveryConfirmation();
  const [isHighSecurity, setIsHighSecurity] = useState(false);
  const [isPasskeyUnlock, setIsPasskeyUnlock] = useState(false);
  const [remoteSnapshot, setRemoteSnapshot] = useState<RemoteVaultSnapshot>();
  const [remoteError, setRemoteError] = useState<unknown>();
  const [importError, setImportError] = useState<string | undefined>();
  const [hasConflict, setHasConflict] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const transactions = useTransactionsStore((s) => s.transactions);
  const rules = useRulesStore((s) => s.rules);
  const categories = useCategoriesStore((s) => s.categories);
  const budgets = useBudgetsStore((s) => s.budgets);
  const periodHistory = usePeriodHistoryStore((s) => s.history);
  const importHistory = useImportHistoryStore((s) => s.history);
  const records = useMemo<VaultRecords>(
    () => ({
      transactions,
      rules,
      categories,
      budgets,
      periodHistory,
      importHistory,
    }),
    [transactions, rules, categories, budgets, periodHistory, importHistory],
  );
  const syncMetadata = useSyncExternalStore(
    persistenceSyncMetadata.subscribe,
    persistenceSyncMetadata.get,
    persistenceSyncMetadata.get,
  );

  const loadRemoteSnapshot = async (): Promise<
    RemoteVaultSnapshot | undefined
  > => {
    try {
      const material = encryptedPersistence.requireVaultSyncMaterial();
      const response = await syncSnapshotApi.get(material.context.vaultId);
      if (response.status === 'available' && response.snapshot !== undefined) {
        setRemoteSnapshot(response.snapshot);
        setRemoteError(undefined);
        return response.snapshot;
      } else {
        setRemoteSnapshot(undefined);
      }
      setRemoteError(undefined);
      return undefined;
    } catch (error) {
      setRemoteError(error);
      return undefined;
    }
  };

  useEffect(() => {
    void loadRemoteSnapshot();
  }, []);

  useEffect(() => {
    void vaultBootstrap
      .get()
      .then((bootstrap) => {
        setIsHighSecurity(
          bootstrap.status === 'available' &&
            (bootstrap.securityProfile === 'high-security' ||
              (bootstrap.securityProfile === undefined &&
                bootstrap.passkeyEnvelope !== undefined &&
                bootstrap.deviceEnvelope === undefined)),
        );
        setIsPasskeyUnlock(
          bootstrap.status === 'available' &&
            bootstrap.passkeyEnvelope !== undefined,
        );
      })
      .catch(() => setIsHighSecurity(false));
  }, []);

  const status = hasConflict
    ? 'conflict'
    : remoteError !== undefined
      ? 'error'
      : isSyncing
        ? 'syncing'
        : remoteSnapshot === undefined
          ? syncMetadata.isDirty
            ? 'local-changes'
            : 'never-synced'
          : syncMetadata.isDirty &&
              (syncMetadata.observedRevision ?? 0) > remoteSnapshot.revision
            ? 'local-changes'
            : syncMetadata.observedRevision !== undefined &&
                remoteSnapshot.revision > syncMetadata.observedRevision
              ? 'remote-newer'
              : 'up-to-date';
  const lastSync = syncMetadata.lastSuccessfulSyncAt
    ? formatSyncDate(syncMetadata.lastSuccessfulSyncAt)
    : undefined;
  const vaultInfo: VaultInfo = {
    status,
    lastSync,
    remoteRevision: remoteSnapshot?.revision,
  };
  const dataStats: DataStats = useMemo(() => {
    const payload = createValidatedVaultPayload(records);
    return {
      transactions: payload.transactions.length,
      categories: payload.categories.length,
      budgets: payload.budgets.length,
      rules: payload.rules.length,
      periodHistory: payload.periodHistory.length,
      importHistory: payload.importHistory.length,
      sizeKb: estimateSizeKb(serializeVaultPayload(payload)),
    };
  }, [records]);

  const performSync = async (force = false): Promise<void> => {
    setIsSyncing(true);
    try {
      const result = await synchronizeVault({ force });
      if (result.status === 'conflict') {
        setHasConflict(true);
        if (result.snapshot !== undefined) setRemoteSnapshot(result.snapshot);
        return;
      }
      setHasConflict(false);
      if (result.snapshot !== undefined) setRemoteSnapshot(result.snapshot);
      else await loadRemoteSnapshot();
      addToast(t('settings.vault.syncSuccess'), 'success');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409)
        setHasConflict(true);
      else addToast(t('settings.vault.syncError'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = (): void => {
    if (
      remoteSnapshot !== undefined &&
      (hasConflict || status === 'remote-newer') &&
      !window.confirm(t('settings.vault.overwriteConfirmation'))
    )
      return;
    void performSync(
      remoteSnapshot !== undefined &&
        (hasConflict || status === 'remote-newer'),
    );
  };

  const handleRestore = (): void => {
    if (isSyncing || isRotating || isChangingSecurity) return;
    setIsSyncing(true);
    void restoreRemoteVault()
      .then(() => {
        setHasConflict(false);
        addToast(t('settings.vault.restoreSuccess'), 'success');
        void loadRemoteSnapshot();
      })
      .catch(() => {
        addToast(t('settings.vault.restoreError'), 'error');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const handleExport = (): void => {
    const payload = createValidatedVaultPayload(buildVaultRecords());
    const blob = new Blob([serializeVaultPayload(payload)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleEnableHighSecurity = (): void => {
    const code = window.prompt(t('settings.vault.highSecurityRecoveryPrompt'));
    if (code === null || code.length === 0 || isChangingSecurity) return;
    setIsChangingSecurity(true);
    void currentHighSecurity[isHighSecurity ? 'disable' : 'enable'](code)
      .then(() => {
        const nextHighSecurity = !isHighSecurity;
        setIsHighSecurity(nextHighSecurity);
        if (nextHighSecurity) setIsPasskeyUnlock(true);
        addToast(
          t(
            isHighSecurity
              ? 'settings.vault.highSecurityDisabled'
              : 'settings.vault.highSecurityEnabled',
          ),
          'success',
        );
      })
      .catch(() => addToast(t('settings.vault.highSecurityError'), 'error'))
      .finally(() => setIsChangingSecurity(false));
  };

  const handleEnablePasskeyUnlock = (): void => {
    const code = window.prompt(t('settings.vault.passkeyRecoveryPrompt'));
    if (
      code === null ||
      code.length === 0 ||
      isChangingSecurity ||
      isPasskeyUnlock ||
      isHighSecurity
    )
      return;
    setIsChangingSecurity(true);
    void (async () => {
      const bootstrap = await vaultBootstrap.get();
      if (bootstrap.status !== 'available' || bootstrap.vaultId === undefined)
        throw new Error('Vault is unavailable');
      await webauthnCredentials.register({
        vaultId: bootstrap.vaultId,
        deviceId: bootstrap.deviceId,
      });
      await passkeyUnlock.enable(code);
      setIsPasskeyUnlock(true);
      addToast(t('settings.vault.passkeyEnabled'), 'success');
    })()
      .catch(() => addToast(t('settings.vault.passkeyError'), 'error'))
      .finally(() => setIsChangingSecurity(false));
  };

  const handleRotateVmk = (): void => {
    const code = window.prompt(t('settings.vault.rotationRecoveryPrompt'));
    if (code === null || code.length === 0 || isRotating || isSyncing) return;
    setIsRotating(true);
    void (async () => {
      const bootstrap = await vaultBootstrap.get();
      if (
        bootstrap.status === 'available' &&
        bootstrap.recoveryPublicKey !== undefined
      ) {
        await rotateWithRecoveryAuthority({
          recoveryBackup: code,
          confirmRecoveryBackup:
            rotationRecoveryConfirmation.confirmRecoveryCode,
        });
        return;
      }
      if (
        await vaultRotation.resumePending(
          rotationRecoveryConfirmation.confirmRecoveryCode,
        )
      )
        return;
      if (isHighSecurity)
        await vaultRotation.rotateWithPasskey(
          code,
          rotationRecoveryConfirmation.confirmRecoveryCode,
        );
      else
        await vaultRotation.rotate({
          recoveryCode: code,
          confirmRecoveryCode: rotationRecoveryConfirmation.confirmRecoveryCode,
        });
    })()
      .then(() => {
        addToast(t('settings.vault.rotationSuccess'), 'success');
      })
      .catch(() => addToast(t('settings.vault.rotationError'), 'error'))
      .finally(() => setIsRotating(false));
  };

  const importVaultFile = async (file: File): Promise<void> => {
    try {
      const scope = captureVaultRestoreScope();
      const text = await file.text();
      scope.assertCurrent();
      if (new TextEncoder().encode(text).length > MAX_PLAINTEXT_VAULT_LENGTH) {
        setImportError(t('settings.vault.tooLarge'));
        return;
      }
      const payload = parseVaultPayload(text);
      await vaultOperationQueue(() => restoreVaultPayload(payload, scope));
      addToast(t('settings.vault.importSuccess'), 'success');
    } catch (error) {
      setImportError(
        error instanceof VaultPayloadError
          ? t('settings.vault.importInvalidFormat')
          : t('settings.vault.importInvalidJson'),
      );
    }
  };

  return {
    rotationRecoveryConfirmation,
    vaultInfo,
    dataStats,
    isSyncing,
    isChangingSecurity,
    isRotating,
    isHighSecurity,
    isPasskeyUnlock,
    importError,
    fileInputRef,
    handleSync,
    handleRestore,
    handleExport,
    handleTriggerImport: () => fileInputRef.current?.click(),
    handleFileInputChange: (event) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      setImportError(undefined);
      void importVaultFile(file);
      event.currentTarget.value = '';
    },
    handleEnableHighSecurity,
    handleEnablePasskeyUnlock,
    handleRotateVmk,
  };
};
