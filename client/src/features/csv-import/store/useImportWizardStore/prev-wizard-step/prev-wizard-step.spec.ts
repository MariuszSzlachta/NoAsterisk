import { describe, expect, it } from 'vitest';

import { prevWizardStep } from '#features/csv-import/store/useImportWizardStore/prev-wizard-step';

describe('prevWizardStep', () => {
  it.each([
    [4, 3],
    [3, 2],
    [2, 1],
    [1, 0],
  ] as const)('moves step %d back to %d', (current, expected) => {
    expect(prevWizardStep(current)).toBe(expected);
  });

  it('does not go below step 0', () => {
    expect(prevWizardStep(0)).toBe(0);
  });
});
