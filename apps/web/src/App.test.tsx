import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.js';
import { useSession } from './store/sessionStore.js';
import { readAllTagIds } from './services/db.js';

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

describe('App add-tag flow', () => {
  beforeEach(() => {
    useSession.setState({
      state: 'preview',
      partial: { titolo: 'Caffè', importo: 1.5, tag: ['bar'] },
      clarification: null,
      queryResult: null,
    });
    vi.mocked(readAllTagIds).mockResolvedValue(['colazione', 'cibo']);
  });

  it('enters adding_tag state when Aggiungi + is clicked', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Aggiungi +'));
    await waitFor(() => expect(useSession.getState().state).toBe('adding_tag'));
    expect(readAllTagIds).toHaveBeenCalled();
  });

  it('returns to preview on confirm and new tag appears as chip', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Aggiungi +'));
    await waitFor(() => expect(useSession.getState().state).toBe('adding_tag'));
    await userEvent.type(screen.getByRole('textbox'), 'gelato');
    await userEvent.click(screen.getByLabelText('Conferma'));
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    expect(screen.getByText('gelato')).toBeInTheDocument();
  });

  it('returns to preview on cancel without adding a tag', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('Aggiungi +'));
    await waitFor(() => expect(useSession.getState().state).toBe('adding_tag'));
    await userEvent.click(screen.getByLabelText('Annulla'));
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    expect(screen.queryByText('gelato')).not.toBeInTheDocument();
  });

  it('does not add duplicate tag if confirmed twice', async () => {
    render(<App />);
    // First confirm: add 'gelato'
    await userEvent.click(screen.getByText('Aggiungi +'));
    await waitFor(() => expect(useSession.getState().state).toBe('adding_tag'));
    await userEvent.type(screen.getByRole('textbox'), 'gelato');
    await userEvent.click(screen.getByLabelText('Conferma'));
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    // Second confirm: try to add 'gelato' again
    await userEvent.click(screen.getByText('Aggiungi +'));
    await waitFor(() => expect(useSession.getState().state).toBe('adding_tag'));
    await userEvent.type(screen.getByRole('textbox'), 'gelato');
    await userEvent.click(screen.getByLabelText('Conferma'));
    await waitFor(() => expect(useSession.getState().state).toBe('preview'));
    // 'gelato' chip should appear exactly once
    expect(screen.getAllByText('gelato')).toHaveLength(1);
  });
});

describe('Debug toggle', () => {
  beforeEach(() => {
    useSession.setState({ state: 'idle', partial: null, clarification: null, queryResult: null });
  });

  it('does not show the debug box by default', () => {
    render(<App />);
    expect(screen.queryByText('DEBUG')).not.toBeInTheDocument();
  });

  it('shows the debug box after clicking the commit SHA', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('dev'));
    expect(screen.getByText('DEBUG')).toBeInTheDocument();
  });

  it('hides the debug box after clicking the commit SHA twice', async () => {
    render(<App />);
    await userEvent.click(screen.getByText('dev'));
    await userEvent.click(screen.getByText('dev'));
    expect(screen.queryByText('DEBUG')).not.toBeInTheDocument();
  });
});
