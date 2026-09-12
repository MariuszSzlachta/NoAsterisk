import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import type {
  WebauthnAssertion,
  WebauthnStoredCredential,
  WebauthnVerificationResult,
  WebauthnVerifierPort,
} from '@vault-protocol/domain/ports/webauthn-verifier.port';

export class WebauthnVerifierAdapter implements WebauthnVerifierPort {
  async verify(
    assertion: WebauthnAssertion,
    credential: WebauthnStoredCredential,
    expectedChallenge: string,
    expectedOrigin: string,
    expectedRpId: string,
  ): Promise<WebauthnVerificationResult> {
    const response: AuthenticationResponseJSON = {
      id: assertion.id,
      rawId: assertion.rawId,
      type: assertion.type,
      response: assertion.response,
      clientExtensionResults: {},
    };
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: expectedRpId,
      expectedType: 'webauthn.get',
      requireUserVerification: true,
      credential: {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports:
          credential.transports === undefined
            ? undefined
            : [...credential.transports],
      } satisfies WebAuthnCredential,
    });
    if (!result.verified) throw new Error('WebAuthn assertion rejected');
    if (
      result.authenticationInfo.origin !== expectedOrigin ||
      result.authenticationInfo.rpID !== expectedRpId ||
      !result.authenticationInfo.userVerified
    )
      throw new Error('WebAuthn assertion policy rejected');
    return {
      credentialId: result.authenticationInfo.credentialID,
      newCounter: result.authenticationInfo.newCounter,
    };
  }
}
