export const WEBAUTHN_AUTHENTICATION_OPTIONS_PORT = Symbol(
  'WEBAUTHN_AUTHENTICATION_OPTIONS_PORT',
);

export interface WebauthnAuthenticationOptionsInput {
  readonly rpId: string;
  /** Base64url-encoded challenge persisted by the challenge store. */
  readonly challenge?: string;
}

export interface WebauthnAuthenticationOptionsPort {
  createOptions(input: WebauthnAuthenticationOptionsInput): Promise<unknown>;
}
