import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrustedDeviceApproval } from './TrustedDeviceApproval';

vi.mock('#shared/hooks/useToast', () => ({
  useToast: () => vi.fn(),
}));

describe('TrustedDeviceApproval', () => {
  it('renders an explicit approval action and explanation', () => {
    render(<TrustedDeviceApproval />);
    expect(screen.getByText('settings.vault.trustedDeviceTitle')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent(
      'settings.vault.trustedDeviceApprove',
    );
  });
});
