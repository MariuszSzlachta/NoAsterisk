import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildEnrollmentTranscript } from '#shared/adapters/vault-protocol/enrollment-transcript/testing/build-transcript';
import { apiClient } from '#shared/api';
import { prepareSignedEnrollment } from '#shared/api/vault-protocol/signed-enrollment/prepare';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));
describe('signed enrollment prepare HTTP boundary', () => {
  afterEach(() => vi.clearAllMocks());
  it('should accept only server context matching every submitted public intent field', async () => {
    const intent = buildEnrollmentTranscript();
    const input = {
      purpose: intent.purpose,
      vaultId: intent.vaultId,
      keyId: intent.keyId,
      deviceId: intent.deviceId,
      signingPublicKey: intent.signingPublicKey,
      recoveryPublicKey: intent.recoveryPublicKey,
    };
    vi.mocked(apiClient.post).mockResolvedValue({
      intent,
      serverShare: btoa(String.fromCharCode(...new Uint8Array(32))),
    });
    await expect(prepareSignedEnrollment(input)).resolves.toMatchObject({
      intent,
    });
    vi.mocked(apiClient.post).mockResolvedValue({
      intent: { ...intent, signingPublicKey: '{"substituted":true}' },
      serverShare: btoa(String.fromCharCode(...new Uint8Array(32))),
    });
    await expect(prepareSignedEnrollment(input)).rejects.toThrow(
      'context mismatch',
    );
    vi.mocked(apiClient.post).mockResolvedValue({
      intent,
      serverShare: 'malformed',
    });
    await expect(prepareSignedEnrollment(input)).rejects.toThrow(
      'Invalid enrollment preparation',
    );
  });
});
