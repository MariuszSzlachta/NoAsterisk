export type WebauthnChallengeType = 'registration' | 'authentication' | 'login';

export interface WebauthnChallengeRecord {
  readonly challenge: string;
  readonly userId: string;
  readonly vaultId?: string;
  readonly deviceId: string;
  readonly type: WebauthnChallengeType;
  readonly expiresAt: number;
}

export interface WebauthnChallengeStorePort {
  create(input: {
    readonly userId: string;
    readonly vaultId?: string;
    readonly deviceId: string;
    readonly type: WebauthnChallengeType;
  }): WebauthnChallengeRecord | Promise<WebauthnChallengeRecord>;
  consume(
    challenge: string,
    input: {
      readonly userId: string;
      readonly vaultId?: string;
      readonly deviceId: string;
      readonly type: WebauthnChallengeType;
    },
  ): WebauthnChallengeRecord | Promise<WebauthnChallengeRecord>;
}
