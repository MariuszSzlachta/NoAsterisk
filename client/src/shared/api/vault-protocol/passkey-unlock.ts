import { apiClient } from '#shared/api';

const enable = async (request: {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly passkeyEnvelope: string;
}): Promise<void> => {
  await apiClient.post('/users/me/vault/security/passkey/enable', {
    ...request,
    recoveryConfirmed: true,
  });
};

export const passkeyUnlockApi = Object.freeze({ enable });
