import { describe, it, expect, beforeEach } from 'vitest';
import { useSession } from './sessionStore.js';

beforeEach(() => {
  useSession.setState({ state: 'idle', partial: null, clarification: null });
});

describe('sessionStore', () => {
  it('starts in idle state', () => {
    expect(useSession.getState().state).toBe('idle');
  });

  it('transitions to recording', () => {
    useSession.getState().setState('recording');
    expect(useSession.getState().state).toBe('recording');
  });

  it('stores partial parse result', () => {
    useSession.getState().setPartial({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
    expect(useSession.getState().partial?.titolo).toBe('Caffè');
  });

  it('stores clarification question', () => {
    useSession.getState().setClarification('Quanto hai speso?');
    expect(useSession.getState().clarification).toBe('Quanto hai speso?');
  });

  it('reset clears all state', () => {
    useSession.getState().setPartial({ titolo: 'Caffè', importo: 1.5, tag: [] });
    useSession.getState().setState('preview');
    useSession.getState().reset();
    expect(useSession.getState()).toMatchObject({ state: 'idle', partial: null, clarification: null });
  });
});
