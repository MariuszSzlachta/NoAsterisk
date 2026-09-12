import { apiClient } from '#shared/api';

interface SyncSnapshot {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly envelopeHash: string;
  readonly header: string;
  readonly ciphertext: string;
  readonly signature: string;
  readonly signingPublicKey: string;
  readonly createdAt: string;
}

interface SyncSnapshotResponse {
  readonly status: 'empty' | 'available';
  readonly snapshot?: SyncSnapshot;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSyncSnapshot = (value: unknown): value is SyncSnapshot => {
  if (!isRecord(value)) return false;
  const record = value;
  const allowedKeys = [
    'vaultId',
    'keyId',
    'deviceId',
    'revision',
    'previousEnvelopeHash',
    'envelopeHash',
    'header',
    'ciphertext',
    'signature',
    'signingPublicKey',
    'createdAt',
  ];
  return (
    Object.keys(record).every((key) => allowedKeys.includes(key)) &&
    Object.keys(record).length === allowedKeys.length &&
    typeof record.vaultId === 'string' &&
    typeof record.keyId === 'string' &&
    typeof record.deviceId === 'string' &&
    typeof record.revision === 'number' &&
    Number.isSafeInteger(record.revision) &&
    record.revision > 0 &&
    typeof record.previousEnvelopeHash === 'string' &&
    typeof record.envelopeHash === 'string' &&
    typeof record.header === 'string' &&
    typeof record.ciphertext === 'string' &&
    typeof record.signature === 'string' &&
    typeof record.signingPublicKey === 'string' &&
    typeof record.createdAt === 'string'
  );
};

const parseResponse = (value: unknown): SyncSnapshotResponse => {
  if (!isRecord(value) || !('status' in value))
    throw new Error('Invalid sync snapshot response');
  const response = value;
  if (response.status === 'empty') return { status: 'empty' };
  if (response.status === 'available' && isSyncSnapshot(response.snapshot))
    return { status: 'available', snapshot: response.snapshot };
  throw new Error('Invalid sync snapshot response');
};

const get = async (
  vaultId: string,
  signal?: AbortSignal,
): Promise<SyncSnapshotResponse> =>
  parseResponse(
    await apiClient.get<unknown>(
      `/users/me/vault/sync/${encodeURIComponent(vaultId)}`,
      signal === undefined ? undefined : { signal },
    ),
  );

const put = async (
  snapshot: SyncSnapshot,
  expectedRevision: number,
  signal?: AbortSignal,
): Promise<{ readonly status: 'saved'; readonly revision: number; readonly envelopeHash: string }> => {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    throw new Error('Invalid sync revision');
  const response = await apiClient.put<unknown, SyncSnapshot>(
    `/users/me/vault/sync/${encodeURIComponent(snapshot.vaultId)}`,
    snapshot,
    {
      headers: { 'If-Match': String(expectedRevision) },
      ...(signal === undefined ? {} : { signal }),
    },
  );
  if (
    !isRecord(response) ||
    !('status' in response) ||
    response.status !== 'saved' ||
    !('revision' in response) ||
    typeof response.revision !== 'number' ||
    !('envelopeHash' in response) ||
    typeof response.envelopeHash !== 'string'
  )
    throw new Error('Invalid sync snapshot response');
  return {
    status: 'saved',
    revision: response.revision,
    envelopeHash: response.envelopeHash,
  };
};

export const syncSnapshotApi = Object.freeze({ get, put });
