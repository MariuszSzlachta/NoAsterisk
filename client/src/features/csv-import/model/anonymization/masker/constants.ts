// Name masking: cap bullet count per word to prevent absurdly long masks for long surnames
export const NAME_MAX_BULLET_LENGTH = 6;

// Card masking: if extracted digits ≥ this count, show first4+last4; below = already-masked short pattern
export const CARD_MIN_DIGITS_FOR_FULL_MASK = 8;
