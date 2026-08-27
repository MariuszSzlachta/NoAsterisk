import { ID_CONTEXT, ID_WEIGHTS } from './constants';

export const validateNationalId = (
  letters: string,
  digits: string,
): boolean => {
  if (letters.length !== 3 || digits.length !== 6) {
    return false;
  }

  const values = [
    ...Array.from(letters, (ch) => ch.charCodeAt(0) - 55),
    ...Array.from(digits, (ch) => parseInt(ch, 10)),
  ];

  const sum = ID_WEIGHTS.reduce((acc, weight, i) => {
    if (i === 3) {
      return acc;
    }
    const v = values[i];
    return v !== undefined ? acc + v * weight : acc;
  }, 0);

  const checkValue = values[3];
  return checkValue !== undefined && sum % 10 === checkValue;
};

export const hasIdContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return ID_CONTEXT.some((kw) => prefix.includes(kw));
};
