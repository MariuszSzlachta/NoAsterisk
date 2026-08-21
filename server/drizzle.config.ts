import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/infrastructure/database/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'budget',
    user: process.env.DB_USER ?? 'budget_app',
    password: process.env.DB_PASSWORD ?? '',
    ssl: process.env.DB_SSL === 'true',
  },
  casing: 'snake_case',
});
