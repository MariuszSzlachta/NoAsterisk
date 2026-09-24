import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type {
  WebauthnRegistrationCredential,
  WebauthnRegistrationOptionsInput,
  WebauthnRegistrationPort,
  WebauthnRegistrationVerificationResult,
} from '@vault-protocol/domain/ports/webauthn-registration.port';

export class WebauthnRegistrationAdapter implements WebauthnRegistrationPort {
  createOptions(input: WebauthnRegistrationOptionsInput): Promise<unknown> {
    return generateRegistrationOptions({
      rpName: input.rpName,
      rpID: input.rpId,
      userName: input.userName,
      userDisplayName: input.userDisplayName,
      userID: input.userId,
      challenge: Buffer.from(input.challenge, 'base64url'),
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      extensions: { prf: {} },
      excludeCredentials: input.excludeCredentials.map((credential) => ({
        id: credential.id,
        transports: [...credential.transports],
      })),
    });
  }

  async verifyRegistration(
    credential: WebauthnRegistrationCredential,
    expectedChallenge: string,
    expectedOrigin: string,
    expectedRpId: string,
  ): Promise<WebauthnRegistrationVerificationResult> {
    const response: RegistrationResponseJSON = {
      ...credential,
      response: {
        clientDataJSON: credential.response.clientDataJSON,
        attestationObject: credential.response.attestationObject,
      },
      clientExtensionResults: credential.clientExtensionResults ?? {},
    };
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: expectedRpId,
      expectedType: 'webauthn.create',
      requireUserVerification: true,
    });
    if (!result.verified) return { verified: false };
    const info = result.registrationInfo;
    if (info.rpID === undefined) return { verified: false };
    return {
      verified: true,
      registrationInfo: {
        credential: {
          id: info.credential.id,
          publicKey: info.credential.publicKey,
          counter: info.credential.counter,
          ...(info.credential.transports === undefined
            ? {}
            : { transports: [...info.credential.transports] }),
        },
        origin: info.origin,
        rpID: info.rpID,
        userVerified: info.userVerified,
        credentialDeviceType: info.credentialDeviceType,
        credentialBackedUp: info.credentialBackedUp,
      },
    };
  }
}
