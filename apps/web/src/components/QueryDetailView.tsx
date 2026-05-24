import { useEffect, useState } from 'react';
import type { QueryResult, Transaction } from '@pbai/shared';
import { queryTransactions } from '../services/db.js';

interface Props {
  queryResult: QueryResult;
  onBack: () => void;
}

export function QueryDetailView({ queryResult, onBack }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    queryTransactions(queryResult.tag_ids, queryResult.date_from, queryResult.date_to).then(setTransactions);
  }, [queryResult.tag_ids, queryResult.date_from, queryResult.date_to]);

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
          <li key={t.id} className="flex justify-between items-baseline border-b border-pbai-border pb-2">
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
    </div>
  );
}
