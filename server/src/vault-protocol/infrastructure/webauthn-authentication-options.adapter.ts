import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type {
  WebauthnAuthenticationOptionsInput,
  WebauthnAuthenticationOptionsPort,
} from '@vault-protocol/domain/ports/webauthn-authentication-options.port';

export class WebauthnAuthenticationOptionsAdapter implements WebauthnAuthenticationOptionsPort {
  createOptions(input: WebauthnAuthenticationOptionsInput): Promise<unknown> {
    return generateAuthenticationOptions({
      rpID: input.rpId,
      userVerification: 'required',
      ...(input.challenge === undefined
        ? {}
        : { challenge: Buffer.from(input.challenge, 'base64url') }),
    });
  }
}
