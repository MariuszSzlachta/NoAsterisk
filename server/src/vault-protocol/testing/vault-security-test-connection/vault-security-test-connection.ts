import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import * as schema from '@shared/infrastructure/database/schema';
import { vaultSecurityTestDatabasePattern } from '@vault-protocol/testing/vault-security-test-connection/database-name.pattern';
import type { VaultSecurityTestConnection } from '@vault-protocol/testing/vault-security-test-connection/types';

/** Never falls back to DB_NAME: migration runs only on an explicitly isolated DB. */
export const createVaultSecurityTestConnection =
  async (): Promise<VaultSecurityTestConnection> => {
    const name = process.env.VAULT_SECURITY_TEST_DATABASE_NAME;
    if (name === undefined || !vaultSecurityTestDatabasePattern.test(name))
      throw new Error('An isolated vault security database is required');
    const port = Number(process.env.VAULT_SECURITY_TEST_DATABASE_PORT ?? 5432);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('Invalid isolated database port');
    const pool = new Pool({
      host: '127.0.0.1',
      port,
      database: name,
      user: process.env.DB_USER ?? 'budget_app',
      password: process.env.DB_PASSWORD ?? '',
      max: 4,
    });
    const database = drizzle(pool, { schema });
    try {
      await migrate(database, {
        migrationsFolder: resolve(process.cwd(), 'drizzle/migrations'),
      });
      return { pool, database };
    } catch (error) {
      await pool.end();
      throw error;
    }
  };
