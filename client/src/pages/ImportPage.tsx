import { useTranslation } from 'react-i18next';

import { Stepper } from '#shared/ui/Stepper';

import {
  AnonymizationStep,
  ColumnMappingStep,
  ImportConfirmStep,
  ImportPreviewGrid,
  UploadStepCard,
  useImportWizard,
} from '#features/csv-import';

export const ImportPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { step } = useImportWizard();

  const wizardSteps = [
    { label: t('import.steps.file') },
    { label: t('import.steps.columns') },
    { label: t('import.steps.anonymization') },
    { label: t('import.steps.preview') },
    { label: t('import.steps.import') },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
