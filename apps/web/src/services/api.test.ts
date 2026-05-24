import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse, transcribe } from './api.js';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('parse', () => {
  it('calls POST /parse with text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] }),
    } as Response);

    const result = await parse({ text: 'caffè 1.50' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/parse'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
  });

  it('includes partial in body when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ titolo: 'Caffè', importo: 2.0, tag: ['bar'] }),
    } as Response);

    await parse({ text: 'due euro', partial: { titolo: 'Caffè' } });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.partial).toEqual({ titolo: 'Caffè' });
  });

  it('returns ClarificationResult as-is', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ clarification: 'Quanto hai speso?', partial: { titolo: 'Caffè', tag: [] } }),
    } as Response);

    const result = await parse({ text: 'caffè' });

    expect(result).toEqual({ clarification: 'Quanto hai speso?', partial: { titolo: 'Caffè', tag: [] } });
  });

  it('includes mode in body when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] }),
    } as Response);

    await parse({ text: 'caffè', mode: 'expense' });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.mode).toBe('expense');
  });

  it('includes tags and today in body when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ tag_ids: ['bar'], date_from: 0, date_to: 1 }),
    } as Response);

    await parse({ text: 'test', tags: ['bar', 'cibo'], today: 9999 });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.tags).toEqual(['bar', 'cibo']);
    expect(body.today).toBe(9999);
  });
});

describe('transcribe', () => {
  it('sends audio blob as form-data to /transcribe', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'caffè uno cinquanta' }),
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await transcribe(blob);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/transcribe'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toBe('caffè uno cinquanta');
  });

  it('sends file as FormData instance', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'test' }),
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await transcribe(blob);

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('throws on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await expect(transcribe(blob)).rejects.toThrow('transcribe failed: 500');
  });
});
