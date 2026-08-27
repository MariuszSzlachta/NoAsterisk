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
