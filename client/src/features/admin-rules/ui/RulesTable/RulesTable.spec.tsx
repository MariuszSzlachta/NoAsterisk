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
  { id: 'r1', keyword: 'BIEDRONKA', matcherType: 'Contains', matcherLabel: 'Zawiera', categoryId: 'c1', categoryLabel: 'Spożywcze', categoryColor: '#4ade80', priority: 5, createdAt: '2026-01-01' },
  { id: 'r2', keyword: 'UBER', matcherType: 'Exact', matcherLabel: 'Dokładnie', categoryId: 'c2', categoryLabel: 'Transport', categoryColor: '#f59e0b', priority: 10, createdAt: '2026-01-02' },
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

    expect(screen.getByText('BIEDRONKA')).toBeInTheDocument();
    expect(screen.getByText('UBER')).toBeInTheDocument();
  });

  it('renders matcher labels', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getByText('Zawiera')).toBeInTheDocument();
    expect(screen.getByText('Dokładnie')).toBeInTheDocument();
  });

  it('renders category labels', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getByText('Spożywcze')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('renders priority values', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    expect(screen.getByText('rules.columns.keyword')).toBeInTheDocument();
    expect(screen.getByText('rules.columns.matcher')).toBeInTheDocument();
    expect(screen.getByText('rules.columns.category')).toBeInTheDocument();
    expect(screen.getByText('rules.columns.priority')).toBeInTheDocument();
    expect(screen.getByText('rules.columns.actions')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<RulesTable onEdit={onEdit} />);

    const editButtons = screen.getAllByRole('button', { name: /rules\.actions\.edit/ });
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith('r1');
  });

  it('calls handleDelete when delete button clicked', () => {
    render(<RulesTable onEdit={vi.fn()} />);

    const deleteButtons = screen.getAllByRole('button', { name: /rules\.actions\.delete/ });
    fireEvent.click(deleteButtons[1]);

    expect(mockHandleDelete).toHaveBeenCalledWith('r2');
  });
});
