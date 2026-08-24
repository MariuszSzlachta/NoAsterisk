import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDictionariesTab } from './useDictionariesTab';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useDictionariesTab', () => {
  describe('initial state', () => {
    it('starts with firstNames as active type', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.activeType).toBe('firstNames');
    });

    it('starts on page 1', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.currentPage).toBe(1);
    });

    it('starts with empty search', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.searchQuery).toBe('');
    });

    it('starts with modals closed', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.showAddModal).toBe(false);
      expect(result.current.showBulkModal).toBe(false);
    });

    it('returns 5 subTabs with translated labels', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.subTabs).toHaveLength(5);
      expect(result.current.subTabs[0].id).toBe('firstNames');
      expect(result.current.subTabs[0].label).toBe('admin.dictTypes.firstNames');
    });
  });

  describe('pagination', () => {
    it('computes totalPages based on entries count / PAGE_SIZE (21)', () => {
      const { result } = renderHook(() => useDictionariesTab());

      // firstNames has 2000 entries, PAGE_SIZE = 21 → ceil(2000/21) = 96
      expect(result.current.totalPages).toBe(96);
    });

    it('generates entries for current page', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.entries).toHaveLength(21);
      expect(result.current.entries[0].id).toBe('firstNames-0');
    });

    it('navigates to next page', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleNextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.entries[0].id).toBe('firstNames-21');
    });

    it('navigates to previous page', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleNextPage();
      });
      act(() => {
        result.current.handlePrevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('does not go below page 1', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handlePrevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('computes displayRange correctly', () => {
      const { result } = renderHook(() => useDictionariesTab());

      expect(result.current.displayRange).toBe('1–21');
    });
  });

  describe('tab switching', () => {
    it('changes active type', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleSubTabChange('cities');
      });

      expect(result.current.activeType).toBe('cities');
    });

    it('resets page to 1 on tab switch', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleNextPage();
      });
      act(() => {
        result.current.handleSubTabChange('surnames');
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('resets search on tab switch', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleSearchChange({ target: { value: 'test' } } as React.ChangeEvent<HTMLInputElement>);
      });
      act(() => {
        result.current.handleSubTabChange('merchants');
      });

      expect(result.current.searchQuery).toBe('');
    });

    it('updates totalEntries for new type', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleSubTabChange('phrases');
      });

      expect(result.current.totalEntries).toBe(200);
    });
  });

  describe('search', () => {
    it('updates search query', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleSearchChange({ target: { value: 'Jan' } } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.searchQuery).toBe('Jan');
    });

    it('resets to page 1 on search', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => {
        result.current.handleNextPage();
      });
      act(() => {
        result.current.handleSearchChange({ target: { value: 'x' } } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('modals', () => {
    it('opens and closes add modal', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => { result.current.handleOpenAdd(); });
      expect(result.current.showAddModal).toBe(true);

      act(() => { result.current.handleCloseAdd(); });
      expect(result.current.showAddModal).toBe(false);
    });

    it('opens and closes bulk modal', () => {
      const { result } = renderHook(() => useDictionariesTab());

      act(() => { result.current.handleOpenBulk(); });
      expect(result.current.showBulkModal).toBe(true);

      act(() => { result.current.handleCloseBulk(); });
      expect(result.current.showBulkModal).toBe(false);
    });
  });
});
