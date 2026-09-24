export const WEBAUTHN_REGISTRATION_PORT = Symbol('WEBAUTHN_REGISTRATION_PORT');

export interface WebauthnRegistrationOptionsInput {
  readonly rpName: string;
  readonly rpId: string;
  readonly userName: string;
  readonly userDisplayName: string;
  readonly userId: Uint8Array<ArrayBuffer>;
  /** Base64url-encoded challenge persisted by the challenge store. */
  readonly challenge: string;
  readonly excludeCredentials: ReadonlyArray<{
    readonly id: string;
    readonly transports: ReadonlyArray<string>;
  }>;
}

export interface WebauthnRegistrationCredential {
  readonly id: string;
  readonly rawId: string;
  readonly type: 'public-key';
  readonly response: {
    readonly clientDataJSON: string;
    readonly attestationObject: string;
  };
  readonly clientExtensionResults?: Readonly<Record<string, unknown>>;
}

export interface WebauthnRegistrationInfo {
  readonly credential: {
    readonly id: string;
    readonly publicKey: Uint8Array<ArrayBuffer>;
    readonly counter: number;
    readonly transports?: ReadonlyArray<string>;
  };
  readonly origin: string;
  readonly rpID: string;
  readonly userVerified: boolean;
  readonly credentialDeviceType?: 'singleDevice' | 'multiDevice';
  readonly credentialBackedUp?: boolean;
}

export interface WebauthnRegistrationVerificationResult {
  readonly verified: boolean;
  readonly registrationInfo?: WebauthnRegistrationInfo;
}

export interface WebauthnRegistrationPort {
  createOptions(input: WebauthnRegistrationOptionsInput): Promise<unknown>;
  verifyRegistration(
    credential: WebauthnRegistrationCredential,
    expectedChallenge: string,
    expectedOrigin: string,
    expectedRpId: string,
  ): Promise<WebauthnRegistrationVerificationResult>;
}
