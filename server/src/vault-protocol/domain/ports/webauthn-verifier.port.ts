export interface WebauthnAssertion {
  readonly id: string;
  readonly rawId: string;
  readonly type: 'public-key';
  readonly response: {
    readonly clientDataJSON: string;
    readonly authenticatorData: string;
    readonly signature: string;
    readonly userHandle?: string;
  };
}

export interface WebauthnStoredCredential {
  readonly id: string;
  readonly publicKey: Uint8Array<ArrayBuffer>;
  readonly counter: number;
  readonly transports?: ReadonlyArray<string>;
}

export interface WebauthnVerificationResult {
  readonly credentialId: string;
  readonly newCounter: number;
}

export interface WebauthnVerifierPort {
  verify(
    assertion: WebauthnAssertion,
    credential: WebauthnStoredCredential,
    expectedChallenge: string,
    expectedOrigin: string,
    expectedRpId: string,
  ): Promise<WebauthnVerificationResult>;
}
