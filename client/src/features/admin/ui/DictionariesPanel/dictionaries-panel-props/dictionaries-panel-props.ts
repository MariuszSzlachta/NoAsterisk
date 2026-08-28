import type { DictionaryDisplayItem } from '#features/admin/ui/DictionariesPanel/dictionary-display-item';

export interface DictionariesPanelProps {
  readonly items: readonly DictionaryDisplayItem[];
  readonly onManage: (tabId: string) => void;
  readonly targetTab: string;
}
