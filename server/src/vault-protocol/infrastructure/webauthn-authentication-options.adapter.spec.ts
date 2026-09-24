import { WebauthnAuthenticationOptionsAdapter } from './webauthn-authentication-options.adapter';

describe('WebauthnAuthenticationOptionsAdapter', () => {
  it('creates native authentication options from the application port input', async () => {
    const options =
      await new WebauthnAuthenticationOptionsAdapter().createOptions({
        rpId: 'localhost',
        challenge: Buffer.from('login-challenge').toString('base64url'),
      });

    expect(options).toMatchObject({
      rpId: 'localhost',
      userVerification: 'required',
      challenge: Buffer.from('login-challenge').toString('base64url'),
    });
  });
});
