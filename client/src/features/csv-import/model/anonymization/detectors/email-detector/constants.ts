// Emails with dots in local part or long local parts (>8 chars) are likely personal (jan.kowalski@...) — 0.97 near-certain PII
export const PERSONAL_EMAIL_CONFIDENCE = 0.97;

// Short local parts without dots (info@, biuro@) are likely generic/business — 0.82 lower confidence as they rarely identify a person
export const GENERIC_EMAIL_CONFIDENCE = 0.82;

// Local part longer than this threshold is considered personal (e.g. "jan.kowalski" vs "info")
export const PERSONAL_LOCAL_MIN_LENGTH = 8;
