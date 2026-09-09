import { Vault } from '@user-settings/domain/vault.entity';

export type VaultWriteResult =
  | { status: 'saved'; vault: Vault }
  | { status: 'conflict' };
