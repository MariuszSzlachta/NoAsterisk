export class CsvParseError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CsvParseError';
    this.code = code;
  }
}
