import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parse } from './api.js';

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
      json: async () => ({ clarification: 'Quanto hai speso?' }),
    } as Response);

    const result = await parse({ text: 'caffè' });

    expect(result).toEqual({ clarification: 'Quanto hai speso?' });
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
