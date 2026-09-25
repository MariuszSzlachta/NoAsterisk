import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SidebarLogo } from '#app/layouts/Sidebar/SidebarLogo/SidebarLogo';
import { productIdentity } from '#shared/config/product-identity/product-identity';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: () => productIdentity.name }),
}));

describe('SidebarLogo', () => {
  it('renders the canonical mark as decorative and the name as text', () => {
    const { container } = render(<SidebarLogo />);

    expect(screen.getByText(productIdentity.name)).toBeInTheDocument();
    const mark = container.querySelector('img');
    expect(mark).toHaveAttribute('src', productIdentity.markPath);
    expect(mark).toHaveAttribute('alt', '');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
  });
});
