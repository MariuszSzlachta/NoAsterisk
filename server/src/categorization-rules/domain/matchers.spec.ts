import { ContainsMatcher, ExactMatcher } from '@categorization-rules/domain/matchers';

describe('ContainsMatcher', () => {
  const matcher = new ContainsMatcher();

  it.each([
    ['Zakupy BIEDRONKA ul. Kwiatowa', 'biedronka', true],
    ['BIEDRONKA', 'biedronka', true],
    ['biedronka', 'BIEDRONKA', true],
    ['Zakupy LIDL', 'biedronka', false],
    ['', 'biedronka', false],
    ['BIEDRONKA', '', false],
  ])('matches("%s", "%s") = %s', (description, keyword, expected) => {
    expect(matcher.matches(description, keyword)).toBe(expected);
  });
});

describe('ExactMatcher', () => {
  const matcher = new ExactMatcher();

  it.each([
    ['Netflix', 'netflix', true],
    ['NETFLIX', 'Netflix', true],
    ['netflix', 'netflix', true],
    ['Netflix subscription', 'Netflix', false],
    ['My Netflix', 'Netflix', false],
    ['', '', false],
  ])('matches("%s", "%s") = %s', (description, keyword, expected) => {
    expect(matcher.matches(description, keyword)).toBe(expected);
  });
});
