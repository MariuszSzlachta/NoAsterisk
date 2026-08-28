import type { WizardStep } from '#features/csv-import/model/types';

const MAX_STEP: WizardStep = 4;

const NEXT_STEP: Record<WizardStep, WizardStep> = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 4,
};

export const nextWizardStep = (current: WizardStep): WizardStep =>
  current < MAX_STEP ? NEXT_STEP[current] : current;
