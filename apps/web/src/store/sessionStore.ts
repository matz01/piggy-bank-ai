import { create } from 'zustand';
import type { ParseResult, QueryResult } from '@pbai/shared';

type SessionState =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'preview'
  | 'clarification'
  | 'query_result'
  | 'query_detail'
  | 'adding_tag';

interface SessionStore {
  state: SessionState;
  partial: Partial<ParseResult> | null;
  clarification: string | null;
  queryResult: QueryResult | null;
  setState: (s: SessionState) => void;
  setPartial: (p: Partial<ParseResult>) => void;
  setClarification: (q: string) => void;
  setQueryResult: (r: QueryResult) => void;
  reset: () => void;
}

export const useSession = create<SessionStore>((set) => ({
  state: 'idle',
  partial: null,
  clarification: null,
  queryResult: null,
  setState: (state) => set({ state }),
  setPartial: (partial) => set({ partial }),
  setClarification: (clarification) => set({ clarification }),
  setQueryResult: (queryResult) => set({ queryResult }),
  reset: () => set({ state: 'idle', partial: null, clarification: null, queryResult: null }),
}));
