import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.js';
import { useSession } from './store/sessionStore.js';
import type { SpeechOptions } from './services/speech.js';

vi.mock('./services/speech.js', () => ({
  startTranscription: vi.fn(),
}));
vi.mock('./services/api.js', () => ({
  parse: vi.fn(),
}));
vi.mock('./services/db.js', () => ({
  saveTransaction: vi.fn(),
  resolveAndSaveTags: vi.fn(),
  readAllTagIds: vi.fn().mockResolvedValue([]),
}));

import { startTranscription } from './services/speech.js';

describe('App handleMicPress onEnd callback', () => {
  beforeEach(() => {
    useSession.setState({ state: 'idle', partial: null, clarification: null, queryResult: null });
    vi.mocked(startTranscription).mockImplementation(() => () => {});
  });

  it('resets state to idle when onEnd fires without onResult (quick tap)', async () => {
    let capturedOnEnd: (() => void) | undefined;
    vi.mocked(startTranscription).mockImplementation((opts: SpeechOptions) => {
      capturedOnEnd = opts.onEnd;
      return () => {};
    });

    render(<App />);

    await userEvent.pointer({
      target: screen.getByRole('button', { name: 'Microfono' }),
      keys: '[MouseLeft>]',
    });

    expect(useSession.getState().state).toBe('recording');
    expect(capturedOnEnd).toBeDefined();

    act(() => { capturedOnEnd!(); });

    expect(useSession.getState().state).toBe('idle');
  });

  it('does not reset state when onEnd fires after onResult (normal flow)', async () => {
    let capturedOnEnd: (() => void) | undefined;
    vi.mocked(startTranscription).mockImplementation((opts: SpeechOptions) => {
      capturedOnEnd = opts.onEnd;
      return () => {};
    });

    render(<App />);

    await userEvent.pointer({
      target: screen.getByRole('button', { name: 'Microfono' }),
      keys: '[MouseLeft>]',
    });

    // Simulate onResult having already moved state to 'processing'
    act(() => { useSession.getState().setState('processing'); });

    expect(useSession.getState().state).toBe('processing');

    act(() => { capturedOnEnd!(); });

    // onEnd must not reset to idle — API call is still in progress
    expect(useSession.getState().state).toBe('processing');
  });
});
