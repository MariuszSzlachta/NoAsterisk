import { Module, Inject, OnApplicationShutdown, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { databaseProviders } from './database.providers';
import { DATABASE_POOL, DRIZZLE } from './database.tokens';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [DATABASE_POOL, DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
