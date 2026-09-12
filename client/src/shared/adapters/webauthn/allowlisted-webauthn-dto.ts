interface AssertionResponseDto {
  readonly clientDataJSON: string;
  readonly authenticatorData: string;
  readonly signature: string;
  readonly userHandle?: string;
}

interface AssertionDto {
  readonly id: string;
  readonly rawId: string;
  readonly type: 'public-key';
  readonly response: AssertionResponseDto;
}

interface RegistrationResponseDto {
  readonly clientDataJSON: string;
  readonly attestationObject: string;
}

interface RegistrationDto {
  readonly id: string;
  readonly rawId: string;
  readonly type: 'public-key';
  readonly response: RegistrationResponseDto;
}

const MAX_WEBAUTHN_BYTES = 16_384;

const encode = (value: ArrayBuffer): string => {
  const bytes = new Uint8Array(value);
  if (bytes.length > MAX_WEBAUTHN_BYTES)
    throw new Error('WebAuthn response too large');
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
};

const assertPublicKeyCredential = (
  credential: Credential | null,
): PublicKeyCredential => {
  if (
    credential === null ||
    typeof PublicKeyCredential === 'undefined' ||
    !(credential instanceof PublicKeyCredential)
  )
    throw new Error('Invalid WebAuthn credential');
  return credential;
};

const serializeAssertion = (credential: Credential | null): AssertionDto => {
  const publicKeyCredential = assertPublicKeyCredential(credential);
  if (!(publicKeyCredential.response instanceof AuthenticatorAssertionResponse))
    throw new Error('Invalid WebAuthn assertion response');
  const response = publicKeyCredential.response;
  const userHandle = response.userHandle;
  return {
    id: publicKeyCredential.id,
    rawId: encode(publicKeyCredential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: encode(response.clientDataJSON),
      authenticatorData: encode(response.authenticatorData),
      signature: encode(response.signature),
      ...(userHandle === null ? {} : { userHandle: encode(userHandle) }),
    },
  };
};

const serializeRegistration = (
  credential: Credential | null,
): RegistrationDto => {
  const publicKeyCredential = assertPublicKeyCredential(credential);
  if (
    !(publicKeyCredential.response instanceof AuthenticatorAttestationResponse)
  )
    throw new Error('Invalid WebAuthn registration response');
  const response = publicKeyCredential.response;
  return {
    id: publicKeyCredential.id,
    rawId: encode(publicKeyCredential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: encode(response.clientDataJSON),
      attestationObject: encode(response.attestationObject),
    },
  };
};

export const allowlistedWebauthnDto = Object.freeze({
  serializeAssertion,
  serializeRegistration,
});
