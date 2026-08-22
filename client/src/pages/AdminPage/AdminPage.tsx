import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FilterTabs } from '#shared/ui/FilterTabs';

import { useAdminTabs } from './useAdminTabs';

// ─── Component ───────────────────────────────────────────────────

export const AdminPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { tabs, activeTab, handleTabChange, ActiveTabContent } = useAdminTabs();

  return (
    <div className="flex max-w-[1280px] flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          <Shield size={20} className="mr-2 inline-block text-primary" />
          {t('admin.pageTitle')}
        </h1>
      </div>

      <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <ActiveTabContent />
    </div>
  );
};
