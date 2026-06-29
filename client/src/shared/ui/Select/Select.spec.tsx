import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select, type SelectOption } from './Select';

const OPTIONS: SelectOption[] = [
  { value: 'date', label: 'Data' },
  { value: 'title', label: 'Tytuł operacji' },
  { value: 'amount', label: 'Kwota' },
];

describe('Select', () => {
  it('renders placeholder when no value selected', () => {
    render(
      <Select
        options={OPTIONS}
        onChange={() => {}}
        placeholder="Wybierz pole"
      />,
    );

    expect(screen.getByText('Wybierz pole')).toBeInTheDocument();
  });

  it('renders selected option label', () => {
    render(<Select options={OPTIONS} value="title" onChange={() => {}} />);

    expect(screen.getByText('Tytuł operacji')).toBeInTheDocument();
  });

  it('opens listbox on click', async () => {
    render(<Select options={OPTIONS} onChange={() => {}} />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('calls onChange when option clicked', async () => {
    const handleChange = vi.fn();
    render(<Select options={OPTIONS} onChange={handleChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Kwota' }));

    expect(handleChange).toHaveBeenCalledWith('amount');
  });

  it('closes listbox after selection', async () => {
    render(<Select options={OPTIONS} onChange={() => {}} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Data' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    const handleChange = vi.fn();
    render(<Select options={OPTIONS} onChange={handleChange} />);

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(handleChange).toHaveBeenCalledWith('title');
  });

  it('closes on Escape', async () => {
    render(<Select options={OPTIONS} onChange={() => {}} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows dot indicator when showDot is true and value selected', () => {
    const { container } = render(
      <Select options={OPTIONS} value="date" onChange={() => {}} showDot />,
    );

    expect(
      container.querySelector('.rounded-full.bg-income'),
    ).toBeInTheDocument();
  });

  it('is disabled when disabled prop set', () => {
    render(<Select options={OPTIONS} onChange={() => {}} disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
