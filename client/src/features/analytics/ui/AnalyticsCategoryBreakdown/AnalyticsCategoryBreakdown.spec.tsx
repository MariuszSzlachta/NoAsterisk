import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryBreakdownFilters } from '#features/analytics/model/types';

import { AnalyticsCategoryBreakdown } from './AnalyticsCategoryBreakdown';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#shared/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ title }: { title: string }) => <h3>{title}</h3>,
}));

vi.mock('#shared/ui/QueryRenderer', () => ({
  QueryRenderer: ({ state, children }: { state: { status: string; data: unknown }; children: (data: unknown) => React.ReactNode }) => {
    if (state.status === 'loaded') return <>{children(state.data)}</>;
    return <div>Loading...</div>;
  },
}));

vi.mock('#features/analytics/ui/CategoryDrilldown', () => ({
  CategoryDrilldown: () => <div data-testid="drilldown">Drilldown</div>,
}));

const mockCreateHandler = vi.fn(() => vi.fn());
let mockData: unknown[] = [
  { categoryId: 'cat-groceries', category: 'Spożywcze', amount: 500, percentage: 50 },
  { categoryId: 'cat-transport', category: 'Transport', amount: 300, percentage: 30 },
];
let mockSelected: string | undefined = undefined;

vi.mock('#features/analytics/ui/hooks/useCategoryBreakdown', () => ({
  useCategoryBreakdown: () => ({
    state: { status: 'loaded', data: mockData },
    selectedCategory: mockSelected,
    createCategoryClickHandler: mockCreateHandler,
    handleDrilldownClose: vi.fn(),
  }),
}));

const filters: CategoryBreakdownFilters = {
  metric: 'expenses',
  period: '6m',
  granularity: 'monthly',
};

describe('AnalyticsCategoryBreakdown', () => {
  beforeEach(() => {
    mockData = [
      { categoryId: 'cat-groceries', category: 'Spożywcze', amount: 500, percentage: 50 },
      { categoryId: 'cat-transport', category: 'Transport', amount: 300, percentage: 30 },
    ];
    mockSelected = undefined;
  });

  it('renders expenses title', () => {
    render(<AnalyticsCategoryBreakdown filters={filters} />);
    expect(screen.getByText('analytics.breakdown.expensesTitle')).toBeInTheDocument();
  });

  it('renders income title when metric is income', () => {
    render(<AnalyticsCategoryBreakdown filters={{ ...filters, metric: 'income' }} />);
    expect(screen.getByText('analytics.breakdown.incomeTitle')).toBeInTheDocument();
  });

  it('renders category items', () => {
    render(<AnalyticsCategoryBreakdown filters={filters} />);
    expect(screen.getByText('Spożywcze')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('does not render drilldown when no category selected', () => {
    render(<AnalyticsCategoryBreakdown filters={filters} />);
    expect(screen.queryByTestId('drilldown')).not.toBeInTheDocument();
  });

  it('renders drilldown when category is selected', () => {
    mockSelected = 'Spożywcze';
    render(<AnalyticsCategoryBreakdown filters={filters} />);
    expect(screen.getByTestId('drilldown')).toBeInTheDocument();
  });

  it('renders empty state message when no data', () => {
    mockData = [];
    render(<AnalyticsCategoryBreakdown filters={filters} />);
    expect(screen.getByText('analytics.breakdown.noExpenses')).toBeInTheDocument();
  });

  it('renders income empty state message', () => {
    mockData = [];
    render(<AnalyticsCategoryBreakdown filters={{ ...filters, metric: 'income' }} />);
    expect(screen.getByText('analytics.breakdown.noIncome')).toBeInTheDocument();
  });
});
