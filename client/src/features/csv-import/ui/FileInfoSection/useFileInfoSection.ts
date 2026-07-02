import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { detectBankFromHeaders } from '#features/csv-import/model/bank-detector';

import { formatFileSize, formatSeparator } from './format-helpers';

interface FileInfoSectionResult {
  readonly fileName: string;
  readonly fileSize: string;
  readonly rowCount: number;
  readonly encoding: string;
  readonly separator: string;
  readonly detectedBank: string | undefined;
  readonly handleReset: () => void;
  readonly handleUseProfile: () => void;
  readonly handleCustomize: () => void;
}

export const useFileInfoSection = (): FileInfoSectionResult => {
  const file = useImportWizardStore((s) => s.file);
  const parsedData = useImportWizardStore((s) => s.parsedData);
  const reset = useImportWizardStore((s) => s.reset);
  const nextStep = useImportWizardStore((s) => s.nextStep);

  const detectedBank = parsedData
    ? detectBankFromHeaders(parsedData.headers)
    : undefined;

  const handleReset = (): void => {
    reset();
  };

  // TODO: handleUseProfile should apply detected bank profile mapping before advancing
  const handleUseProfile = (): void => {
    nextStep();
  };

  const handleCustomize = (): void => {
    nextStep();
  };

  return {
    fileName: file?.name ?? '',
    fileSize: file ? formatFileSize(file.size) : '',
    rowCount: parsedData?.rowCount ?? 0,
    encoding: parsedData?.encoding ?? '',
    separator: parsedData?.separator ? formatSeparator(parsedData.separator) : '',
    detectedBank,
    handleReset,
    handleUseProfile,
    handleCustomize,
  };
};
