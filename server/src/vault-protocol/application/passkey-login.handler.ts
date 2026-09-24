import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WEBAUTHN_CHALLENGE_STORE } from '@vault-protocol/domain/ports/webauthn-challenge.token';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';
import {
  PASSKEY_TOKEN_PORT,
  type PasskeyTokenPayload,
  type PasskeyTokenPort,
} from '@vault-protocol/domain/ports/passkey-token.port';
import {
  PASSKEY_USER_REPOSITORY,
  type PasskeyUserRepository,
} from '@vault-protocol/domain/ports/passkey-user.repository';
import {
  WEBAUTHN_CREDENTIAL_REPOSITORY,
  type WebauthnCredentialRepository,
} from '@vault-protocol/domain/ports/webauthn-credential.repository';
import { WEBAUTHN_VERIFIER } from '@vault-protocol/domain/ports/webauthn-verifier.token';
import type { WebauthnVerifierPort } from '@vault-protocol/domain/ports/webauthn-verifier.port';
import {
  WEBAUTHN_AUTHENTICATION_OPTIONS_PORT,
  type WebauthnAuthenticationOptionsPort,
} from '@vault-protocol/domain/ports/webauthn-authentication-options.port';
import { webauthnUserHandle } from '@vault-protocol/application/webauthn-user-handle';

const LOGIN_DEVICE_ID = 'auth-passkey-login';
const origin = (): string =>
  process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
const rpId = (): string =>
  process.env['WEBAUTHN_RP_ID'] ?? new URL(origin()).hostname;

export interface PasskeyAssertion {
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

export interface PasskeyLoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly role: 'Superuser' | 'Member' | 'Blocked';
    readonly workspaceId: string;
  };
}

export interface PasskeyLoginVaultContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

@Injectable()
export class PasskeyLoginHandler {
  constructor(
    @Inject(PASSKEY_USER_REPOSITORY)
    private readonly users: PasskeyUserRepository,
    @Inject(WEBAUTHN_CHALLENGE_STORE)
    private readonly challenges: WebauthnChallengeStorePort,
    @Inject(WEBAUTHN_CREDENTIAL_REPOSITORY)
    private readonly credentials: WebauthnCredentialRepository,
    @Inject(WEBAUTHN_VERIFIER)
    private readonly verifier: WebauthnVerifierPort,
    @Inject(WEBAUTHN_AUTHENTICATION_OPTIONS_PORT)
    private readonly authenticationOptions: WebauthnAuthenticationOptionsPort,
    @Inject(PASSKEY_TOKEN_PORT) private readonly token: PasskeyTokenPort,
  ) {}

  async createOptions(email: string, _deviceId?: string) {
    const user = await this.users.findByEmail(email);
    if (user === undefined || user.role === 'Blocked')
      return this.authenticationOptions.createOptions({ rpId: rpId() });
    const challenge = await this.challenges.create({
      userId: user.id,
      deviceId: LOGIN_DEVICE_ID,
      type: 'login',
    });
    return this.authenticationOptions.createOptions({
      rpId: rpId(),
      challenge: challenge.challenge,
    });
  }

  async verify(
    email: string,
    challenge: string,
    assertion: PasskeyAssertion,
  ): Promise<PasskeyLoginResult> {
    const user = await this.users.findByEmail(email);
    if (user === undefined || user.role === 'Blocked')
      throw new BadRequestException('Passkey login rejected');
    await this.challenges.consume(challenge, {
      userId: user.id,
      deviceId: LOGIN_DEVICE_ID,
      type: 'login',
    });
    const credential = await this.credentials.findActiveByCredentialId(
      assertion.id,
    );
    if (credential === undefined || credential.userId !== user.id)
      throw new BadRequestException('Passkey login rejected');
    if (!webauthnUserHandle.matches(user.id, assertion.response.userHandle))
      throw new BadRequestException('Passkey login rejected');
    const verified = await this.verifier.verify(
      assertion,
      credential,
      challenge,
      origin(),
      rpId(),
    );
    await this.credentials.updateCounter(
      verified.credentialId,
      verified.newCounter,
    );
    const tokenPayload: PasskeyTokenPayload = {
      sub: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      tokenVersion: user.tokenVersion,
      authTime: Date.now(),
      amr: 'webauthn',
      vaultUnlockGrant: randomUUID(),
    };
    return {
      accessToken: this.token.sign(tokenPayload),
      refreshToken: this.token.signRefresh(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId,
      },
    };
  }
}
