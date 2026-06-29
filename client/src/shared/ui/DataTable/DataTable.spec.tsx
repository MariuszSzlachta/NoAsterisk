import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  date: string;
  title: string;
  amount: number;
  [key: string]: unknown;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'date', header: 'Data' },
  { key: 'title', header: 'Tytuł' },
  { key: 'amount', header: 'Kwota', render: (row) => `${row.amount} zł` },
];

const DATA: Row[] = [
  { id: '1', date: '2026-06-26', title: 'BIEDRONKA', amount: -87.43 },
  { id: '2', date: '2026-06-25', title: 'BOLT', amount: -34.2 },
  { id: '3', date: '2026-06-20', title: 'WYNAGRODZENIE', amount: 8500 },
];

describe('DataTable', () => {
  it('renders headers', () => {
    render(<DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />);

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Tytuł')).toBeInTheDocument();
    expect(screen.getByText('Kwota')).toBeInTheDocument();
  });

  it('renders rows with data', () => {
    render(<DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />);

    expect(screen.getByText('BIEDRONKA')).toBeInTheDocument();
    expect(screen.getByText('2026-06-26')).toBeInTheDocument();
    expect(screen.getByText('-87.43 zł')).toBeInTheDocument();
  });

  it('renders custom cell via render function', () => {
    render(<DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />);

    expect(screen.getByText('8500 zł')).toBeInTheDocument();
  });

  it('shows checkboxes when selectable', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        rowKey={(r) => r.id}
        selectable
      />,
    );

    // 1 select-all + 3 row checkboxes
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('calls onSelectionChange when row checkbox clicked', async () => {
    const handleChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        rowKey={(r) => r.id}
        selectable
        selectedKeys={new Set()}
        onSelectionChange={handleChange}
      />,
    );

    await userEvent.click(screen.getByLabelText('Zaznacz wiersz 1'));

    expect(handleChange).toHaveBeenCalledWith(new Set(['1']));
  });

  it('select-all toggles all rows', async () => {
    const handleChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        data={DATA}
        rowKey={(r) => r.id}
        selectable
        selectedKeys={new Set()}
        onSelectionChange={handleChange}
      />,
    );

    await userEvent.click(screen.getByLabelText('Zaznacz wszystkie'));

    expect(handleChange).toHaveBeenCalledWith(new Set(['1', '2', '3']));
  });

  it('does not show checkboxes when not selectable', () => {
    render(<DataTable columns={COLUMNS} data={DATA} rowKey={(r) => r.id} />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
