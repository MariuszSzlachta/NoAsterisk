import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminDashboard, DictionariesTab, InviteCodesTab, UsersTab } from '#features/admin';
import type { FilterTab } from '#shared/ui/FilterTabs';

// ─── Types ───────────────────────────────────────────────────────

type AdminTabId = 'overview' | 'users' | 'codes' | 'dictionaries';
const ADMIN_TAB_IDS: readonly AdminTabId[] = [
  'overview',
  'users',
  'codes',
  'dictionaries',
];

const isAdminTabId = (value: string): value is AdminTabId =>
  ADMIN_TAB_IDS.some((tabId) => tabId === value);

interface UseAdminTabsResult {
  readonly tabs: readonly FilterTab[];
  readonly activeTab: string;
  readonly handleTabChange: (id: string) => void;
  readonly ActiveTabContent: () => React.JSX.Element;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAdminTabs = (): UseAdminTabsResult => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');

  const tabs: readonly FilterTab[] = [
    { id: 'overview', label: t('admin.tabs.overview') },
    { id: 'users', label: t('admin.tabs.users') },
    { id: 'codes', label: t('admin.tabs.codes') },
    { id: 'dictionaries', label: t('admin.tabs.dictionaries') },
  ];

  const handleTabChange = (id: string): void => {
    if (isAdminTabId(id)) {
      setActiveTab(id);
    }
  };

  // ─── Tab Content Renderer ──────────────────────────────────────

  const renderTab = (): React.JSX.Element => {
    if (activeTab === 'overview') {
      return <AdminDashboard onNavigateToTab={handleTabChange} />;
    }
    if (activeTab === 'users') {
      return <UsersTab />;
    }
    if (activeTab === 'codes') {
      return <InviteCodesTab />;
    }
    return <DictionariesTab />;
  };

  return { tabs, activeTab, handleTabChange, ActiveTabContent: renderTab };
};
