import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.js';
import { useSession } from './store/sessionStore.js';

vi.mock('./services/speech.js', () => ({
  createRecorder: vi.fn(),
}));
vi.mock('./services/api.js', () => ({
  parse: vi.fn(),
  transcribe: vi.fn(),
}));
vi.mock('./services/db.js', () => ({
  saveTransaction: vi.fn(),
  resolveAndSaveTags: vi.fn(),
  readAllTagIds: vi.fn().mockResolvedValue([]),
}));

import { createRecorder } from './services/speech.js';
import { parse, transcribe } from './services/api.js';

describe('App mic flow', () => {
  const mockBlob = new Blob(['audio']);
  const mockStart = vi.fn();
  const mockStop = vi.fn().mockResolvedValue(mockBlob);

  beforeEach(() => {
    useSession.setState({ state: 'idle', partial: null, clarification: null, queryResult: null });
    vi.mocked(createRecorder).mockResolvedValue({ start: mockStart, stop: mockStop });
    vi.mocked(transcribe).mockResolvedValue('caffè uno cinquanta');
    vi.mocked(parse).mockResolvedValue({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
  });

  it('enters recording state after mic press', async () => {
    render(<App />);
    const micButton = screen.getByRole('button', { name: 'Microfono' });
    fireEvent.pointerDown(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    expect(createRecorder).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
  });

  it('transitions to preview on release after successful transcription', async () => {
    render(<App />);
    const micButton = screen.getByRole('button', { name: 'Microfono' });
    fireEvent.pointerDown(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    fireEvent.pointerUp(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    expect(transcribe).toHaveBeenCalledWith(mockBlob);
    expect(parse).toHaveBeenCalledWith(expect.objectContaining({ text: 'caffè uno cinquanta' }));
  });

  it('stays idle when createRecorder fails (microphone permission denied)', async () => {
    vi.mocked(createRecorder).mockRejectedValueOnce(new Error('Permission denied'));
    render(<App />);
    const micButton = screen.getByRole('button', { name: 'Microfono' });
    fireEvent.pointerDown(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });

  it('returns to idle when transcribe fails', async () => {
    vi.mocked(transcribe).mockRejectedValueOnce(new Error('Network error'));
    render(<App />);
    const micButton = screen.getByRole('button', { name: 'Microfono' });
    fireEvent.pointerDown(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    fireEvent.pointerUp(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });

  it('returns to idle when parse fails', async () => {
    vi.mocked(parse).mockRejectedValueOnce(new Error('Parse error'));
    render(<App />);
    const micButton = screen.getByRole('button', { name: 'Microfono' });
    fireEvent.pointerDown(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('recording'));
    fireEvent.pointerUp(micButton);
    await waitFor(() => expect(useSession.getState().state).toBe('idle'));
  });
});
