import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';

import { useImportWizard } from '../hooks/useImportWizard';

export const AnonymizationStepPlaceholder = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { handleNextStep, handlePrevStep } = useImportWizard();

  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t('import.anonymization.heading')}
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {t('import.anonymization.description')}
        </p>

        <div className="mt-5 flex h-64 items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2">
          <p className="text-[13px] text-muted-foreground">
            {t('import.anonymization.placeholder')}
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={handlePrevStep}>
          {t('import.nav.back')}
        </Button>
        <Button onClick={handleNextStep}>
          {t('import.upload.next')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
};
