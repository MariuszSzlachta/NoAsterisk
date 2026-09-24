import { postgresTestDatabaseNamePattern } from './database-name.pattern';
import type { PostgresTestEnvironment } from './postgres-test-environment';

const readRequiredValue = (
  environment: NodeJS.ProcessEnv,
  name: string,
): string => {
  const value = environment[name];
  if (value === undefined || value.length === 0)
    throw new Error(
      `${name} is required; run integration tests through npm run test:integration`,
    );
  return value;
};

export const readPostgresTestEnvironment = (
  environment: NodeJS.ProcessEnv,
): PostgresTestEnvironment => {
  const databaseName = readRequiredValue(
    environment,
    'POSTGRES_TEST_DATABASE_NAME',
  );
  if (!postgresTestDatabaseNamePattern.test(databaseName))
    throw new Error(
      'POSTGRES_TEST_DATABASE_NAME must match budget_integration_<32 lowercase hex characters>_test',
    );

  const portValue = readRequiredValue(
    environment,
    'POSTGRES_TEST_DATABASE_PORT',
  );
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65_535)
    throw new Error(
      'POSTGRES_TEST_DATABASE_PORT must be an integer between 1 and 65535',
    );

  return {
    databaseName,
    port,
    user: readRequiredValue(environment, 'POSTGRES_TEST_DATABASE_USER'),
    password: readRequiredValue(environment, 'POSTGRES_TEST_DATABASE_PASSWORD'),
  };
};
