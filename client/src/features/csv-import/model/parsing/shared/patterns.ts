/** Matches CR+LF and standalone CR for normalization to LF */
export const CRLF_PATTERN = /\r\n|\r/g;

/** Matches one or more whitespace chars (for collapsing/splitting) */
export const LINE_SPLIT_PATTERN = /\r?\n/;

/** Strips leading # from mBank-style headers */
export const LEADING_HASH_PATTERN = /^#/;

/** Strips leading # with global+multiline (for bulk header cleanup) */
export const LEADING_HASH_GLOBAL_PATTERN = /^#/gm;

/** Strips surrounding double quotes from field values */
export const SURROUNDING_QUOTES_PATTERN = /^"|"$/g;

/** Splits date-like strings on common delimiters (dot, dash, slash) */
export const DATE_DELIMITER_PATTERN = /[-/.]/;

/** Strips encoding name separators for normalization (dashes, underscores) */
export const ENCODING_SEPARATOR_PATTERN = /[-_]/g;

/** Digits-only test */
export const DIGITS_ONLY_PATTERN = /^\d+$/;

/** Detects digit-space-digit (space as thousands separator — PL pattern) */
export const DIGIT_SPACE_DIGIT_PATTERN = /\d\s\d/;

/** Strips leading/trailing parentheses and +/- signs for amount analysis */
export const AMOUNT_PREFIX_SUFFIX_PATTERN = /^[()+-]+|[()]+$/g;

/** PL locale: strip space and dot (thousands separators) */
export const PL_THOUSANDS_PATTERN = /[\s.]/g;

/** EN locale: strip comma and space (thousands separators) */
export const EN_THOUSANDS_PATTERN = /[,\s]/g;

/** Currency suffix (PLN, EUR, USD, GBP, CHF, CZK) */
export const CURRENCY_SUFFIX_PATTERN = /\s*(PLN|EUR|USD|GBP|CHF|CZK)\s*$/i;
