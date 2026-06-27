import type { Meta, StoryObj } from '@storybook/react';
import { Info } from 'lucide-react';

import { Tooltip } from '#shared/ui/Tooltip/Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'shared/ui/Tooltip',
  component: Tooltip,
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-16">
      <span className="text-sm text-foreground">Saldo</span>
      <Tooltip content="Suma wszystkich środków na kontach.">
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};

export const PlacementBottom: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-16">
      <span className="text-sm text-foreground">Saldo</span>
      <Tooltip content="Tooltip poniżej elementu." placement="bottom">
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};

export const PlacementLeft: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-2 p-16">
      <Tooltip content="Tooltip po lewej stronie." placement="left">
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};

export const PlacementRight: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-16">
      <Tooltip content="Tooltip po prawej stronie." placement="right">
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-16">
      <span className="text-sm text-foreground">Wydatki</span>
      <Tooltip content="Suma wydatków w bieżącym miesiącu. Wzrost oznacza większe wydatki niż w poprzednim okresie rozliczeniowym.">
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};

export const EdgeCaseTopOfScreen: Story = {
  render: () => (
    <div className="flex items-center gap-2 pt-0">
      <span className="text-sm text-foreground">Przy górnej krawędzi</span>
      <Tooltip
        content="Auto-flip: jeśli u góry brak miejsca, pokaże się poniżej."
        placement="top"
      >
        <Info size={14} className="text-muted-foreground" />
      </Tooltip>
    </div>
  ),
};
