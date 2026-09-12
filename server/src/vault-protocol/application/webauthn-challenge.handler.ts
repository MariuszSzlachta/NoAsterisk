import { Inject, Injectable } from '@nestjs/common';
import { WEBAUTHN_CHALLENGE_STORE } from '@vault-protocol/domain/ports/webauthn-challenge.token';
import type {
  WebauthnChallengeStorePort,
  WebauthnChallengeType,
} from '@vault-protocol/domain/ports/webauthn-challenge.store';

@Injectable()
export class WebauthnChallengeHandler {
  constructor(
    @Inject(WEBAUTHN_CHALLENGE_STORE)
    private readonly store: WebauthnChallengeStorePort,
  ) {}

  create(input: {
    readonly userId: string;
    readonly vaultId: string;
    readonly deviceId: string;
    readonly type: Extract<
      WebauthnChallengeType,
      'registration' | 'authentication'
    >;
  }) {
    return this.store.create(input);
  }
}
