import { apiClient } from '#shared/api';

const enableHighSecurity = async (request: {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly passkeyEnvelope: string;
}): Promise<void> => {
  await apiClient.post<unknown, {
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
    readonly passkeyEnvelope: string;
    readonly recoveryConfirmed: true;
  }>('/users/me/vault/security/high-security/enable', {
    ...request,
    recoveryConfirmed: true,
  });
};

const disableHighSecurity = async (request: {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly deviceEnvelope: string;
}): Promise<void> => {
  await apiClient.post('/users/me/vault/security/high-security/disable', {
    vaultId: request.vaultId,
    keyId: request.keyId,
    deviceId: request.deviceId,
    deviceEnvelope: request.deviceEnvelope,
    recoveryConfirmed: true,
  });
};

export const vaultSecurity = Object.freeze({ enableHighSecurity, disableHighSecurity });
