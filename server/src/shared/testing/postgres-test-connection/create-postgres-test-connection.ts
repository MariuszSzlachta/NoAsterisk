import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@shared/infrastructure/database/schema';
import type { PostgresTestConnection } from '@shared/testing/postgres-test-connection/postgres-test-connection';
import { readPostgresTestEnvironment } from '@shared/testing/postgres-test-connection/read-postgres-test-environment';

export const createPostgresTestConnection =
  async (): Promise<PostgresTestConnection> => {
    const environment = readPostgresTestEnvironment(process.env);
    const pool = new Pool({
      host: '127.0.0.1',
      port: environment.port,
      database: environment.databaseName,
      user: environment.user,
      password: environment.password,
      max: 4,
      connectionTimeoutMillis: 5_000,
    });

    try {
      const client = await pool.connect();
      client.release();
      return { pool, database: drizzle(pool, { schema }) };
    } catch (error) {
      await pool.end();
      throw error;
    }
  };
