import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryDetailView } from './QueryDetailView.js';

vi.mock('../services/db.js', () => ({
  queryTransactions: vi.fn(),
}));

import * as db from '../services/db.js';
import type { Transaction } from '@pbai/shared';

const QR = { tag_ids: ['bar'], date_from: 0, date_to: 1000 };

beforeEach(() => vi.clearAllMocks());

describe('QueryDetailView', () => {
  it('lists each transaction titolo', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
      { id: '2', titolo: 'Spritz', importo: 7.0, data: 600, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Negroni')).toBeInTheDocument();
      expect(screen.getByText('Spritz')).toBeInTheDocument();
    });
  });

  it('shows "Chiudi" button', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Chiudi')).toBeInTheDocument();
    });
  });

  it('calls onBack when "Chiudi" is clicked', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);
    const onBack = vi.fn();

    render(<QueryDetailView queryResult={QR} onBack={onBack} />);

    await waitFor(() => screen.getByText('Chiudi'));
    await userEvent.click(screen.getByText('Chiudi'));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders empty list when no transactions match', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });
});
