export class DomainError extends Error {
  readonly field: string | undefined;
  readonly code: string | undefined;

  constructor(message: string, field?: string, code?: string) {
    super(message);
    this.name = 'DomainError';
    this.field = field;
    this.code = code;
  }
}
