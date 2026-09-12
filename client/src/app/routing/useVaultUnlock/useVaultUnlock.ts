import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { hydrateFinancialStores } from '#app/providers/hydrate-financial-stores';
import { vaultUnlockPolicy } from '#app/routing/useVaultUnlock/vault-unlock-policy';
import { shouldResetVaultUnlockAttempt } from '#app/routing/useVaultUnlock/vault-unlock-state';
import { parseVaultPayload } from '#features/user-settings/model/parse-vault-payload';
import {
  encryptedPersistence,
  type PersistenceSessionSnapshot,
} from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { recoveryCode as recoveryCodeProtocol } from '#shared/adapters/vault-protocol/recovery-code';
import { recoveryQr } from '#shared/adapters/vault-protocol/recovery-qr';
import {
  trustedDeviceEnrollment,
  type TrustedDeviceRequest,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { trustedDeviceQr } from '#shared/adapters/vault-protocol/trusted-device-qr';
import { trustedDeviceTransfer } from '#shared/adapters/vault-protocol/trusted-device-transfer';
import { unlockCoordinator } from '#shared/adapters/vault-protocol/unlock-coordinator';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultRotation } from '#shared/adapters/vault-protocol/vault-rotation';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';
import { vaultDevices } from '#shared/api/vault-protocol/vault-devices';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

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
  readonly handleTrustedDeviceError: (message: string) => void;
  readonly handleCancelTrustedDeviceEnrollment: () => void;
  readonly handleRetry: () => void;
}

interface BootstrapState {
  readonly status: 'empty' | 'enrollment-required' | 'available';
  readonly vaultId?: string;
  readonly keyId?: string;
  readonly deviceId: string;
  readonly securityProfile?: 'standard' | 'high-security';
  readonly deviceEnvelope?: string;
  readonly passkeyEnvelope?: string;
}

type FlowGuard = () => void;

const decodeServerShare = (value: string): Uint8Array<ArrayBuffer> => {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  )
    throw new Error('Invalid ServerShare response');
  const decoded = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  if (bytes.length !== vaultProtocolConstants.maxShareLength)
    throw new Error('Invalid ServerShare response');
  return bytes;
};

const unlockFromBootstrap = async (
  accountId: string,
  workspaceId: string,
  bootstrap: BootstrapState,
  assertCurrent: FlowGuard,
): Promise<void> => {
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId === undefined ||
    bootstrap.keyId === undefined ||
    (bootstrap.deviceEnvelope === undefined &&
      bootstrap.passkeyEnvelope === undefined)
  )
    throw new Error('Recovery is required');
  const context = {
    accountId,
    workspaceId,
    vaultId: bootstrap.vaultId,
    keyId: bootstrap.keyId,
    deviceId: bootstrap.deviceId,
  };
  const isHighSecurity = vaultUnlockPolicy.isHighSecurityBootstrap(bootstrap);
  const localShare = isHighSecurity
    ? undefined
    : await encryptedPersistence.readVaultLocalShare(context);
  assertCurrent();
  let serverShare: Uint8Array<ArrayBuffer> | undefined;
  try {
    serverShare = await issueServerShare(bootstrap.deviceId);
    assertCurrent();
    let prfKey: CryptoKey | undefined;
    let credentialId: string | undefined;
    const handoff =
      bootstrap.passkeyEnvelope === undefined
        ? undefined
        : passkeyUnlockHandoff.consume({ ...context });
    if (handoff !== undefined) {
      prfKey = handoff.prfKey;
      credentialId = handoff.credentialId;
      if (isHighSecurity && prfKey === undefined) {
        serverShare.fill(0);
        throw new Error('Passkey PRF is required');
      }
    } else if (
      bootstrap.passkeyEnvelope !== undefined &&
      (isHighSecurity || bootstrap.deviceEnvelope === undefined)
    ) {
      try {
        const passkeyResult = await vaultPasskeyCeremony.run(context);
        assertCurrent();
        prfKey = passkeyResult.prfKey;
        credentialId = passkeyResult.credentialId;
      } catch (error) {
        // A passkey envelope is the high-security authority. Its ceremony must
        // fail closed when the local envelope was removed. Standard mode may
        // retain both envelopes so an unsupported/cancelled PRF can use the
        // explicitly available split-unlock fallback.
        if (!vaultUnlockPolicy.canFallbackToDeviceEnvelope(bootstrap)) {
          serverShare.fill(0);
          throw error;
        }
      }
    }
    if (
      prfKey === undefined &&
      (localShare === undefined || bootstrap.deviceEnvelope === undefined)
    ) {
      serverShare.fill(0);
      throw new Error('Recovery is required');
    }
    const envelopeValue =
      prfKey === undefined
        ? bootstrap.deviceEnvelope
        : bootstrap.passkeyEnvelope;
    if (envelopeValue === undefined) {
      serverShare.fill(0);
      throw new Error('Vault envelope is unavailable');
    }
    let unlocked:
      | Awaited<ReturnType<typeof unlockCoordinator.unlock>>
      | undefined;
    try {
      unlocked = await unlockCoordinator.unlock({
        mode: isHighSecurity ? 'high-security' : 'standard',
        ...(localShare === undefined ? {} : { localShare }),
        serverShare,
        envelope: JSON.parse(envelopeValue),
        context:
          credentialId === undefined ? context : { ...context, credentialId },
        ...(prfKey === undefined ? {} : { prfKey }),
      });
      assertCurrent();
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...unlocked,
          ...(localShare === undefined ? {} : { localShare }),
        },
        context,
        hydrateFinancialStores,
      );
      assertCurrent();
    } finally {
      unlocked?.vmk.fill(0);
    }
    try {
      await vaultRotation.resumePending();
      assertCurrent();
    } catch {
      // The encrypted journal remains retryable when fresh-auth commit is unavailable.
    }
  } finally {
    serverShare?.fill(0);
  }
};

const enrollVmk = async (
  accountId: string,
  workspaceId: string,
  bootstrap: BootstrapState,
  vmk: Uint8Array,
  assertCurrent: FlowGuard,
  trustedDeviceProof?: string,
): Promise<void> => {
  const existingVaultId =
    bootstrap.status === 'empty' ? undefined : bootstrap.vaultId;
  const vaultId = existingVaultId ?? crypto.randomUUID();
  const keyId =
    (bootstrap.status === 'empty' ? undefined : bootstrap.keyId) ??
    crypto.randomUUID();
  const context = {
    accountId,
    workspaceId,
    vaultId,
    keyId,
    deviceId: bootstrap.deviceId,
  };
  const localShare = await vaultProtocol.generateLocalShare();
  assertCurrent();
  const prepared = await vaultEnrollment.prepare(
    bootstrap.deviceId,
    existingVaultId,
  );
  assertCurrent();
  const serverShare = decodeServerShare(prepared.serverShare);
  try {
    const wrappingKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      context,
    );
    assertCurrent();
    const envelope = await vaultProtocol.wrapVmk(
      vmk,
      wrappingKey,
      context,
      vaultProtocolConstants.deviceWrapPurpose,
    );
    const signingKeyPair = await deviceSigningKey.generate();
    const signingPublicKey = JSON.stringify(
      await deviceSigningKey.exportPublicJwk(signingKeyPair.publicKey),
    );
    assertCurrent();
    await vaultEnrollment.finalize({
      challenge: prepared.challenge,
      deviceId: bootstrap.deviceId,
      vaultId,
      keyId,
      deviceEnvelope: JSON.stringify(envelope),
      signingPublicKey,
      ...(trustedDeviceProof === undefined ? {} : { trustedDeviceProof }),
    });
    assertCurrent();
    const vaultKeys = await vaultProtocol.deriveKeys(vmk, context);
    assertCurrent();
    try {
      await encryptedPersistence.unlockWithVaultKeys(
        { ...vaultKeys, localShare, signingKeyPair, vmk },
        context,
        hydrateFinancialStores,
      );
      assertCurrent();
      await vaultEnrollment.confirm({
        challenge: prepared.challenge,
        deviceId: bootstrap.deviceId,
        vaultId,
        keyId,
      });
    } catch (error) {
      encryptedPersistence.lock();
      throw error;
    }
  } finally {
    serverShare.fill(0);
  }
};

const recoverWithCode = async (
  accountId: string,
  workspaceId: string,
  bootstrap: BootstrapState,
  code: string,
  assertCurrent: FlowGuard = () => undefined,
): Promise<void> => {
  const vmk = await recoveryCodeProtocol.restore(code);
  try {
    assertCurrent();
    if (
      bootstrap.status === 'available' &&
      bootstrap.vaultId !== undefined &&
      bootstrap.keyId !== undefined
    ) {
      const remote = await syncSnapshotApi.get(bootstrap.vaultId);
      assertCurrent();
      if (remote.status !== 'available' || remote.snapshot === undefined)
        throw new Error('Recovery authority is unavailable');
      const context = {
        accountId,
        workspaceId,
        vaultId: bootstrap.vaultId,
        keyId: bootstrap.keyId,
        deviceId: bootstrap.deviceId,
      };
      const keys = await vaultProtocol.deriveKeys(vmk, context);
      assertCurrent();
      const senderKey = await deviceSigningKey.importPublicJwk(
        JSON.parse(remote.snapshot.signingPublicKey),
      );
      assertCurrent();
      const plaintext = await opaqueSyncSnapshot.openEnvelope(
        {
          header: JSON.parse(remote.snapshot.header),
          ciphertext: remote.snapshot.ciphertext,
          signature: remote.snapshot.signature,
        },
        context,
        keys.sync,
        senderKey,
        {
          revision: Math.max(0, remote.snapshot.revision - 1),
          envelopeHash: remote.snapshot.previousEnvelopeHash,
        },
      );
      assertCurrent();
      parseVaultPayload(plaintext);
    }
    await enrollVmk(accountId, workspaceId, bootstrap, vmk, assertCurrent);
    assertCurrent();
  } finally {
    vmk.fill(0);
  }
};

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
  const [bootstrap, setBootstrap] = useState<BootstrapState>();
  const [recoverySetupCode, setRecoverySetupCode] = useState<string>();
  const [recoverySetupQrSvg, setRecoverySetupQrSvg] = useState<string>();
  const [trustedDeviceFlow, setTrustedDeviceFlow] = useState<
    'idle' | 'show-request' | 'scan-response'
  >('idle');
  const [trustedDeviceRequestQrSvg, setTrustedDeviceRequestQrSvg] =
    useState<string>();
  const [trustedDeviceError, setTrustedDeviceError] = useState<string>();
  const pendingSetup = useRef<
    { readonly code: string; readonly vmk: Uint8Array } | undefined
  >(undefined);
  const trustedDeviceRequest = useRef<
    | {
        readonly request: TrustedDeviceRequest;
        readonly privateKey: CryptoKey;
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
    setIsUnlocking(true);
    setError(undefined);
    void unlock()
      .catch(() => setError(t('vaultUnlock.errors.failed')))
      .finally(() => setIsUnlocking(false));
  }, [isUnlocking, t, unlock]);

  const handleRecovery = useCallback((): void => {
    if (isUnlocking || recoveryCode.length === 0) return;
    setIsUnlocking(true);
    setError(undefined);
    void (async () => {
      const startedGeneration = flowGeneration.current;
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
      .catch(() => setError(t('vaultUnlock.errors.recoveryFailed')))
      .finally(() => setIsUnlocking(false));
  }, [accountId, bootstrap, isUnlocking, recoveryCode, t, workspaceId]);

  const handleStartInitialSetup = useCallback((): void => {
    if (isUnlocking) return;
    setError(undefined);
    void (async () => {
      const startedGeneration = flowGeneration.current;
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      setBootstrap(currentBootstrap);
      if (currentBootstrap.status !== 'empty')
        throw new Error('Vault already exists');
      const created = await recoveryCodeProtocol.create();
      if (flowGeneration.current !== startedGeneration) {
        created.vmk.fill(0);
        throw new Error('Vault setup flow was cancelled');
      }
      pendingSetup.current = created;
      setRecoverySetupCode(created.code);
    })().catch(() => setError(t('vaultUnlock.errors.setupFailed')));
  }, [bootstrap, isUnlocking, t]);

  const handleConfirmInitialSetup = useCallback((): void => {
    const pending = pendingSetup.current;
    if (isUnlocking || pending === undefined) return;
    setIsUnlocking(true);
    setError(undefined);
    void (async () => {
      const startedGeneration = flowGeneration.current;
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
      await enrollVmk(
        accountId,
        workspaceId,
        currentBootstrap,
        pending.vmk,
        () => {
          if (flowGeneration.current !== startedGeneration)
            throw new Error('Vault setup flow was cancelled');
        },
      );
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Vault setup flow was cancelled');
      pending.vmk.fill(0);
      pendingSetup.current = undefined;
      setRecoverySetupCode(undefined);
      setRequiresRecovery(false);
    })()
      .catch(() => setError(t('vaultUnlock.errors.setupFailed')))
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
    void (async () => {
      const startedGeneration = flowGeneration.current;
      const currentBootstrap = bootstrap ?? (await vaultBootstrap.get());
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
        newDeviceId: currentBootstrap.deviceId,
      } as const;
      const created = await trustedDeviceEnrollment.createRequest(context);
      const requestQr = await trustedDeviceQr.render(created.request);
      if (flowGeneration.current !== startedGeneration)
        throw new Error('Trusted-device flow was cancelled');
      const signingPublicKey: unknown = JSON.parse(trusted.signingPublicKey);
      if (!trustedDeviceEnrollment.isP256PublicJwk(signingPublicKey))
        throw new Error('Invalid trusted device signing key');
      trustedDeviceRequest.current = {
        request: created.request,
        privateKey: created.privateKey,
        signingPublicKey,
      };
      setTrustedDeviceRequestQrSvg(requestQr);
      setTrustedDeviceFlow('show-request');
    })().catch((error: unknown) => {
      setTrustedDeviceError(
        error instanceof Error
          ? error.message
          : 'Trusted-device enrollment failed',
      );
    });
  }, [accountId, bootstrap, isUnlocking, workspaceId]);

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
        const response = trustedDeviceEnrollment.parseResponse(
          trustedDeviceQr.parse(value),
        );
        const vmk = await trustedDeviceTransfer.restoreApproval(
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
            JSON.stringify(response),
          );
          trustedDeviceRequest.current = undefined;
          setTrustedDeviceRequestQrSvg(undefined);
          setTrustedDeviceFlow('idle');
          setRequiresRecovery(false);
        } finally {
          vmk.fill(0);
        }
      })()
        .catch((error: unknown) => {
          if (flowGeneration.current === startedGeneration)
            setTrustedDeviceError(
              error instanceof Error
                ? error.message
                : 'Trusted-device enrollment failed',
            );
        })
        .finally(() => setIsUnlocking(false));
    },
    [accountId, bootstrap, isUnlocking, workspaceId],
  );

  const handleCancelTrustedDeviceEnrollment = useCallback((): void => {
    flowGeneration.current += 1;
    trustedDeviceRequest.current = undefined;
    setTrustedDeviceRequestQrSvg(undefined);
    setTrustedDeviceError(undefined);
    setTrustedDeviceFlow('idle');
  }, []);

  const handleTrustedDeviceError = useCallback((message: string): void => {
    setTrustedDeviceError(message);
  }, []);

  useEffect(() => {
    const unsubscribe = encryptedPersistence.subscribe(() => {
      flowGeneration.current += 1;
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
      pendingSetup.current = undefined;
    },
    [],
  );

  useEffect(() => {
    flowGeneration.current += 1;
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
    error: error ?? snapshot.error,
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
