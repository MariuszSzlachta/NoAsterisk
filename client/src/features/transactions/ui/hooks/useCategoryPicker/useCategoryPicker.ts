import type { ChangeEvent } from 'react';
import { useState } from 'react';

import type { CategoryInfo } from '#entities/category';

// ─── Types ───────────────────────────────────────────────────────

interface UseCategoryPickerProps {
  readonly categories: ReadonlyArray<CategoryInfo>;
  readonly onSelect: (categoryId: string) => void;
}

interface UseCategoryPickerResult {
  readonly open: boolean;
  readonly filtered: ReadonlyArray<CategoryInfo>;
  readonly search: string;
  readonly handleOpenChange: (nextOpen: boolean) => void;
  readonly handleCategorySelect: (categoryId: string) => void;
  readonly handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useCategoryPicker = ({
  categories,
  onSelect,
}: UseCategoryPickerProps): UseCategoryPickerResult => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? categories.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const handleOpenChange = (nextOpen: boolean): void => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
    }
  };

  const handleCategorySelect = (categoryId: string): void => {
    onSelect(categoryId);
    setOpen(false);
    setSearch('');
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
  };

  return {
    open,
    filtered,
    search,
    handleOpenChange,
    handleCategorySelect,
    handleSearchChange,
  };
};
