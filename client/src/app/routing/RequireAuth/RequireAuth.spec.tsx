import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequireAuth } from '#app/routing/RequireAuth';

const mockUseAuthBootstrap = vi.hoisted(() => vi.fn());

vi.mock('#app/routing/useAuthBootstrap', () => ({
  useAuthBootstrap: mockUseAuthBootstrap,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app shell skeleton while authentication is bootstrapping', () => {
    mockUseAuthBootstrap.mockReturnValue({
      isAuthenticated: false,
      isBootstrapped: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>protected content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('common.loading')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
