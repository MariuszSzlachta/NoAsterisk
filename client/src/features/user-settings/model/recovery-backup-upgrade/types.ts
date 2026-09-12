export interface RecoveryBackupAvailability {
  readonly isRegistered: boolean;
}
export interface RecoveryBackupUpgradeState {
  readonly phase: 'idle' | 'working' | 'failed' | 'completed';
  readonly setPhase: (phase: RecoveryBackupUpgradeState['phase']) => void;
  readonly reset: () => void;
}
export interface RecoveryBackupUpgradeView {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly canStart: boolean;
  readonly message: string | undefined;
  readonly hasError: boolean;
  readonly handleStart: () => void;
}
export interface RecoveryBackupUpgradeRequest {
  readonly confirmBackup: (code: string) => Promise<boolean>;
  readonly assertCurrent: () => void;
}

export type RecoveryBackupUpgradeOutcome =
  | 'registered'
  | 'cancelled'
  | 'already-registered';
