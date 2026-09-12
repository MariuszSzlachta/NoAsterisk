import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import {
  PASSKEY_USER_REPOSITORY,
  type PasskeyUserRepository,
} from '@vault-protocol/domain/ports/passkey-user.repository';
import { WEBAUTHN_CHALLENGE_STORE } from '@vault-protocol/domain/ports/webauthn-challenge.token';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';
import {
  WEBAUTHN_CREDENTIAL_REPOSITORY,
  type WebauthnCredentialRepository,
} from '@vault-protocol/domain/ports/webauthn-credential.repository';
import { WEBAUTHN_VERIFIER } from '@vault-protocol/domain/ports/webauthn-verifier.token';
import type { WebauthnVerifierPort } from '@vault-protocol/domain/ports/webauthn-verifier.port';
import { webauthnUserHandle } from '@vault-protocol/application/webauthn-user-handle';

interface CredentialContext {
  readonly vaultId: string;
  readonly deviceId: string;
}

interface RegistrationRequest extends CredentialContext {
  readonly challenge: string;
  readonly credential: RegistrationResponseJSON;
}

interface AssertionRequest extends CredentialContext {
  readonly challenge: string;
  readonly assertion: {
    readonly id: string;
    readonly rawId: string;
    readonly type: 'public-key';
    readonly response: {
      readonly clientDataJSON: string;
      readonly authenticatorData: string;
      readonly signature: string;
      readonly userHandle?: string;
    };
  };
}

const origin = (): string =>
  process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
const rpId = (): string =>
  process.env['WEBAUTHN_RP_ID'] ?? new URL(origin()).hostname;

@Injectable()
export class WebauthnCredentialHandler {
  constructor(
    @Inject(PASSKEY_USER_REPOSITORY)
    private readonly users: PasskeyUserRepository,
    @Inject(WEBAUTHN_CHALLENGE_STORE)
    private readonly challenges: WebauthnChallengeStorePort,
    @Inject(WEBAUTHN_CREDENTIAL_REPOSITORY)
    private readonly credentials: WebauthnCredentialRepository,
    @Inject(WEBAUTHN_VERIFIER)
    private readonly verifier: WebauthnVerifierPort,
  ) {}

  async createRegistrationOptions(
    user: CurrentUserPayload,
    context: CredentialContext,
  ) {
    const account = await this.users.findById(user.userId);
    if (account === undefined)
      throw new BadRequestException('Unable to create WebAuthn options');
    const challenge = await this.challenges.create({
      userId: user.userId,
      vaultId: context.vaultId,
      deviceId: context.deviceId,
      type: 'registration',
    });
    const existing = await this.credentials.listActiveByUserId(user.userId);
    return generateRegistrationOptions({
      rpName: 'BudgetFlow',
      rpID: rpId(),
      userName: account.email,
      userDisplayName: account.displayName ?? account.email,
      userID: new TextEncoder().encode(user.userId),
      challenge: challenge.challenge,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      extensions: { prf: {} },
      excludeCredentials: existing.map((credential) => ({
        id: credential.credentialId,
        transports: [...credential.transports],
      })),
    });
  }

  async verifyRegistration(
    user: CurrentUserPayload,
    request: RegistrationRequest,
  ): Promise<void> {
    const challenge = await this.challenges.consume(request.challenge, {
      userId: user.userId,
      vaultId: request.vaultId,
      deviceId: request.deviceId,
      type: 'registration',
    });
    const result = await verifyRegistrationResponse({
      response: request.credential,
      expectedChallenge: challenge.challenge,
      expectedOrigin: origin(),
      expectedRPID: rpId(),
      expectedType: 'webauthn.create',
      requireUserVerification: true,
    });
    if (!result.verified)
      throw new BadRequestException('WebAuthn registration rejected');
    if (
      result.registrationInfo.origin !== origin() ||
      result.registrationInfo.rpID !== rpId() ||
      !result.registrationInfo.userVerified
    )
      throw new BadRequestException('WebAuthn registration policy rejected');
    const info = result.registrationInfo;
    await this.credentials.create({
      userId: user.userId,
      credentialId: info.credential.id,
      publicKey: info.credential.publicKey,
      counter: info.credential.counter,
      transports: info.credential.transports ?? [],
      // PRF output and extension results never cross the network. The client
      // proves PRF usability locally during the ceremony before creating an
      // envelope, so registration does not trust a client-declared flag.
      supportsPrf: false,
    });
  }

  async list(user: CurrentUserPayload) {
    const credentials = await this.credentials.listActiveByUserId(user.userId);
    return credentials.map((credential) => ({
      credentialId: credential.credentialId,
      transports: credential.transports,
      supportsPrf: credential.supportsPrf,
    }));
  }

  async verifyAuthentication(
    user: CurrentUserPayload,
    request: AssertionRequest,
  ): Promise<void> {
    const challenge = await this.challenges.consume(request.challenge, {
      userId: user.userId,
      vaultId: request.vaultId,
      deviceId: request.deviceId,
      type: 'authentication',
    });
    const credential = await this.credentials.findActiveByCredentialId(
      request.assertion.id,
    );
    if (credential === undefined || credential.userId !== user.userId)
      throw new BadRequestException('WebAuthn assertion rejected');
    if (
      !webauthnUserHandle.matches(
        user.userId,
        request.assertion.response.userHandle,
      )
    )
      throw new BadRequestException('WebAuthn assertion rejected');
    const verified = await this.verifier.verify(
      request.assertion,
      credential,
      challenge.challenge,
      origin(),
      rpId(),
    );
    await this.credentials.updateCounter(
      verified.credentialId,
      verified.newCounter,
    );
  }

  async revoke(user: CurrentUserPayload, credentialId: string): Promise<void> {
    await this.credentials.revoke(user.userId, credentialId);
  }
}
