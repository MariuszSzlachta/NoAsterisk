// Street addresses with prefix (ul./al./os./pl.) are strong structural indicators — 0.88 reflects high but not perfect precision due to possible abbreviated business names
export const STREET_CONFIDENCE = 0.88;

// Postal codes (XX-XXX + city) are slightly less specific — common in invoices/receipts without being PII. 0.82 balances detection vs false positives
export const POSTAL_CODE_CONFIDENCE = 0.82;
