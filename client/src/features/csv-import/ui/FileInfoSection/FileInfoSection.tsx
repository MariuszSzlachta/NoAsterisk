import { useTranslation } from 'react-i18next';
import { File, Hash, Landmark, List, Type } from 'lucide-react';

import { Button } from '#shared/ui/Button';

import { BankProfileBar } from '#features/csv-import/ui/BankProfileBar';
import { DetectionChip } from '#features/csv-import/ui/DetectionChip';

import { useFileInfoSection } from '#features/csv-import/ui/FileInfoSection/useFileInfoSection';

export const FileInfoSection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    fileName,
    fileSize,
    rowCount,
    encoding,
    separator,
    detectedBank,
    handleReset,
    handleUseProfile,
    handleCustomize,
  } = useFileInfoSection();

  return (
    <div className="mt-5 border-t border-border pt-5">
      {/* File row */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-surface-3">
          <File size={18} className="text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">{fileName}</p>
          <p className="font-mono text-[11.5px] text-subtle">
            {t('import.upload.rows', { count: rowCount })} · {fileSize}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          {t('import.upload.remove')}
        </Button>
      </div>

      {/* Detection chips */}
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
        {t('import.upload.detectedAuto')}
      </p>
      <div className="flex flex-wrap gap-2">
        <DetectionChip
          icon={<Type size={15} />}
          label={t('import.upload.chipEncoding')}
          value={encoding}
        />
        <DetectionChip
          icon={<List size={15} />}
          label={t('import.upload.chipSeparator')}
          value={separator}
        />
        <DetectionChip
          icon={<Hash size={15} />}
          label={t('import.upload.chipHeaders')}
          value={t('import.upload.chipHeadersValue')}
        />
        {detectedBank && (
          <DetectionChip
            icon={<Landmark size={15} />}
            label={t('import.upload.chipBank')}
            value={detectedBank}
            verified
          />
        )}
      </div>

      {/* Bank profile recognition bar */}
      {detectedBank && (
        <BankProfileBar
          bankName={detectedBank}
          onUseProfile={handleUseProfile}
          onCustomize={handleCustomize}
        />
      )}
    </div>
  );
};
