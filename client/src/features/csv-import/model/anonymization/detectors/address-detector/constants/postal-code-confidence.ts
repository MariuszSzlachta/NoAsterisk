// Postal codes (XX-XXX + city) are slightly less specific — common in invoices/receipts without being PII. 0.82 balances detection vs false positives
export const POSTAL_CODE_CONFIDENCE = 0.82;
