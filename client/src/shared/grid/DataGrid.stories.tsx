import type { Meta, StoryObj } from '@storybook/react';

import { DataGrid } from '#shared/grid';
import type { GridColumn } from '#shared/grid';
import { Badge } from '#shared/ui/Badge';

interface TransactionRow {
  id: string;
  date: string;
  merchant: string;
  category: string;
  categoryColor: 'income' | 'expense' | 'blue' | 'purple' | 'amber' | 'neutral';
  account: string;
  amount: number;
}

const SAMPLE_TRANSACTIONS: TransactionRow[] = [
  { id: '1', date: '26.06', merchant: 'BIEDRONKA', category: 'Zakupy', categoryColor: 'income', account: 'Osobiste', amount: -87.43 },
  { id: '2', date: '26.06', merchant: 'BOLT', category: 'Transport', categoryColor: 'blue', account: 'Osobiste', amount: -34.20 },
  { id: '3', date: '25.06', merchant: 'SPOTIFY', category: 'Subskrypcje', categoryColor: 'purple', account: 'Osobiste', amount: -23.99 },
  { id: '4', date: '25.06', merchant: 'ŻABKA', category: 'Zakupy', categoryColor: 'income', account: 'Osobiste', amount: -23.90 },
  { id: '5', date: '24.06', merchant: 'ORLEN', category: 'Transport', categoryColor: 'blue', account: 'Wspólne', amount: -250.00 },
  { id: '6', date: '24.06', merchant: 'ALLEGRO', category: 'Rozrywka', categoryColor: 'expense', account: 'Osobiste', amount: -149.00 },
  { id: '7', date: '23.06', merchant: 'NETFLIX', category: 'Subskrypcje', categoryColor: 'purple', account: 'Wspólne', amount: -43.00 },
  { id: '8', date: '20.06', merchant: 'PRACODAWCA SP. Z O.O.', category: 'Przychód', categoryColor: 'income', account: 'Osobiste', amount: 8500.00 },
];

const columns: GridColumn<TransactionRow>[] = [
  { field: 'date', headerName: 'Data', width: 90 },
  { field: 'merchant', headerName: 'Opis', flex: 1 },
  {
    field: 'category',
    headerName: 'Kategoria',
    width: 140,
    cellRenderer: ({ data }) => (
      <Badge color={data.categoryColor} variant="soft">{data.category}</Badge>
    ),
  },
  { field: 'account', headerName: 'Konto', width: 120 },
  {
    field: 'amount',
    headerName: 'Kwota',
    width: 130,
    cellRenderer: ({ data }) => {
      const isIncome = data.amount > 0;
      const formatted = `${isIncome ? '+' : '−'}${Math.abs(data.amount).toFixed(2).replace('.', ',')} zł`;
      return (
        <span className={`font-mono tabular-nums ${isIncome ? 'text-income' : 'text-foreground'}`}>
          {formatted}
        </span>
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
    <div className="h-[400px]">
      <DataGrid
        rows={SAMPLE_TRANSACTIONS}
        columns={columns}
        getRowId={(row) => row.id}
        rowSelection="multiple"
        onSelectionChange={(ids) => console.log('Selected:', ids)}
        onCellEdit={(rowId, field, value) => console.log('Edit:', rowId, field, value)}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="h-[300px]">
      <DataGrid
        rows={[]}
        columns={columns}
        getRowId={(row) => row.id}
        loading
      />
    </div>
  ),
};
