import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DropdownMenu } from '#shared/ui/DropdownMenu';

describe('DropdownMenu', () => {
  const defaultItems = [
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn(), variant: 'danger' },
  ];

  describe('rendering', () => {
    it('renders trigger button', () => {
      render(<DropdownMenu items={defaultItems} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not show menu items initially', () => {
      render(<DropdownMenu items={defaultItems} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('shows menu items on trigger click', async () => {
      render(<DropdownMenu items={defaultItems} />);

      await userEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onClick and closes menu when item clicked', async () => {
      const onClick = vi.fn();
      render(<DropdownMenu items={[{ label: 'Edit', onClick }]} />);

      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Edit'));

      expect(onClick).toHaveBeenCalledOnce();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('does not call onClick on disabled item', async () => {
      const onClick = vi.fn();
      render(
        <DropdownMenu
          items={[{ label: 'Disabled', onClick, disabled: true }]}
        />,
      );

      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Disabled'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('closes menu on second trigger click', async () => {
      render(<DropdownMenu items={defaultItems} />);
      const trigger = screen.getByRole('button');

      await userEvent.click(trigger);
      expect(screen.getByText('Edit')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('separators', () => {
    it('renders separator between items', async () => {
      render(
        <DropdownMenu
          items={[
            { label: 'Edit', onClick: vi.fn() },
            { type: 'separator' },
            { label: 'Delete', onClick: vi.fn(), variant: 'danger' },
          ]}
        />,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });
});
