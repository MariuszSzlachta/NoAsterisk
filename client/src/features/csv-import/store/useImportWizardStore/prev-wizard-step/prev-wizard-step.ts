import type { WizardStep } from '#features/csv-import/model/types';

const MIN_STEP: WizardStep = 0;

const PREV_STEP: Record<WizardStep, WizardStep> = {
  0: 0,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
};

export const prevWizardStep = (current: WizardStep): WizardStep =>
  current > MIN_STEP ? PREV_STEP[current] : current;
