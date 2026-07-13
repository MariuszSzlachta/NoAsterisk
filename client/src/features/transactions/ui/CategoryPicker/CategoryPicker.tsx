import { Search, Tag } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from '@radix-ui/react-popover';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import type { CategoryInfo } from '#features/transactions/model/types';

import { useCategoryPicker } from '../hooks/useCategoryPicker';

// ─── Types ───────────────────────────────────────────────────────

interface CategoryPickerProps {
  readonly categories: ReadonlyArray<CategoryInfo>;
  readonly onSelect: (categoryId: string) => void;
  readonly selectionCount: number;
  readonly disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export const CategoryPicker = ({
  categories,
  onSelect,
  selectionCount,
  disabled = false,
}: CategoryPickerProps): React.JSX.Element => {
  const {
    open,
    filtered,
    search,
    handleOpenChange,
    handleCategorySelect,
    handleSearchChange,
  } = useCategoryPicker({ categories, onSelect });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" disabled={disabled}>
          <Tag size={14} />
          Zmień kategorię ({selectionCount})
        </Button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          align="end"
          sideOffset={4}
          className="z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-card"
        >
          <div className="mb-2">
            <Input
              placeholder="Szukaj kategorii…"
              icon={<Search size={12} />}
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {filtered.map((category) => (
              <button
                key={category.id}
                type="button"
                data-category-id={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-surface-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="px-2 py-1.5 text-xs text-muted-foreground">
                Brak wyników
              </span>
            )}
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
};
