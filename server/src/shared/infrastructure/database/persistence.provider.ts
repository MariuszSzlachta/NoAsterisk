import { Provider, Type } from '@nestjs/common';

/**
 * Creates a repository provider that swaps between Postgres and InMemory
 * implementations based on PERSISTENCE_MODE environment variable.
 *
 * - 'postgres' → uses PostgresImpl (requires DatabaseModule + running DB)
 * - 'memory' or unset → uses InMemoryImpl (default, no external deps)
 */
export const createRepositoryProvider = (
  token: symbol,
  PostgresImpl: Type,
  InMemoryImpl: Type,
): Provider => ({
  provide: token,
  useClass:
    process.env.PERSISTENCE_MODE === 'postgres' ? PostgresImpl : InMemoryImpl,
});
