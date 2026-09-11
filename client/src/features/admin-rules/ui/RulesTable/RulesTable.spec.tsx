import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RuleViewModel } from '#features/admin-rules/model/types';

import { RulesTable } from './RulesTable';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockHandleDelete = vi.fn();

const MOCK_RULES: RuleViewModel[] = [
  {
    id: 'r1',
    keyword: 'BIEDRONKA',
    matcherType: 'Contains',
    matcherLabel: 'Zawiera',
    categoryId: 'c1',
    categoryLabel: 'Spożywcze',
    categoryColor: '#4ade80',
    priority: 5,
    createdAt: '2026-01-01',
  },
  {
    id: 'r2',
    keyword: 'UBER',
    matcherType: 'Exact',
    matcherLabel: 'Dokładnie',
    categoryId: 'c2',
    categoryLabel: 'Transport',
    categoryColor: '#f59e0b',
    priority: 10,
    createdAt: '2026-01-02',
  },
];

vi.mock('#features/admin-rules/ui/hooks/useRulesTable', () => ({
  useRulesTable: () => ({
    rules: MOCK_RULES,
    handleDelete: mockHandleDelete,
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('RulesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with rules data', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getAllByText('BIEDRONKA')).toHaveLength(2);
    expect(screen.getAllByText('UBER')).toHaveLength(2);
  });

  it('renders matcher labels', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getAllByText('Zawiera')).toHaveLength(2);
    expect(screen.getAllByText('Dokładnie')).toHaveLength(2);
  });

  it('renders category labels', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getAllByText('Spożywcze')).toHaveLength(2);
    expect(screen.getAllByText('Transport')).toHaveLength(2);
  });

  it('renders priority values', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getAllByText('5')).toHaveLength(2);
    expect(screen.getAllByText('10')).toHaveLength(2);
  });

  it('renders column headers', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getByText('rules.columns.keyword')).toBeInTheDocument();
    expect(screen.getByText('rules.columns.matcher')).toBeInTheDocument();
    expect(screen.getAllByText('rules.columns.category')).toHaveLength(3);
    expect(screen.getAllByText('rules.columns.priority')).toHaveLength(3);
    expect(screen.getByText('rules.columns.actions')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<RulesTable onEdit={onEdit} />);

    const editButtons = screen.getAllByRole('button', {
      name: /rules\.actions\.edit/,
    });
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith('r1');
  });

  it('opens confirmation before deleting a rule', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    const deleteButtons = screen.getAllByRole('button', {
      name: /rules\.actions\.delete/,
    });
    fireEvent.click(deleteButtons[3]);

    expect(mockHandleDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('rules.deleteConfirmTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'admin.modal.delete' }));

    expect(mockHandleDelete).toHaveBeenCalledWith('r2');
  });

  it('renders mobile rule cards with category, priority and actions', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getAllByText('rules.columns.category')).toHaveLength(3);
    expect(screen.getAllByText('rules.columns.priority')).toHaveLength(3);
    expect(
      screen.getAllByRole('button', { name: /rules\.actions\.edit/ }),
    ).toHaveLength(4);
    expect(
      screen.getAllByRole('button', { name: /rules\.actions\.delete/ }),
    ).toHaveLength(4);
  });
});
