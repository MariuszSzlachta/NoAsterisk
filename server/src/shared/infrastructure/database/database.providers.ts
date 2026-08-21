import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Provider } from '@nestjs/common';
import { DATABASE_POOL, DRIZZLE } from './database.tokens';
import * as schema from './schema';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    useFactory: (): Pool => {
      return new Pool({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? 'budget',
        user: process.env.DB_USER ?? 'budget_app',
        password: process.env.DB_PASSWORD ?? '',
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
        max: Number(process.env.DB_POOL_MAX ?? 20),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 10000,
      });
    },
  },
  {
    provide: DRIZZLE,
    useFactory: (pool: Pool): DrizzleDatabase => {
      return drizzle(pool, { schema });
    },
    inject: [DATABASE_POOL],
  },
];
