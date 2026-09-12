import type { Pool } from 'pg';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';

export interface VaultSecurityTestConnection {
  readonly pool: Pool;
  readonly database: DrizzleDatabase;
}
