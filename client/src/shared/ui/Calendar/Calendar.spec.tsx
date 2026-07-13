import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from './Calendar';

describe('Calendar', () => {
  describe('single mode', () => {
    it('renders with Polish locale weekday headers', () => {
      const { container } = render(<Calendar mode="single" />);
      const weekdays = container.querySelectorAll('.rdp-weekday');
      expect(weekdays).toHaveLength(7);
      expect(weekdays[0]).toHaveTextContent('pon');
    });

    it('starts week on Monday', () => {
      const { container } = render(<Calendar mode="single" />);
      const weekdays = container.querySelectorAll('.rdp-weekday');
      expect(weekdays[0]).toHaveTextContent('pon');
      expect(weekdays[6]).toHaveTextContent('nie');
    });

    it('calls onSelect when a day is clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<Calendar mode="single" onSelect={handleSelect} />);

      const dayButtons = screen.getAllByRole('gridcell')
        .map((cell) => cell.querySelector('button'))
        .filter(Boolean);

      if (dayButtons[0]) {
        await user.click(dayButtons[0]);
        expect(handleSelect).toHaveBeenCalledTimes(1);
      }
    });

    it('applies custom className alongside budget-calendar', () => {
      const { container } = render(<Calendar mode="single" className="my-class" />);
      const root = container.querySelector('.rdp-root');
      expect(root).toHaveClass('budget-calendar');
      expect(root).toHaveClass('my-class');
    });

    it('does not produce trailing space when className is undefined', () => {
      const { container } = render(<Calendar mode="single" />);
      const root = container.querySelector('.rdp-root');
      const classAttr = root?.getAttribute('class') ?? '';
      expect(classAttr).not.toMatch(/\s$/);
    });

    it('renders with data-mode single', () => {
      const { container } = render(<Calendar mode="single" />);
      const root = container.querySelector('.rdp-root');
      expect(root).toHaveAttribute('data-mode', 'single');
    });
  });

  describe('range mode', () => {
    it('renders with data-mode range', () => {
      const { container } = render(<Calendar mode="range" />);
      const root = container.querySelector('.rdp-root');
      expect(root).toHaveAttribute('data-mode', 'range');
    });

    it('renders Polish locale in range mode', () => {
      const { container } = render(<Calendar mode="range" />);
      const weekdays = container.querySelectorAll('.rdp-weekday');
      expect(weekdays[0]).toHaveTextContent('pon');
    });

    it('calls onSelect when days are clicked', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();

      render(<Calendar mode="range" onSelect={handleSelect} />);

      const dayButtons = screen.getAllByRole('gridcell')
        .map((cell) => cell.querySelector('button'))
        .filter(Boolean);

      if (dayButtons[0]) {
        await user.click(dayButtons[0]);
        expect(handleSelect).toHaveBeenCalled();
      }
    });

    it('applies custom className', () => {
      const { container } = render(<Calendar mode="range" className="range-test" />);
      const root = container.querySelector('.rdp-root');
      expect(root).toHaveClass('budget-calendar');
      expect(root).toHaveClass('range-test');
    });
  });
});
