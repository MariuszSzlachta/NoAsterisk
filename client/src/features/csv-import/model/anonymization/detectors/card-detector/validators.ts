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

export const hasCardPrefix = (digits: string): boolean => {
  const first = digits[0];
  const firstTwo = digits.slice(0, 2);
  const firstFour = digits.slice(0, 4);

  if (first === '4') {
    return true;
  }
  if (
    (firstTwo >= '51' && firstTwo <= '55') ||
    (firstFour >= '2221' && firstFour <= '2720')
  ) {
    return true;
  }
  if (first === '6' || firstTwo === '50') {
    return true;
  }
  if (firstTwo === '34' || firstTwo === '37') {
    return true;
  }

  return false;
};
