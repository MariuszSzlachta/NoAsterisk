import { useTranslation } from 'react-i18next';

import { Dropzone } from '#shared/ui/Dropzone';
import { Stepper } from '#shared/ui/Stepper';

import {
  ColumnMappingStep,
  ImportPreviewGrid,
  useImportWizard,
} from '#features/csv-import';

export const ImportPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { step, parseError, handleFileSelect } = useImportWizard();

  const wizardSteps = [
    { label: t('import.steps.file') },
    { label: t('import.steps.columns') },
    { label: t('import.steps.preview') },
    { label: t('import.steps.import') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={wizardSteps} currentStep={step} />

      {step === 0 && (
        <Dropzone onFileSelect={handleFileSelect} error={parseError} />
      )}

      {step === 1 && <ColumnMappingStep />}

      {step === 2 && <ImportPreviewGrid />}

      {step === 3 && (
        <div className="text-center text-muted-foreground">
          <p>{t('import.confirm.placeholder')}</p>
        </div>
      )}
    </div>
  );
};
