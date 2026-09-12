import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { encryptedPersistence } from '#shared/adapters/persistence';
import {
  trustedDeviceEnrollment,
  type TrustedDeviceRequest,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { trustedDeviceQr } from '#shared/adapters/vault-protocol/trusted-device-qr';
import { trustedDeviceTransfer } from '#shared/adapters/vault-protocol/trusted-device-transfer';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { TrustedDeviceQrScanner } from '#shared/ui/TrustedDeviceQrScanner';

const isRequest = (value: unknown): value is TrustedDeviceRequest =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  'newEphemeralPublicKey' in value &&
  !('oldEphemeralPublicKey' in value);

export const TrustedDeviceApproval = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const [responseQrSvg, setResponseQrSvg] = useState<string>();
  const [pendingRequest, setPendingRequest] = useState<TrustedDeviceRequest>();
  const [error, setError] = useState<string>();

  const handleStop = useCallback((): void => setActive(false), []);
  const handleStart = useCallback((): void => setActive(true), []);

  const handleScan = (value: string): void => {
    setError(undefined);
    void (async () => {
      const material = encryptedPersistence.requireVaultSyncMaterial();
      const request = trustedDeviceEnrollment.parseRequest(trustedDeviceQr.parse(value));
      if (!isRequest(request)) throw new Error('Invalid trusted-device request');
      if (
        request.accountId !== material.context.accountId ||
        request.workspaceId !== material.context.workspaceId ||
        request.vaultId !== material.context.vaultId ||
        request.keyId !== material.context.keyId ||
        request.oldDeviceId !== material.context.deviceId
      )
        throw new Error('Trusted-device request context mismatch');
      setPendingRequest(request);
      setActive(false);
    })().catch((reason: unknown) => {
      setError(
        reason instanceof Error ? reason.message : t('settings.vault.trustedDeviceError'),
      );
    });
  };

  const handleApprove = (): void => {
    const request = pendingRequest;
    if (request === undefined) return;
    void (async () => {
      const material = encryptedPersistence.requireVaultSyncMaterial();
      const response = await trustedDeviceTransfer.createApproval(
        request,
        {
          ...material.context,
          oldDeviceId: material.context.deviceId,
          newDeviceId: request.newDeviceId,
        },
      );
      setResponseQrSvg(await trustedDeviceQr.render(response));
      setPendingRequest(undefined);
    })().catch((reason: unknown) => {
      setError(
        reason instanceof Error ? reason.message : t('settings.vault.trustedDeviceError'),
      );
    });
  };

  return (
    <Card>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          {t('settings.vault.trustedDeviceTitle')}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t('settings.vault.trustedDeviceDescription')}
        </p>
      </div>
      {active && (
        <div className="mb-3 space-y-2">
          <TrustedDeviceQrScanner
            active
            onScan={handleScan}
            onError={setError}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleStop}
            className="w-full"
          >
            {t('settings.vault.trustedDeviceStop')}
          </Button>
        </div>
      )}
      {responseQrSvg !== undefined && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            {t('settings.vault.trustedDeviceResponseReady')}
          </p>
          <div
            className="mx-auto w-fit rounded-md bg-white p-3"
            role="img"
            aria-label={t('settings.vault.trustedDeviceResponseReady')}
            dangerouslySetInnerHTML={{ __html: responseQrSvg }}
          />
        </div>
      )}
      {pendingRequest !== undefined && responseQrSvg === undefined && (
        <div className="mb-3 space-y-2" role="group" aria-label={t('settings.vault.trustedDeviceConfirm')}>
          <p className="text-xs text-muted-foreground">
            {t('settings.vault.trustedDeviceConfirm', { deviceId: pendingRequest.newDeviceId })}
          </p>
          <Button type="button" onClick={handleApprove}>
            {t('settings.vault.trustedDeviceConfirmAction')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setPendingRequest(undefined)}>
            {t('settings.vault.trustedDeviceCancel')}
          </Button>
        </div>
      )}
      {error !== undefined && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          {error}
        </p>
      )}
      {!active && pendingRequest === undefined && responseQrSvg === undefined && (
        <Button type="button" variant="secondary" onClick={handleStart}>
          {t('settings.vault.trustedDeviceApprove')}
        </Button>
      )}
    </Card>
  );
};
