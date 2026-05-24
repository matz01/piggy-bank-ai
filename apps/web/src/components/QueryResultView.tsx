import { useEffect, useState } from 'react';
import type { QueryResult, Transaction } from '@pbai/shared';
import { queryTransactions } from '../services/db.js';

interface Props {
  queryResult: QueryResult;
  onDetail: () => void;
}

export function QueryResultView({ queryResult, onDetail }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    queryTransactions(queryResult.tag_ids, queryResult.date_from, queryResult.date_to).then(setTransactions);
  }, [queryResult.tag_ids, queryResult.date_from, queryResult.date_to]);

  const total = transactions.reduce((sum, t) => sum + t.importo, 0);
  const rounded = Math.round(Math.abs(total) * 100);
  const intPart = Math.floor(rounded / 100);
  const decPart = (rounded % 100).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-4 animate-fade-up">
      <p className="font-ui text-[10px] uppercase tracking-widest text-pbai-muted">Totale</p>
      <p className="font-display text-6xl text-pbai-text">
        {total < 0 && <span style={{ fontSize: '0.58em', color: '#c0392b' }}>−</span>}
        <span>{intPart}</span>
        <span style={{ fontSize: '0.48em', verticalAlign: 'super' }}>.{decPart}</span>
        <span style={{ fontSize: '0.21em', verticalAlign: 'super', color: '#c9a84c' }}>€</span>
      </p>
      <button
        onClick={onDetail}
        className="font-ui text-[11px] uppercase tracking-widest text-pbai-accent"
      >
        Vedi dettagli
      </button>
    </div>
  );
}
