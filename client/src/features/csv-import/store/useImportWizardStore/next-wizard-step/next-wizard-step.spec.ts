import { describe, expect, it } from 'vitest';

import { nextWizardStep } from '#features/csv-import/store/useImportWizardStore/next-wizard-step';

describe('nextWizardStep', () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const)('advances step %d to %d', (current, expected) => {
    expect(nextWizardStep(current)).toBe(expected);
  });

  it('does not advance past step 4', () => {
    expect(nextWizardStep(4)).toBe(4);
  });
});
