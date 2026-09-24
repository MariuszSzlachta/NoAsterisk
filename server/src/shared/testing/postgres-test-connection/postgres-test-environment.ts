export interface PostgresTestEnvironment {
  readonly databaseName: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
}
