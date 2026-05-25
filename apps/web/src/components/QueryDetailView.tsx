import { useEffect, useState, useRef } from 'react';
import type { QueryResult, Transaction } from '@pbai/shared';
import { queryTransactions, deleteTransaction } from '../services/db.js';

interface Props {
  queryResult: QueryResult;
  onBack: () => void;
}

export function QueryDetailView({ queryResult, onBack }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queryTransactions(queryResult.tag_ids, queryResult.date_from, queryResult.date_to, queryResult.title_query).then(setTransactions);
  }, [queryResult.tag_ids, queryResult.date_from, queryResult.date_to, queryResult.title_query]);

  const handlePointerDown = (t: Transaction) => {
    longPressTimer.current = setTimeout(() => {
      setDeletingTransaction(t);
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    await deleteTransaction(deletingTransaction.id);
    setTransactions((prev) => prev.filter((t) => t.id !== deletingTransaction.id));
    setDeletingTransaction(null);
  };

  const handleCancelDelete = () => {
    setDeletingTransaction(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-up">
      <button
        onClick={onBack}
        aria-label="Indietro"
        className="self-start font-ui text-[11px] uppercase tracking-widest text-pbai-muted flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Chiudi
      </button>
      <ul className="flex flex-col gap-3 w-full">
        {transactions.map((t) => (
          <li
            key={t.id}
            className="flex justify-between items-baseline border-b border-pbai-border pb-2 select-none"
            onPointerDown={() => handlePointerDown(t)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-ui text-sm text-pbai-text">{t.titolo}</span>
              <span className="font-ui text-[10px] text-pbai-muted">
                {new Date(t.data).toLocaleDateString('it-IT')}
              </span>
            </div>
            <span className="font-display text-lg text-pbai-text">
              {t.importo.toFixed(2)}{' '}
              <span style={{ fontSize: '0.7em', color: '#c9a84c' }}>€</span>
            </span>
          </li>
        ))}
      </ul>

      {deletingTransaction && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(245,240,232,0.85)' }}
        >
          <div
            className="bg-white rounded-xl p-5 w-48 text-center"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <p className="font-ui text-[10px] uppercase tracking-widest text-pbai-muted mb-1">Elimina</p>
            <p className="font-ui text-[15px] font-medium text-pbai-text mb-1">{deletingTransaction.titolo}</p>
            <p className="font-display text-sm mb-4" style={{ color: '#c0392b' }}>
              {deletingTransaction.importo.toFixed(2)} €
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-1.5 font-ui text-[11px] uppercase tracking-widest text-pbai-muted rounded-full"
                style={{ border: '1.5px solid #d6d0c8' }}
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-1.5 font-ui text-[11px] uppercase tracking-widest text-white rounded-full"
                style={{ border: '1.5px solid #c0392b', background: '#c0392b' }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
