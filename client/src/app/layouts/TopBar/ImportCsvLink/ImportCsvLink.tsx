import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const ImportCsvLink = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <Link
      to="/import"
      className="flex h-[38px] items-center gap-[7px] rounded-md bg-primary pl-3 pr-3.5 text-[13px] font-medium tracking-tight text-primary-foreground"
    >
      <Plus size={16} aria-hidden="true" />
      {t('topbar.importCsv')}
    </Link>
  );
};
