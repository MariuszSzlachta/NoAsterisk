import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react';

import { AppShell } from '#app/layouts/AppShell/AppShell';
import { ThemeProvider } from '#app/providers/ThemeProvider';

const SampleContent = (): React.JSX.Element => (
  <div className="rounded-lg border border-border bg-surface p-6">
    <h2 className="text-lg font-semibold text-foreground">Page Content</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      This area renders the route Outlet.
    </p>
  </div>
);

const meta: Meta<typeof AppShell> = {
  title: 'app/layouts/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <Routes>
            <Route element={<Story />}>
              <Route path="/dashboard" element={<SampleContent />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppShell>;

export const Showcase: Story = {};
