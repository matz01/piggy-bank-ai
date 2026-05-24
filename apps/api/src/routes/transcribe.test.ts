import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('groq-sdk', () => ({
  default: vi.fn(() => ({
    audio: { transcriptions: { create: mockCreate } },
  })),
}));

import app from '../app.js';

describe('POST /transcribe', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns 400 when file is missing', async () => {
    const form = new FormData();
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'file is required' });
  });

  it('returns transcribed text when file is provided', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'caffè uno cinquanta' });
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'caffè uno cinquanta' });
  });

  it('returns 500 when Groq throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('rate limit exceeded'));
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    const res = await app.request('/transcribe', { method: 'POST', body: form });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'rate limit exceeded' });
  });

  it('calls Groq with whisper-large-v3 and language it', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'test' });
    const form = new FormData();
    form.append('file', new Blob(['audio'], { type: 'audio/webm' }), 'audio.webm');
    await app.request('/transcribe', { method: 'POST', body: form });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-large-v3', language: 'it' })
    );
  });
});
