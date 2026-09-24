export interface DualRootRotationInput {
  readonly recoveryBackup: string;
  readonly confirmRecoveryBackup: (code: string) => Promise<boolean>;
}

export type DualRootRotationResult =
  | {
      readonly status: 'rotated';
      readonly keyId: string;
      readonly recoveryBackup: string;
    }
  | { readonly status: 'resumed'; readonly keyId: string };
