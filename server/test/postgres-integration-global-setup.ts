import { readPostgresTestEnvironment } from '../src/shared/testing/postgres-test-connection/read-postgres-test-environment';

const postgresIntegrationGlobalSetup = (): void => {
  readPostgresTestEnvironment(process.env);
};

export default postgresIntegrationGlobalSetup;
