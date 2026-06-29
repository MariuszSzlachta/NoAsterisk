import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilterTabs, type FilterTab } from './FilterTabs';

const TABS: FilterTab[] = [
  { id: 'all', label: 'Wszystkie', count: 245 },
  { id: 'errors', label: 'Błędy', count: 3 },
  { id: 'duplicates', label: 'Duplikaty', count: 7 },
  { id: 'uncategorized', label: 'Do kategoryzacji', count: 12 },
];

describe('FilterTabs', () => {
  it('renders all tabs', () => {
    render(<FilterTabs tabs={TABS} activeTab="all" onTabChange={() => {}} />);

    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('shows labels and counts', () => {
    render(<FilterTabs tabs={TABS} activeTab="all" onTabChange={() => {}} />);

    expect(screen.getByText('Wszystkie')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
    expect(screen.getByText('Błędy')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected', () => {
    render(<FilterTabs tabs={TABS} activeTab="errors" onTabChange={() => {}} />);

    const activeTab = screen.getByRole('tab', { name: /Błędy/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onTabChange when tab clicked', async () => {
    const handleChange = vi.fn();
    render(<FilterTabs tabs={TABS} activeTab="all" onTabChange={handleChange} />);

    await userEvent.click(screen.getByRole('tab', { name: /Duplikaty/i }));

    expect(handleChange).toHaveBeenCalledWith('duplicates');
  });

  it('renders tablist role', () => {
    render(<FilterTabs tabs={TABS} activeTab="all" onTabChange={() => {}} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
