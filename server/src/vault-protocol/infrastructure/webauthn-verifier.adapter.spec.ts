import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { WebauthnVerifierAdapter } from '@vault-protocol/infrastructure/webauthn-verifier.adapter';

jest.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: jest.fn(),
}));

describe('WebauthnVerifierAdapter', () => {
  it('delegates verification to the maintained library with strict RP/origin/UV policy', async () => {
    jest.mocked(verifyAuthenticationResponse).mockResolvedValue({
      verified: true,
      authenticationInfo: {
        credentialID: 'credential',
        newCounter: 4,
        userVerified: true,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        origin: 'https://budgetflow.test',
        rpID: 'budgetflow.test',
      },
    });
    const adapter = new WebauthnVerifierAdapter();
    const result = await adapter.verify(
      {
        id: 'credential',
        rawId: 'cmF3',
        type: 'public-key',
        response: {
          clientDataJSON: 'Y2xpZW50',
          authenticatorData: 'YXV0aA',
          signature: 'c2ln',
        },
      },
      {
        id: 'credential',
        publicKey: new Uint8Array(new ArrayBuffer(32)),
        counter: 3,
      },
      'challenge',
      'https://budgetflow.test',
      'budgetflow.test',
    );
    expect(result).toEqual({ credentialId: 'credential', newCounter: 4 });
    expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: 'challenge',
        expectedOrigin: 'https://budgetflow.test',
        expectedRPID: 'budgetflow.test',
        expectedType: 'webauthn.get',
        requireUserVerification: true,
      }),
    );
  });

  it('rejects an unverified assertion', async () => {
    jest.mocked(verifyAuthenticationResponse).mockResolvedValue({
      verified: false,
      authenticationInfo: {
        credentialID: 'credential',
        newCounter: 0,
        userVerified: false,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        origin: 'https://budgetflow.test',
        rpID: 'budgetflow.test',
      },
    });
    const adapter = new WebauthnVerifierAdapter();
    await expect(
      adapter.verify(
        {
          id: 'credential',
          rawId: 'cmF3',
          type: 'public-key',
          response: {
            clientDataJSON: 'Y2xpZW50',
            authenticatorData: 'YXV0aA',
            signature: 'c2ln',
          },
        },
        {
          id: 'credential',
          publicKey: new Uint8Array(new ArrayBuffer(32)),
          counter: 0,
        },
        'challenge',
        'https://budgetflow.test',
        'budgetflow.test',
      ),
    ).rejects.toThrow('rejected');
  });
});
