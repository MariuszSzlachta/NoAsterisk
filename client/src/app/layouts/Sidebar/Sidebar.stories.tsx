import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { Sidebar } from '#app/layouts/Sidebar/Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'app/layouts/Sidebar',
  component: Sidebar,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/dashboard']}>
        <div className="h-screen">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Showcase: Story = {};
