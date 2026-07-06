/**
 * Generates a new UUID v4 identifier.
 * Centralizes ID generation for all domain entities.
 */
export const generateId = (): string => crypto.randomUUID();
