/**
 * Computes the raw input string for content hash deduplication.
 * Hash includes accountId per ADR-005 — dedup is per-account.
 *
 * Formula: `${accountId}|${date}|${amount}|${title}`
 *
 * Callers are responsible for applying SHA-256 to the result.
 * This keeps the domain package synchronous and dependency-free.
 */
export const computeContentHashInput = (props: {
  accountId: string;
  date: string;
  amount: number;
  title: string;
}): string => `${props.accountId}|${props.date}|${props.amount}|${props.title}`;
