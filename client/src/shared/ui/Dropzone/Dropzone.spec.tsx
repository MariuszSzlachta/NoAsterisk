import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dropzone } from './Dropzone';

const createFile = (name: string, sizeBytes: number): File => {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type: 'text/csv' });
};

describe('Dropzone', () => {
  it('renders upload instructions', () => {
    render(<Dropzone onFileSelect={() => {}} />);

    expect(screen.getByText('Przeciągnij i upuść plik CSV')).toBeInTheDocument();
    expect(screen.getByText('Wybierz plik')).toBeInTheDocument();
  });

  it('calls onFileSelect when file is selected via input', async () => {
    const handleFile = vi.fn();
    render(<Dropzone onFileSelect={handleFile} />);

    const file = createFile('data.csv', 100);
    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);

    expect(handleFile).toHaveBeenCalledWith(file);
  });

  it('calls onFileSelect on drop', () => {
    const handleFile = vi.fn();
    render(<Dropzone onFileSelect={handleFile} />);

    const file = createFile('bank.csv', 100);
    const dropzone = screen.getByRole('button', { name: /upuść plik/i });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(handleFile).toHaveBeenCalledWith(file);
  });

  it('shows dragover style on drag over', () => {
    render(<Dropzone onFileSelect={() => {}} />);

    const dropzone = screen.getByRole('button', { name: /upuść plik/i });
    fireEvent.dragOver(dropzone);

    expect(dropzone.className).toContain('border-primary');
  });

  it('displays error message when error prop is set', () => {
    render(<Dropzone onFileSelect={() => {}} error="Plik za duży" />);

    expect(screen.getByText('Plik za duży')).toBeInTheDocument();
  });

  it('rejects files exceeding maxSizeMb', async () => {
    const handleFile = vi.fn();
    render(<Dropzone onFileSelect={handleFile} maxSizeMb={1} />);

    const file = createFile('big.csv', 2 * 1024 * 1024);
    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);

    expect(handleFile).not.toHaveBeenCalled();
  });
});
