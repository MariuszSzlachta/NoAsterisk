import { apiClient } from '#shared/api';

interface PreparationResponse {
  readonly challenge: string;
  readonly serverShare: string;
  readonly expiresAt: string;
}

const isPreparation = (value: unknown): value is PreparationResponse =>
  typeof value === 'object' &&
  value !== null &&
  'challenge' in value &&
  typeof value.challenge === 'string' &&
  'serverShare' in value &&
  typeof value.serverShare === 'string' &&
  'expiresAt' in value &&
  typeof value.expiresAt === 'string';

const prepare = async (
  deviceId: string,
  vaultId: string | undefined,
): Promise<PreparationResponse> => {
  const response = await apiClient.post<unknown, {
    readonly deviceId: string;
    readonly vaultId?: string;
    readonly recoveryConfirmed: true;
  }>('/users/me/vault/enrollment/prepare', {
    deviceId,
    ...(vaultId === undefined ? {} : { vaultId }),
    recoveryConfirmed: true,
  });
  if (!isPreparation(response)) throw new Error('Invalid enrollment preparation');
  return response;
};

const finalize = async (request: {
  readonly challenge: string;
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceEnvelope: string;
  readonly signingPublicKey: string;
  readonly trustedDeviceProof?: string;
}): Promise<void> => {
  await apiClient.post<unknown, typeof request>('/users/me/vault/enrollment/finalize', request);
};

const confirm = async (request: {
  readonly challenge: string;
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
}): Promise<void> => {
  await apiClient.post<unknown, typeof request>(
    '/users/me/vault/enrollment/confirm',
    request,
  );
};

export const vaultEnrollment = Object.freeze({ prepare, finalize, confirm });
