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

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Variants</h3>
        <div className="flex items-center gap-3">
          <Button variant="primary" icon={<PlusIcon />}>Primary</Button>
          <Button variant="secondary" icon={<SearchIcon />}>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Sizes</h3>
        <div className="flex items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" icon={<PlusIcon />} aria-label="Dodaj" />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">With Icons</h3>
        <div className="flex items-center gap-3">
          <Button icon={<PlusIcon />}>Importuj CSV</Button>
          <Button variant="secondary" icon={<SearchIcon />}>Szukaj</Button>
          <Button size="icon" variant="secondary" icon={<SearchIcon />} aria-label="Szukaj" />
        </div>
      </section>
    </div>
  ),
};
