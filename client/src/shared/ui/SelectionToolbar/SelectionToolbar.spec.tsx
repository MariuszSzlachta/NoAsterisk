import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SelectionToolbar } from '#shared/ui/SelectionToolbar';

describe('SelectionToolbar', () => {
  const defaultProps = {
    count: 3,
    onClear: vi.fn(),
    actions: [
      { label: 'Export', onClick: vi.fn() },
      { label: 'Delete', onClick: vi.fn(), variant: 'danger' },
    ],
  };

  describe('rendering', () => {
    it('renders nothing when count is 0', () => {
      const { container } = render(
        <SelectionToolbar {...defaultProps} count={0} />,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders toolbar when count > 0', () => {
      render(<SelectionToolbar {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('zaznaczono')).toBeInTheDocument();
    });

    it('renders all action buttons', () => {
      render(<SelectionToolbar {...defaultProps} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('renders custom label', () => {
      render(<SelectionToolbar {...defaultProps} label="selected" />);

      expect(screen.getByText('selected')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClear when close button clicked', async () => {
      const onClear = vi.fn();
      render(<SelectionToolbar {...defaultProps} onClear={onClear} />);

      const closeBtn = screen.getByRole('button', { name: '' });
      await userEvent.click(closeBtn);

      expect(onClear).toHaveBeenCalledOnce();
    });

    it('calls action onClick when action clicked', async () => {
      const onClick = vi.fn();
      render(
        <SelectionToolbar
          {...defaultProps}
          actions={[{ label: 'Export', onClick }]}
        />,
      );

      await userEvent.click(screen.getByText('Export'));

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick on disabled action', async () => {
      const onClick = vi.fn();
      render(
        <SelectionToolbar
          {...defaultProps}
          actions={[{ label: 'Disabled', onClick, disabled: true }]}
        />,
      );

      await userEvent.click(screen.getByText('Disabled'));

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
