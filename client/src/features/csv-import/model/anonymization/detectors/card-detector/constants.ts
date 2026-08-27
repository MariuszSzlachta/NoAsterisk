/** Checksum-validated full card number */
export const FULL_CARD_CONFIDENCE = 0.99;

/** Checksum-validated compact (no separators) card number */
export const COMPACT_CARD_CONFIDENCE = 0.97;

/** Bank-masked format implies card (no checksum possible) */
export const MASKED_CARD_CONFIDENCE = 0.92;
