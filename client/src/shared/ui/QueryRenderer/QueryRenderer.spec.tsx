import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { QueryState } from '#shared/api';

import { QueryRenderer } from './QueryRenderer';

describe('QueryRenderer', () => {
  const renderContent = (data: string): React.JSX.Element => <p>{data}</p>;

  it('renders skeleton when status is loading', () => {
    const state: QueryState<string> = { status: 'loading' };

    const { container } = render(
      <QueryRenderer state={state}>{renderContent}</QueryRenderer>,
    );

    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders skeleton when status is notLoaded', () => {
    const state: QueryState<string> = { status: 'notLoaded' };

    const { container } = render(
      <QueryRenderer state={state}>{renderContent}</QueryRenderer>,
    );

    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders custom skeleton when provided', () => {
    const state: QueryState<string> = { status: 'loading' };

    render(
      <QueryRenderer state={state} skeleton={<div data-testid="custom-skel" />}>
        {renderContent}
      </QueryRenderer>,
    );

    expect(screen.getByTestId('custom-skel')).not.toBeNull();
  });

  it('renders error message when status is error', () => {
    const state: QueryState<string> = { status: 'error', error: 'Something broke' };

    render(<QueryRenderer state={state}>{renderContent}</QueryRenderer>);

    expect(screen.getByText('Something broke')).not.toBeNull();
  });

  it('renders children with data when status is loaded', () => {
    const state: QueryState<string> = { status: 'loaded', data: 'Hello world' };

    render(<QueryRenderer state={state}>{renderContent}</QueryRenderer>);

    expect(screen.getByText('Hello world')).not.toBeNull();
  });
});
