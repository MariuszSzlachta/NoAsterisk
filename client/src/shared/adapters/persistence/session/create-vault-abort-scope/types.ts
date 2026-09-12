import type { VaultSessionReader } from '#shared/adapters/persistence/session/assert-vault-session-current/types';

export interface VaultAbortSession extends VaultSessionReader {
  readonly subscribe: (listener: () => void) => () => void;
}

export interface VaultAbortScope {
  readonly signal: AbortSignal;
  readonly assertCurrent: () => void;
  readonly dispose: () => void;
}
