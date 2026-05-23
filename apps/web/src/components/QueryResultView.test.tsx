import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryResultView } from './QueryResultView.js';

vi.mock('../services/db.js', () => ({
  queryTransactions: vi.fn(),
}));

import * as db from '../services/db.js';
import type { Transaction } from '@pbai/shared';

const QR = { tag_ids: ['bar'], date_from: 0, date_to: 1000 };

beforeEach(() => vi.clearAllMocks());

describe('QueryResultView', () => {
  it('displays the integer part of the total', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
      { id: '2', titolo: 'Spritz', importo: 7.0, data: 600, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);

    render(<QueryResultView queryResult={QR} onDetail={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('shows "Vedi dettagli" button', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryResultView queryResult={QR} onDetail={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Vedi dettagli')).toBeInTheDocument();
    });
  });

  it('calls onDetail when "Vedi dettagli" is clicked', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);
    const onDetail = vi.fn();

    render(<QueryResultView queryResult={QR} onDetail={onDetail} />);

    await waitFor(() => screen.getByText('Vedi dettagli'));
    await userEvent.click(screen.getByText('Vedi dettagli'));

    expect(onDetail).toHaveBeenCalledOnce();
  });

  it('shows zero when no transactions match', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryResultView queryResult={QR} onDetail={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('shows "Totale" label', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryResultView queryResult={QR} onDetail={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/totale/i)).toBeInTheDocument();
    });
  });
});
