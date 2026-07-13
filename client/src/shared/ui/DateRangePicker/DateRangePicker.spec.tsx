import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateRangePicker } from './DateRangePicker';
import { DEFAULT_PRESETS } from './presets';

describe('DateRangePicker', () => {
  it('renders trigger button with placeholder when no selection', () => {
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);
    expect(screen.getByRole('button')).toHaveTextContent('Wybierz zakres dat');
  });

  it('renders custom placeholder', () => {
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} placeholder="Pick dates" />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick dates');
  });

  it('displays formatted date range when selected', () => {
    const handleSelect = vi.fn();
    const selected = {
      from: new Date(2026, 6, 1),
      to: new Date(2026, 6, 10),
    };
    render(<DateRangePicker selected={selected} onSelect={handleSelect} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('1 lip 2026');
    expect(button).toHaveTextContent('10 lip 2026');
  });

  it('displays only from-date when to is undefined', () => {
    const handleSelect = vi.fn();
    const selected = { from: new Date(2026, 0, 15) };
    render(<DateRangePicker selected={selected} onSelect={handleSelect} />);
    expect(screen.getByRole('button')).toHaveTextContent('15 sty 2026');
  });

  it('opens popover with calendar on click', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('pon')).toBeInTheDocument();
  });

  it('shows preset buttons in popover', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Ostatni tydzień')).toBeInTheDocument();
    expect(screen.getByText('Ostatni miesiąc')).toBeInTheDocument();
    expect(screen.getByText('Ostatnie 3 miesiące')).toBeInTheDocument();
  });

  it('calls onSelect and closes popover when preset is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Ostatni tydzień'));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const range = handleSelect.mock.calls[0][0];
    expect(range.from).toBeInstanceOf(Date);
    expect(range.to).toBeInstanceOf(Date);
  });

  it('shows confirm button disabled until range is complete', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));

    const confirmBtn = screen.getByRole('button', { name: /zastosuj/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('does not call onSelect on calendar click (only on confirm)', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));

    // Click a day — should NOT call onSelect yet
    const dayButtons = screen.getAllByRole('gridcell')
      .map((cell) => cell.querySelector('button'))
      .filter(Boolean);

    if (dayButtons[0]) {
      await user.click(dayButtons[0]);
    }

    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('renders disabled state', () => {
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className to trigger', () => {
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} className="w-64" />);
    expect(screen.getByRole('button')).toHaveClass('w-64');
  });

  it('renders without presets when empty array passed', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} presets={[]} />);

    await user.click(screen.getByRole('button'));

    expect(screen.queryByText('Ostatni tydzień')).not.toBeInTheDocument();
  });

  it('shows helper text when no draft selected', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<DateRangePicker onSelect={handleSelect} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Kliknij datę początkową')).toBeInTheDocument();
  });
});

describe('DEFAULT_PRESETS', () => {
  it('has 3 presets', () => {
    expect(DEFAULT_PRESETS).toHaveLength(3);
  });

  it('each preset returns valid DateRange with from <= to', () => {
    for (const preset of DEFAULT_PRESETS) {
      const range = preset.range();
      expect(range.from).toBeInstanceOf(Date);
      expect(range.to).toBeInstanceOf(Date);
      expect(range.from!.getTime()).toBeLessThanOrEqual(range.to!.getTime());
    }
  });
});
