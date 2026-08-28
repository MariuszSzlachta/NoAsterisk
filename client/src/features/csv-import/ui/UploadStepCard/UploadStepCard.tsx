import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { Button } from '#shared/ui/Button';
import { Dropzone } from '#shared/ui/Dropzone';

import { FileInfoSection } from '#features/csv-import/ui/FileInfoSection';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';

export const UploadStepCard = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { parseError, isFileLoaded, handleFileSelect, handleNextStep } =
    useImportWizard();

  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t('import.upload.heading')}
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {t('import.upload.description')}
        </p>

        <Dropzone
          onFileSelect={handleFileSelect}
          error={parseError}
          className="mt-5"
        />

        <div className="mt-3.5 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-income" />
          <span>{t('import.upload.securityNote')}</span>
        </div>

        {isFileLoaded && <FileInfoSection />}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNextStep} disabled={!isFileLoaded}>
          {t('import.upload.next')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
};
