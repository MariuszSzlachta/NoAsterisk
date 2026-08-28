export interface UncategorizedTransaction {
  readonly id: string;
  readonly description: string;
  readonly categoryId?: string;
}
