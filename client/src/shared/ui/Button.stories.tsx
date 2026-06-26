import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '#shared/ui/Button';

const PlusIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SearchIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'shared/ui/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
    icon: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Importuj CSV' } };
export const Secondary: Story = { args: { children: 'Czerwiec 2026', variant: 'secondary' } };
export const Ghost: Story = { args: { children: 'Anuluj', variant: 'ghost' } };
export const Destructive: Story = { args: { children: 'Usuń', variant: 'destructive' } };

export const WithIcon: Story = { args: { children: 'Importuj CSV', icon: <PlusIcon /> } };
export const IconOnly: Story = { args: { icon: <SearchIcon />, size: 'icon', variant: 'secondary', 'aria-label': 'Szukaj' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" icon={<PlusIcon />} aria-label="Dodaj" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="primary" icon={<PlusIcon />}>Primary</Button>
      <Button variant="secondary" icon={<SearchIcon />}>Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
