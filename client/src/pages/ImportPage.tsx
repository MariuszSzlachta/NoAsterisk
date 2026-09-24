import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Stepper } from '#shared/ui/Stepper';

import {
  AnonymizationStep,
  ColumnMappingStep,
  ImportConfirmStep,
  ImportPreviewGrid,
  UploadStepCard,
  useImportWizard,
  useImportWizardStore,
} from '#features/csv-import';

// ─── Constants ───────────────────────────────────────────────────

const WIZARD_STEP_KEYS = [
  'import.steps.file',
  'import.steps.columns',
  'import.steps.anonymization',
  'import.steps.preview',
  'import.steps.import',
];

// ─── Page ────────────────────────────────────────────────────────

export const ImportPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { step } = useImportWizard();

  // Security: clear PII from memory on route departure
  useEffect(() => () => {
    useImportWizardStore.getState().reset();
  }, []);

  const wizardSteps = WIZARD_STEP_KEYS.map((key) => ({ label: t(key) }));

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
      <div className="rounded-xl border border-border bg-surface px-6 py-4">
        <Stepper steps={wizardSteps} currentStep={step} />
      </div>

      {step === 0 && <UploadStepCard />}

      {step === 1 && <ColumnMappingStep />}

      {step === 2 && <AnonymizationStep />}

      {step === 3 && <ImportPreviewGrid />}

      {step === 4 && <ImportConfirmStep />}
    </div>
  );
};
