import { create } from 'zustand';
import type { ParseResult } from '@pbai/shared';

type SessionState = 'idle' | 'recording' | 'processing' | 'preview' | 'clarification';

interface SessionStore {
  state: SessionState;
  partial: Partial<ParseResult> | null;
  clarification: string | null;
  setState: (s: SessionState) => void;
  setPartial: (p: Partial<ParseResult>) => void;
  setClarification: (q: string) => void;
  reset: () => void;
}

export const useSession = create<SessionStore>((set) => ({
  state: 'idle',
  partial: null,
  clarification: null,
  setState: (state) => set({ state }),
  setPartial: (partial) => set({ partial }),
  setClarification: (clarification) => set({ clarification }),
  reset: () => set({ state: 'idle', partial: null, clarification: null }),
}));
