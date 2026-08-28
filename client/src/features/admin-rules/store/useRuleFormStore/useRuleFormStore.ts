import { create } from 'zustand';

interface RuleFormState {
  readonly showForm: boolean;
  readonly editingRuleId: string | undefined;
  readonly openAddForm: () => void;
  readonly openEditForm: (id: string) => void;
  readonly closeForm: () => void;
}

export const useRuleFormStore = create<RuleFormState>((set) => ({
  showForm: false,
  editingRuleId: undefined,
  openAddForm: () => set({ showForm: true, editingRuleId: undefined }),
  openEditForm: (id) => set({ showForm: true, editingRuleId: id }),
  closeForm: () => set({ showForm: false, editingRuleId: undefined }),
}));
