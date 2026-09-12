import { randomBytes } from 'node:crypto';
import type {
  WebauthnChallengeRecord,
  WebauthnChallengeStorePort,
} from '@vault-protocol/domain/ports/webauthn-challenge.store';

interface ChallengeInput {
  readonly userId: string;
  readonly vaultId?: string;
  readonly deviceId: string;
  readonly type: 'registration' | 'authentication' | 'login';
}

const CHALLENGE_BYTES = 32;
const CHALLENGE_TTL_MS = 60_000;

export class WebauthnChallengeStore implements WebauthnChallengeStorePort {
  private readonly records = new Map<string, WebauthnChallengeRecord>();

  create(input: ChallengeInput, now = Date.now()): WebauthnChallengeRecord {
    const challenge = randomBytes(CHALLENGE_BYTES).toString('base64url');
    const record = { ...input, challenge, expiresAt: now + CHALLENGE_TTL_MS };
    this.records.set(challenge, record);
    return record;
  }

  consume(
    challenge: string,
    input: ChallengeInput,
    now = Date.now(),
  ): WebauthnChallengeRecord {
    const record = this.records.get(challenge);
    this.records.delete(challenge);
    if (
      record === undefined ||
      record.expiresAt < now ||
      record.userId !== input.userId ||
      record.vaultId !== input.vaultId ||
      record.deviceId !== input.deviceId ||
      record.type !== input.type
    )
      throw new Error('Invalid WebAuthn challenge');
    return record;
  }
}
