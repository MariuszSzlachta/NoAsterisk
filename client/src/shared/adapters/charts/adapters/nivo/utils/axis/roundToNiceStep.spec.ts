import { roundToNiceStep } from './roundToNiceStep';

describe('roundToNiceStep', () => {
  it.each([
    [1, 1],
    [3, 5],
    [7, 10],
    [12, 20],
    [30, 50],
    [70, 100],
    [150, 200],
    [350, 500],
    [800, 1000],
    [0.3, 0.5],
    [0.7, 1],
  ])('rounds %d to %d', (input, expected) => {
    expect(roundToNiceStep(input)).toBe(expected);
  });
});
