import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox aria-label="test" />);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders checked when checked prop is true', () => {
    render(<Checkbox checked onChange={() => {}} aria-label="test" />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('fires onChange when clicked', async () => {
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange} aria-label="test" />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(handleChange).toHaveBeenCalledOnce();
  });

  it('renders label text', () => {
    render(<Checkbox label="Accept terms" />);

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('supports indeterminate state', () => {
    render(<Checkbox indeterminate aria-label="select all" />);

    const checkbox = screen.getByRole('checkbox') satisfies HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Checkbox disabled aria-label="test" />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
