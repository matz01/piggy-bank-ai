import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryDetailView } from './QueryDetailView.js';

vi.mock('../services/db.js', () => ({
  queryTransactions: vi.fn(),
  deleteTransaction: vi.fn(),
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

  it('passes title_query to queryTransactions when set', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);
    const qrWithTQ = { tag_ids: [], date_from: 0, date_to: 1000, title_query: 'sushi' };

    render(<QueryDetailView queryResult={qrWithTQ} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(db.queryTransactions).toHaveBeenCalledWith([], 0, 1000, 'sushi');
    });
  });

  it('passes undefined title_query when not set', async () => {
    vi.mocked(db.queryTransactions).mockResolvedValueOnce([]);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(db.queryTransactions).toHaveBeenCalledWith(['bar'], 0, 1000, undefined);
    });
  });

  it('shows delete modal after 600ms long press', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText('Negroni'));

    vi.useFakeTimers();
    fireEvent.pointerDown(screen.getByText('Negroni').closest('li')!);
    act(() => { vi.advanceTimersByTime(600); });

    expect(screen.getByRole('button', { name: /elimina/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not show modal if pointer released before 600ms', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText('Negroni'));

    vi.useFakeTimers();
    const item = screen.getByText('Negroni').closest('li')!;
    fireEvent.pointerDown(item);
    act(() => { vi.advanceTimersByTime(300); });
    fireEvent.pointerUp(item);
    act(() => { vi.advanceTimersByTime(600); });

    expect(screen.queryByRole('button', { name: /elimina/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('calls deleteTransaction and removes row on confirm', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);
    vi.mocked(db.deleteTransaction).mockResolvedValueOnce(undefined);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText('Negroni'));

    vi.useFakeTimers();
    fireEvent.pointerDown(screen.getByText('Negroni').closest('li')!);
    act(() => { vi.advanceTimersByTime(600); });
    vi.useRealTimers();

    await userEvent.click(screen.getByRole('button', { name: /elimina/i }));

    expect(db.deleteTransaction).toHaveBeenCalledWith('1');
    expect(screen.queryByText('Negroni')).not.toBeInTheDocument();
  });

  it('closes modal without deleting on cancel', async () => {
    const txns: Transaction[] = [
      { id: '1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] },
    ];
    vi.mocked(db.queryTransactions).mockResolvedValueOnce(txns);

    render(<QueryDetailView queryResult={QR} onBack={vi.fn()} />);
    await waitFor(() => screen.getByText('Negroni'));

    vi.useFakeTimers();
    fireEvent.pointerDown(screen.getByText('Negroni').closest('li')!);
    act(() => { vi.advanceTimersByTime(600); });
    vi.useRealTimers();

    await userEvent.click(screen.getByRole('button', { name: /annulla/i }));

    expect(db.deleteTransaction).not.toHaveBeenCalled();
    expect(screen.getByText('Negroni')).toBeInTheDocument();
  });
});
