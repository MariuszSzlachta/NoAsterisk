export const validateLuhn = (digits: string): boolean => {
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  const sum = Array.from(digits)
    .reverse()
    .reduce((acc, char, idx) => {
      const n = parseInt(char, 10);
      if (idx % 2 === 0) {
        return acc + n;
      }
      const doubled = n * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }, 0);

  return sum % 10 === 0;
};
