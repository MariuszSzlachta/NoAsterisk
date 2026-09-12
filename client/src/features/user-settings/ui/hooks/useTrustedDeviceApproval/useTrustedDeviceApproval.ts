import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrustedDeviceApprovalResponseView } from '#features/user-settings/model/trusted-device-approval/types';
import { useTrustedDeviceApprovalStore } from '#features/user-settings/store/useTrustedDeviceApprovalStore';
import { createSignedTrustedApproval } from '#features/user-settings/ui/hooks/create-signed-trusted-approval';
import type { TrustedDeviceApprovalHookResult } from '#features/user-settings/ui/hooks/useTrustedDeviceApproval/types';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { parseSignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import {
  parseSignedTrustedQr,
  renderSignedTrustedQr,
} from '#shared/adapters/vault-protocol/signed-trusted-qr';

export const useTrustedDeviceApproval = (): TrustedDeviceApprovalHookResult => {
  const { t } = useTranslation();
  const phase = useTrustedDeviceApprovalStore((state) => state.phase);
  const error = useTrustedDeviceApprovalStore((state) => state.error);
  const generation = useRef(0);
  const handleCancel = (): void => {
    generation.current += 1;
    useTrustedDeviceApprovalStore.getState().reset();
  };
  const handleStart = (): void => {
    handleCancel();
    useTrustedDeviceApprovalStore.getState().setPhase({ kind: 'scanning' });
  };
  const handleScanError = (_message: string): void => {
    if (useTrustedDeviceApprovalStore.getState().phase.kind !== 'scanning')
      return;
    useTrustedDeviceApprovalStore
      .getState()
      .setError(t('settings.vault.trustedDeviceError'));
  };
  const handleScan = (text: string): void => {
    if (useTrustedDeviceApprovalStore.getState().phase.kind !== 'scanning')
      return;
    try {
      const context = encryptedPersistence.requireVaultSyncMaterial().context;
      const request = parseSignedTrustedRequest(parseSignedTrustedQr(text));
      if (
        request.intent.accountId !== context.accountId ||
        request.intent.workspaceId !== context.workspaceId ||
        request.intent.vaultId !== context.vaultId ||
        request.intent.keyId !== context.keyId ||
        request.intent.oldDeviceId !== context.deviceId ||
        Date.now() >= request.intent.expiresAt
      )
        throw new Error('Approval unavailable');
      useTrustedDeviceApprovalStore
        .getState()
        .setPhase({ kind: 'confirm', request });
    } catch {
      handleScanError('');
    }
  };
  const handleApprove = (): void => {
    const current = useTrustedDeviceApprovalStore.getState().phase;
    if (current.kind !== 'confirm') return;
    const started = generation.current;
    useTrustedDeviceApprovalStore
      .getState()
      .setPhase({ kind: 'generating', request: current.request });
    void (async () => {
      const sessionGeneration = encryptedPersistence.getGeneration();
      const context = encryptedPersistence.requireVaultSyncMaterial().context;
      const response = await createSignedTrustedApproval(current.request);
      assertVaultSessionCurrent(
        encryptedPersistence,
        sessionGeneration,
        context,
      );
      const markup = { __html: await renderSignedTrustedQr(response) };
      assertVaultSessionCurrent(
        encryptedPersistence,
        sessionGeneration,
        context,
      );
      if (Date.now() >= current.request.intent.expiresAt)
        throw new Error('Approval expired');
      if (started !== generation.current) return;
      useTrustedDeviceApprovalStore
        .getState()
        .setPhase({ kind: 'response', markup });
    })().catch(() => {
      if (started !== generation.current) return;
      useTrustedDeviceApprovalStore
        .getState()
        .setPhase({ kind: 'confirm', request: current.request });
      useTrustedDeviceApprovalStore
        .getState()
        .setError(t('settings.vault.trustedDeviceError'));
    });
  };
  useEffect(() => {
    const sessionGeneration = encryptedPersistence.getGeneration();
    const invalidate = (): void => {
      generation.current += 1;
      useTrustedDeviceApprovalStore.getState().reset();
    };
    const unsubscribe = encryptedPersistence.subscribe(() => {
      if (
        !encryptedPersistence.isUnlocked() ||
        encryptedPersistence.getGeneration() !== sessionGeneration
      )
        invalidate();
    });
    return () => {
      unsubscribe();
      invalidate();
    };
  }, []);
  const response: TrustedDeviceApprovalResponseView | undefined =
    phase.kind === 'response'
      ? {
          markup: phase.markup,
          label: t('settings.vault.trustedDeviceResponseReady'),
        }
      : undefined;
  return {
    handleStart,
    handleCancel,
    handleScan,
    handleScanError,
    handleApprove,
    data: {
      isScanning: phase.kind === 'scanning',
      isIdle: phase.kind === 'idle',
      isConfirming: phase.kind === 'confirm' || phase.kind === 'generating',
      isGenerating: phase.kind === 'generating',
      confirmationLabel: t('settings.vault.trustedDeviceConfirm', {
        deviceId:
          phase.kind === 'confirm' || phase.kind === 'generating'
            ? phase.request.intent.deviceId
            : '',
      }),
      title: t('settings.vault.trustedDeviceTitle'),
      description: t('settings.vault.trustedDeviceDescription'),
      startLabel: t('settings.vault.trustedDeviceApprove'),
      stopLabel: t('settings.vault.trustedDeviceStop'),
      approveLabel: t('settings.vault.trustedDeviceConfirmAction'),
      cancelLabel: t('settings.vault.trustedDeviceCancel'),
      response,
      error,
    },
  };
};
