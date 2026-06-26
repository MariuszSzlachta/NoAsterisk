import type { Meta, StoryObj } from '@storybook/react';

import { DataGrid } from '#shared/grid';
import type { GridColumn } from '#shared/grid';
import { Badge } from '#shared/ui/Badge';

interface TransactionRow {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  category: string;
  categoryColor: 'income' | 'expense' | 'blue' | 'purple' | 'amber' | 'neutral';
  account: string;
  amount: number;
}

const ROW_HEIGHT = 46;

const formatAmount = (amount: number): string => {
  const abs = Math.abs(amount);
  const [integer, decimal] = abs.toFixed(2).split('.');
  const withSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const prefix = amount >= 0 ? '+' : '−';
  return `${prefix}${withSeparator},${decimal} zł`;
};

const SAMPLE_TRANSACTIONS: TransactionRow[] = [
  { id: '1', date: '26.06', title: 'BIEDRONKA', subtitle: 'Zakupy 1234 · Warszawa', category: 'Zakupy', categoryColor: 'income', account: 'Osobiste', amount: -87.43 },
  { id: '2', date: '26.06', title: 'BOLT', subtitle: 'Przejazd · 8,2 km', category: 'Transport', categoryColor: 'blue', account: 'Osobiste', amount: -34.20 },
  { id: '3', date: '25.06', title: 'SPOTIFY', subtitle: 'Premium · subskrypcja', category: 'Subskrypcje', categoryColor: 'purple', account: 'Osobiste', amount: -23.99 },
  { id: '4', date: '25.06', title: 'ŻABKA', subtitle: 'Z7821 · Kraków', category: 'Zakupy', categoryColor: 'income', account: 'Osobiste', amount: -23.90 },
  { id: '5', date: '24.06', title: 'ORLEN', subtitle: 'Stacja paliw · tankowanie', category: 'Transport', categoryColor: 'blue', account: 'Wspólne', amount: -250.00 },
  { id: '6', date: '24.06', title: 'ALLEGRO', subtitle: 'Zamówienie 88421', category: 'Rozrywka', categoryColor: 'expense', account: 'Osobiste', amount: -149.00 },
  { id: '7', date: '23.06', title: 'NETFLIX', subtitle: 'Standard · subskrypcja', category: 'Subskrypcje', categoryColor: 'purple', account: 'Wspólne', amount: -43.00 },
  { id: '8', date: '22.06', title: 'PGE OBRÓT', subtitle: 'Energia elektryczna', category: 'Rachunki', categoryColor: 'neutral', account: 'Wspólne', amount: -180.00 },
  { id: '9', date: '21.06', title: 'PIZZA DOMINIUM', subtitle: 'Zamówienie online', category: 'Jedzenie', categoryColor: 'amber', account: 'Osobiste', amount: -68.00 },
  { id: '10', date: '20.06', title: 'PRACODAWCA SP. Z O.O.', subtitle: 'Wynagrodzenie · czerwiec', category: 'Przychód', categoryColor: 'income', account: 'Osobiste', amount: 8500.00 },
  { id: '11', date: '19.06', title: 'ROSSMANN', subtitle: 'Drogeria · 4421', category: 'Zakupy', categoryColor: 'income', account: 'Osobiste', amount: -112.30 },
  { id: '12', date: '18.06', title: 'UPC POLSKA', subtitle: 'Internet · abonament', category: 'Rachunki', categoryColor: 'neutral', account: 'Wspólne', amount: -89.00 },
];

const columns: GridColumn<TransactionRow>[] = [
  {
    field: 'date',
    headerName: 'Data',
    width: 96,
    cellRenderer: ({ data }) => (
      <span className="font-mono text-[12.5px] tabular-nums text-muted-foreground">{data.date}</span>
    ),
  },
  {
    field: 'title',
    headerName: 'Opis',
    flex: 1,
    cellRenderer: ({ data }) => (
      <div className="flex flex-col justify-center">
        <span className="text-[13px] text-foreground">{data.title}</span>
        <span className="text-[11px] text-subtle">{data.subtitle}</span>
      </div>
    ),
  },
  {
    field: 'category',
    headerName: 'Kategoria',
    width: 150,
    cellRenderer: ({ data }) => (
      <Badge color={data.categoryColor} variant="soft">{data.category}</Badge>
    ),
  },
  {
    field: 'account',
    headerName: 'Konto',
    width: 130,
    cellRenderer: ({ data }) => (
      <span className="text-[12.5px] text-muted-foreground">{data.account}</span>
    ),
  },
  {
    field: 'amount',
    headerName: 'Kwota',
    width: 150,
    cellRenderer: ({ data }) => {
      const isIncome = data.amount > 0;
      return (
        <div className="flex w-full justify-end pr-2">
          <span className={`font-mono text-[13px] tabular-nums ${isIncome ? 'text-income' : 'text-foreground'}`}>
            {formatAmount(data.amount)}
          </span>
        </div>
      );
    },
  },
];

const meta: Meta = {
  title: 'shared/grid/DataGrid',
};

export default meta;
type Story = StoryObj;

export const Transactions: Story = {
  render: () => (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <DataGrid
        rows={SAMPLE_TRANSACTIONS}
        columns={columns}
        getRowId={(row) => row.id}
        rowSelection="multiple"
        rowHeight={ROW_HEIGHT}
        onSelectionChange={(ids) => console.log('Selected:', ids)}
      />
      <div className="flex h-10 items-center gap-[18px] border-t border-border bg-surface-2 px-4 text-xs text-subtle">
        <span><span className="font-mono font-medium text-foreground">245</span> transakcji</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          12 bez kategorii
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-expense" />
          3 możliwe dane osobowe
        </span>
        <div className="flex-1" />
        <span>
          Suma wydatków: <span className="font-mono font-medium text-expense">−6 240,18 zł</span>
        </span>
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="h-[300px] overflow-hidden rounded-lg border border-border shadow-card">
      <DataGrid
        rows={[]}
        columns={columns}
        getRowId={(row) => row.id}
        loading
        rowHeight={ROW_HEIGHT}
      />
    </div>
  ),
};
