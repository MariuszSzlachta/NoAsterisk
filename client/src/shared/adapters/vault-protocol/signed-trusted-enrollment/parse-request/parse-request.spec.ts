import { describe, expect, it } from 'vitest';

import { parseSignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-request';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';

describe('parseSignedTrustedRequest', () => {
  it('requires matching public identities in the signed intent and native transfer', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      expect(parseSignedTrustedRequest(fixture.request)).toEqual(
        fixture.request,
      );
      for (const substitution of [
        { accountId: 'other' },
        { workspaceId: 'other' },
        { vaultId: 'other' },
        { keyId: 'other' },
        { oldDeviceId: 'other' },
        { newDeviceId: 'other' },
        { requestId: 'other' },
        {
          newEphemeralPublicKey: {
            ...fixture.request.transferRequest.newEphemeralPublicKey,
            x: 'other',
          },
        },
      ]) {
        expect(() =>
          parseSignedTrustedRequest({
            ...fixture.request,
            transferRequest: {
              ...fixture.request.transferRequest,
              ...substitution,
            },
          }),
        ).toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('rejects legacy packets and root-secret fields at either boundary', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      for (const value of [
        fixture.request.transferRequest,
        { ...fixture.request, recoverySeed: 'secret' },
        {
          ...fixture.request,
          intent: { ...fixture.request.intent, vmk: 'secret' },
        },
        {
          ...fixture.request,
          transferRequest: {
            ...fixture.request.transferRequest,
            recoverySeed: 'secret',
          },
        },
      ]) {
        expect(() => parseSignedTrustedRequest(value)).toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
