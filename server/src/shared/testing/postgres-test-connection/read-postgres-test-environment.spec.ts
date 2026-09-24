import { readPostgresTestEnvironment } from '@shared/testing/postgres-test-connection/read-postgres-test-environment';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  POSTGRES_TEST_DATABASE_NAME:
    'budget_integration_0123456789abcdef0123456789abcdef_test',
  POSTGRES_TEST_DATABASE_PORT: '54321',
  POSTGRES_TEST_DATABASE_USER: 'budget_test',
  POSTGRES_TEST_DATABASE_PASSWORD: 'ephemeral-password',
});

describe('readPostgresTestEnvironment', () => {
  it('should read an explicitly isolated database configuration', () => {
    expect(readPostgresTestEnvironment(validEnvironment())).toEqual({
      databaseName: 'budget_integration_0123456789abcdef0123456789abcdef_test',
      port: 54_321,
      user: 'budget_test',
      password: 'ephemeral-password',
    });
  });

  it.each([
    undefined,
    '',
    'budget',
    'budget_integration_0123456789ABCDEF0123456789ABCDEF_test',
    'budget_integration_0123456789abcdef_test',
  ])('should reject a missing or unsafe database name: %s', (databaseName) => {
    const environment = validEnvironment();
    if (databaseName === undefined)
      delete environment.POSTGRES_TEST_DATABASE_NAME;
    else environment.POSTGRES_TEST_DATABASE_NAME = databaseName;

    expect(() => readPostgresTestEnvironment(environment)).toThrow(
      /POSTGRES_TEST_DATABASE_NAME/,
    );
  });

  it.each(['', '0', '65536', 'not-a-port'])(
    'should reject an invalid database port: %s',
    (port) => {
      expect(() =>
        readPostgresTestEnvironment({
          ...validEnvironment(),
          POSTGRES_TEST_DATABASE_PORT: port,
        }),
      ).toThrow(/POSTGRES_TEST_DATABASE_PORT/);
    },
  );

  it.each(['POSTGRES_TEST_DATABASE_USER', 'POSTGRES_TEST_DATABASE_PASSWORD'])(
    'should require %s',
    (name) => {
      const environment = validEnvironment();
      environment[name] = undefined;

      expect(() => readPostgresTestEnvironment(environment)).toThrow(name);
    },
  );
});
