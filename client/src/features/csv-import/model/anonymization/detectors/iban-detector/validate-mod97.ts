export const validateMod97 = (iban: string): boolean => {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length < 15 || cleaned.length > 34) {
    return false;
  }

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numericStr = rearranged
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : c;
    })
    .join('');

  const chunkIndices = Array.from(
    { length: Math.ceil(numericStr.length / 7) },
    (_, i) => i * 7,
  );

  const remainder = chunkIndices.reduce(
    (rem, i) => parseInt(String(rem) + numericStr.slice(i, i + 7), 10) % 97,
    0,
  );

  return remainder === 1;
};
