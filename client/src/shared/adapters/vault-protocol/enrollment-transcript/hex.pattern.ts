// "$" permits a final line terminator, which can hide a missing hex digit at a fixed-length boundary.
export const enrollmentHexPattern = /^[0-9a-f]+(?![\s\S])/;
