import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { createSignedTrustedRequest } from '#app/routing/useVaultUnlock/create-signed-trusted-request';
import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import { recoverWithCode } from '#app/routing/useVaultUnlock/recover-with-code';
import { unlockFromBootstrap } from '#app/routing/useVaultUnlock/unlock-from-bootstrap';
import { shouldResetVaultUnlockAttempt } from '#app/routing/useVaultUnlock/vault-unlock-state';
import {
  encryptedPersistence,
  type PersistenceSessionSnapshot,
} from '#shared/adapters/persistence';
import { createRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { recoveryQr } from '#shared/adapters/vault-protocol/recovery-qr';
import {
  parseSignedTrustedResponse,
  restoreSignedTrustedApproval,
  type SignedTrustedPending,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import {
  parseSignedTrustedQr,
  renderSignedTrustedQr,
} from '#shared/adapters/vault-protocol/signed-trusted-qr';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import type { VaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { vaultDevices } from '#shared/api/vault-protocol/vault-devices';

interface VaultUnlockState {
  readonly error: string | undefined;
  readonly isUnlocking: boolean;
  readonly canRetry: boolean;
  readonly requiresRecovery: boolean;
  readonly isInitialSetup: boolean;
  readonly recoveryCode: string;
  readonly recoverySetupCode: string | undefined;
  readonly recoverySetupQrSvg: string | undefined;
  readonly trustedDeviceFlow: 'idle' | 'show-request' | 'scan-response';
  readonly trustedDeviceRequestQrSvg: string | undefined;
  readonly trustedDeviceError: string | undefined;
  readonly handleRecoveryCodeChange: (value: string) => void;
  readonly handleRecovery: () => void;
  readonly handleStartInitialSetup: () => void;
  readonly handleConfirmInitialSetup: () => void;
  readonly handleCopyRecoveryCode: () => void;
  readonly handleDownloadRecoveryCode: () => void;
  readonly handleStartTrustedDeviceEnrollment: () => void;
  readonly handleStartTrustedDeviceResponseScan: () => void;
  readonly handleTrustedDeviceResponseScan: (value: string) => void;
  readonly handleTrustedDeviceError: () => void;
  readonly handleCancelTrustedDeviceEnrollment: () => void;
  readonly handleRetry: () => void;
}

export const useVaultUnlock = (
  snapshot: PersistenceSessionSnapshot,
  accountId: string,
  workspaceId: string,
): VaultUnlockState => {
  const { t } = useTranslation();
  const attempted = useRef(false);
  const flowGeneration = useRef(0);
  const attemptedContext = useRef(`${accountId}:${workspaceId}`);
  const [error, setError] = useState<string | undefined>();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [requiresRecovery, setRequiresRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [bootstrap, setBootstrap] = useState<VaultBootstrapMetadata>();
  const [recoverySetupCode, setRecoverySetupCode] = useState<string>();
  const [recoverySetupQrSvg, setRecoverySetupQrSvg] = useState<string>();
  const [trustedDeviceFlow, setTrustedDeviceFlow] = useState<
    'idle' | 'show-request' | 'scan-response'
  >('idle');
  const [trustedDeviceRequestQrSvg, setTrustedDeviceRequestQrSvg] =
    useState<string>();
  const [trustedDeviceError, setTrustedDeviceError] = useState<string>();
  const pendingSetup = useRef<
    | {
        readonly code: string;
        readonly vmk: Uint8Array;
        readonly recoverySeed: Uint8Array;
      }
    | undefined
  >(undefined);
  const trustedDeviceRequest = useRef<
    | {
        readonly request: SignedTrustedPending['request'];
        readonly privateKey: CryptoKey;
        readonly prepared: SignedTrustedPending['prepared'];
        readonly signingKeyPair: CryptoKeyPair;
        readonly signingPublicKey: JsonWebKey;
      }
    | undefined
  >(undefined);

  const unlock = useCallback(async (): Promise<void> => {
    const startedGeneration = flowGeneration.current;
    const assertCurrent = (): void => {
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault unlock flow was cancelled');
    };
    const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
    assertCurrent();
    setBootstrap(currentBootstrap);
    if (currentBootstrap.status !== 'available') {
      setRequiresRecovery(true);
      throw new Error('Recovery is required');
    }
    await unlockFromBootstrap(
      accountId,
      workspaceId,
      currentBootstrap,
      assertCurrent,
    );
    assertCurrent();
  }, [accountId, bootstrap, workspaceId]);

  const handleRetry = useCallback((): void => {
    if (isUnlocking) return;
    const startedGeneration = flowGeneration.current;
    setIsUnlocking(true);
    setError(undefined);
    void unlock()
      .catch(() => {
        if (flowGeneration.current === startedGeneration)
          setError(t('vaultUnlock.errors.failed'));
      })
      .finally(() => setIsUnlocking(false));
  }, [isUnlocking, t, unlock]);

  const handleRecovery = useCallback((): void => {
    if (isUnlocking || recoveryCode.length === 0) return;
    const startedGeneration = flowGeneration.current;
    setIsUnlocking(true);
    setError(undefined);
    void (async () => {
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault recovery flow was cancelled');
      setBootstrap(currentBootstrap);
      await recoverWithCode(
        accountId,
        workspaceId,
        currentBootstrap,
        recoveryCode,
        () => {
          if (flowGeneration.current !== startedGeneration)
            throw new Error('Vault recovery flow was cancelled');
        },
      );
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault recovery flow was cancelled');
      setRecoveryCode('');
      setRequiresRecovery(false);
    })()
      .catch(() => {
        if (flowGeneration.current === startedGeneration)
          setError(t('vaultUnlock.errors.recoveryFailed'));
      })
      .finally(() => setIsUnlocking(false));
  }, [accountId, bootstrap, isUnlocking, recoveryCode, t, workspaceId]);

  const handleStartInitialSetup = useCallback((): void => {
    if (isUnlocking) return;
    const startedGeneration = flowGeneration.current;
    setError(undefined);
    void (async () => {
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault setup flow was cancelled');
      setBootstrap(currentBootstrap);
      if (currentBootstrap.status !== 'empty')
        throw new Error('Vault already exists');
      const created = await createRecoveryBackup();
      if (flowGeneration.current !== startedGeneration) {
        created.vmk.fill(0);
        created.recoverySeed.fill(0);
        throw new Error('Vault setup flow was cancelled');
      }
      pendingSetup.current = created;
      setRecoverySetupCode(created.code);
    })().catch(() => {
      if (flowGeneration.current === startedGeneration)
        setError(t('vaultUnlock.errors.setupFailed'));
    });
  }, [bootstrap, isUnlocking, t]);

  const handleConfirmInitialSetup = useCallback((): void => {
    const pending = pendingSetup.current;
    if (isUnlocking || pending === undefined) return;
    const startedGeneration = flowGeneration.current;
    setIsUnlocking(true);
    setError(undefined);
    void (async () => {
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault setup flow was cancelled');
      await enrollVmk(
        accountId,
        workspaceId,
        currentBootstrap,
        pending.vmk,
        () => {
          if (flowGeneration.current !== startedGeneration)
            throw new Error('Vault setup flow was cancelled');
        },
        { purpose: 'initial', recoverySeed: pending.recoverySeed },
      );
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault setup flow was cancelled');
      pending.vmk.fill(0);
      pending.recoverySeed.fill(0);
      pendingSetup.current = undefined;
      setRecoverySetupCode(undefined);
      setRequiresRecovery(false);
    })()
      .catch(() => {
        if (flowGeneration.current === startedGeneration)
          setError(t('vaultUnlock.errors.setupFailed'));
      })
      .finally(() => setIsUnlocking(false));
  }, [accountId, bootstrap, isUnlocking, t, workspaceId]);

  const handleCopyRecoveryCode = useCallback((): void => {
    if (recoverySetupCode === undefined || navigator.clipboard === undefined)
      return;
    void navigator.clipboard.writeText(recoverySetupCode);
  }, [recoverySetupCode]);

  const handleDownloadRecoveryCode = useCallback((): void => {
    if (recoverySetupCode === undefined) return;
    const url = URL.createObjectURL(
      new Blob([recoverySetupCode], { type: 'text/plain;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'budgetflow-recovery-code.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [recoverySetupCode]);

  const handleStartTrustedDeviceEnrollment = useCallback((): void => {
    if (isUnlocking) return;
    setTrustedDeviceError(undefined);
    const startedGeneration = flowGeneration.current;
    void (async () => {
      const assertCurrent = (): void => {
        if (flowGeneration.current !== startedGeneration)
          throw new Error('Trusted-device flow was cancelled');
      };
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      assertCurrent();
      setBootstrap(currentBootstrap);
      if (
        currentBootstrap.status === 'empty' ||
        currentBootstrap.vaultId === undefined ||
        currentBootstrap.keyId === undefined
      )
        throw new Error('Trusted-device enrollment is unavailable');
      const devices = await vaultDevices.list();
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Trusted-device flow was cancelled');
      const trusted = devices.find(
        (device) =>
          device.deviceId !== currentBootstrap.deviceId &&
          device.vaultId === currentBootstrap.vaultId &&
          device.keyId === currentBootstrap.keyId &&
          device.status === 'active' &&
          device.signingPublicKey !== undefined,
      );
      if (trusted?.signingPublicKey === undefined)
        throw new Error('No trusted device is available');
      const context = {
        accountId,
        workspaceId,
        vaultId: currentBootstrap.vaultId,
        keyId: currentBootstrap.keyId,
        oldDeviceId: trusted.deviceId,
        newDeviceId:
          currentBootstrap.status === 'available'
            ? crypto.randomUUID()
            : currentBootstrap.deviceId,
      };
      const created = await createSignedTrustedRequest(context, assertCurrent);
      const requestQr = await renderSignedTrustedQr(created.request);
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Trusted-device flow was cancelled');
      const signingPublicKey: unknown = JSON.parse(trusted.signingPublicKey);
      if (!trustedDeviceEnrollment.isP256PublicJwk(signingPublicKey))
        throw new Error('Invalid trusted device signing key');
      trustedDeviceRequest.current = {
        request: created.request,
        privateKey: created.privateKey,
        prepared: created.prepared,
        signingKeyPair: created.signingKeyPair,
        signingPublicKey,
      };
      setTrustedDeviceRequestQrSvg(requestQr);
      setTrustedDeviceFlow('show-request');
    })().catch(() => {
      if (flowGeneration.current !== startedGeneration) return;
      setTrustedDeviceError(t('vaultUnlock.trustedDeviceError'));
    });
  }, [accountId, bootstrap, isUnlocking, t, workspaceId]);

  const handleStartTrustedDeviceResponseScan = useCallback((): void => {
    if (trustedDeviceRequest.current === undefined) return;
    setTrustedDeviceError(undefined);
    setTrustedDeviceFlow('scan-response');
  }, []);

  const handleTrustedDeviceResponseScan = useCallback(
    (value: string): void => {
      const pending = trustedDeviceRequest.current;
      if (pending === undefined || isUnlocking) return;
      const startedGeneration = flowGeneration.current;
      setIsUnlocking(true);
      setTrustedDeviceError(undefined);
      void (async () => {
        const assertCurrent = (): void => {
          if (flowGeneration.current !== startedGeneration)
            throw new Error('Trusted-device enrollment flow was cancelled');
        };
        const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
        assertCurrent();
        const response = parseSignedTrustedResponse(
          parseSignedTrustedQr(value),
        );
        const vmk = await restoreSignedTrustedApproval(
          response,
          pending.request,
          pending.privateKey,
          pending.signingPublicKey,
        );
        try {
          assertCurrent();
          await enrollVmk(
            accountId,
            workspaceId,
            currentBootstrap,
            vmk,
            assertCurrent,
            { purpose: 'trusted', pending, response },
          );
          trustedDeviceRequest.current = undefined;
          setTrustedDeviceRequestQrSvg(undefined);
          setTrustedDeviceFlow('idle');
          setRequiresRecovery(false);
        } finally {
          vmk.fill(0);
        }
      })()
        .catch(() => {
          if (flowGeneration.current === startedGeneration) {
            setTrustedDeviceError(t('vaultUnlock.trustedDeviceError'));
          }
        })
        .finally(() => setIsUnlocking(false));
    },
    [accountId, bootstrap, isUnlocking, t, workspaceId],
  );

  const handleCancelTrustedDeviceEnrollment = useCallback((): void => {
    flowGeneration.current += 1;
    trustedDeviceRequest.current = undefined;
    setTrustedDeviceRequestQrSvg(undefined);
    setTrustedDeviceError(undefined);
    setTrustedDeviceFlow('idle');
  }, []);

  const handleTrustedDeviceError = useCallback((): void => {
    setTrustedDeviceError(t('vaultUnlock.trustedDeviceError'));
  }, [t]);

  useEffect(() => {
    const unsubscribe = encryptedPersistence.subscribe(() => {
      const status = encryptedPersistence.getSnapshot().status;
      if (status !== 'locked' && status !== 'error') return;
      flowGeneration.current += 1;
      pendingSetup.current?.vmk.fill(0);
      pendingSetup.current?.recoverySeed.fill(0);
      pendingSetup.current = undefined;
      trustedDeviceRequest.current = undefined;
      setRecoverySetupCode(undefined);
      setRecoverySetupQrSvg(undefined);
      setTrustedDeviceRequestQrSvg(undefined);
      setTrustedDeviceFlow('idle');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    setRecoverySetupQrSvg(undefined);
    setTrustedDeviceRequestQrSvg(undefined);
    setTrustedDeviceError(undefined);
    setTrustedDeviceFlow('idle');
    trustedDeviceRequest.current = undefined;
    if (recoverySetupCode === undefined) return;

    void recoveryQr
      .render(recoverySetupCode)
      .then((svg) => {
        if (active) setRecoverySetupQrSvg(svg);
      })
      .catch(() => {
        if (active) setRecoverySetupQrSvg(undefined);
      });

    return () => {
      active = false;
    };
  }, [recoverySetupCode]);

  useEffect(
    () => () => {
      pendingSetup.current?.vmk.fill(0);
      pendingSetup.current?.recoverySeed.fill(0);
      pendingSetup.current = undefined;
    },
    [],
  );

  useEffect(() => {
    flowGeneration.current += 1;
    pendingSetup.current?.vmk.fill(0);
    pendingSetup.current?.recoverySeed.fill(0);
    pendingSetup.current = undefined;
    trustedDeviceRequest.current = undefined;
    return () => {
      flowGeneration.current += 1;
    };
  }, [accountId, workspaceId]);

  useEffect(() => {
    const nextContext = `${accountId}:${workspaceId}`;
    if (shouldResetVaultUnlockAttempt(attemptedContext.current, nextContext)) {
      attemptedContext.current = nextContext;
      attempted.current = false;
      setBootstrap(undefined);
      setRequiresRecovery(false);
      setRecoveryCode('');
      setRecoverySetupCode(undefined);
      setRecoverySetupQrSvg(undefined);
      setError(undefined);
      return;
    }
    if (snapshot.status !== 'locked' || attempted.current) return;
    attempted.current = true;
    handleRetry();
  }, [accountId, handleRetry, snapshot.status, workspaceId]);

  return {
    error:
      error ??
      (snapshot.error === undefined
        ? undefined
        : t('vaultUnlock.errors.failed')),
    isUnlocking,
    canRetry: !isUnlocking,
    requiresRecovery,
    isInitialSetup: bootstrap?.status === 'empty',
    recoveryCode,
    recoverySetupCode,
    recoverySetupQrSvg,
    trustedDeviceFlow,
    trustedDeviceRequestQrSvg,
    trustedDeviceError,
    handleRecoveryCodeChange: setRecoveryCode,
    handleRecovery,
    handleStartInitialSetup,
    handleConfirmInitialSetup,
    handleCopyRecoveryCode,
    handleDownloadRecoveryCode,
    handleStartTrustedDeviceEnrollment,
    handleStartTrustedDeviceResponseScan,
    handleTrustedDeviceResponseScan,
    handleTrustedDeviceError,
    handleCancelTrustedDeviceEnrollment,
    handleRetry,
  };
};
