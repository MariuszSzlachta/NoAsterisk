import { WebauthnRegistrationAdapter } from './webauthn-registration.adapter';

describe('WebauthnRegistrationAdapter', () => {
  it('creates native registration options from the application port input', async () => {
    const options = await new WebauthnRegistrationAdapter().createOptions({
      rpName: 'BudgetFlow',
      rpId: 'localhost',
      userName: 'owner@example.com',
      userDisplayName: 'Owner',
      userId: new Uint8Array(new ArrayBuffer(16)),
      challenge: Buffer.from('challenge-1').toString('base64url'),
      excludeCredentials: [{ id: 'credential-1', transports: ['internal'] }],
    });

    expect(options).toMatchObject({
      challenge: Buffer.from('challenge-1').toString('base64url'),
      rp: { name: 'BudgetFlow', id: 'localhost' },
      user: { name: 'owner@example.com', displayName: 'Owner' },
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      extensions: { prf: {} },
      excludeCredentials: [{ id: 'credential-1', transports: ['internal'] }],
    });
  });
});
