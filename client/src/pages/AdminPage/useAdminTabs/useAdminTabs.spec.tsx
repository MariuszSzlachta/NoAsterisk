import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminTabs } from './useAdminTabs';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#features/admin', () => ({
  AdminDashboard: () => null,
  DictionariesTab: () => null,
  InviteCodesTab: () => null,
  UsersTab: () => null,
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useAdminTabs', () => {
  it('returns 4 tabs', () => {
    const { result } = renderHook(() => useAdminTabs());

    expect(result.current.tabs).toHaveLength(4);
    expect(result.current.tabs.map((t) => t.id)).toEqual(['overview', 'users', 'codes', 'dictionaries']);
  });

  it('starts with overview tab active', () => {
    const { result } = renderHook(() => useAdminTabs());

    expect(result.current.activeTab).toBe('overview');
  });

  it('changes active tab', () => {
    const { result } = renderHook(() => useAdminTabs());

    act(() => { result.current.handleTabChange('users'); });

    expect(result.current.activeTab).toBe('users');
  });

  it('renders overview content by default', () => {
    const { result } = renderHook(() => useAdminTabs());

    const Content = result.current.ActiveTabContent;
    expect(Content).toBeDefined();
  });

  it('renders different content for each tab', () => {
    const { result } = renderHook(() => useAdminTabs());

    const tabIds = ['overview', 'users', 'codes', 'dictionaries'];
    for (const tabId of tabIds) {
      act(() => { result.current.handleTabChange(tabId); });
      expect(result.current.ActiveTabContent).toBeDefined();
    }
  });

  it('tab labels use translation keys', () => {
    const { result } = renderHook(() => useAdminTabs());

    expect(result.current.tabs[0].label).toBe('admin.tabs.overview');
    expect(result.current.tabs[1].label).toBe('admin.tabs.users');
    expect(result.current.tabs[2].label).toBe('admin.tabs.codes');
    expect(result.current.tabs[3].label).toBe('admin.tabs.dictionaries');
  });
});
