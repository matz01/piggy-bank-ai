import { describe, it, expect, vi } from 'vitest';

vi.mock('../agents/parserAgent.js', () => ({ parseExpense: vi.fn() }));

import { parseExpense } from '../agents/parserAgent.js';
import app from '../app.js';

describe('POST /parse', () => {
  it('returns ParseResult when agent returns importo', async () => {
    vi.mocked(parseExpense).mockResolvedValueOnce({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });

    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'caffè 1.50' }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
  });

  it('returns ClarificationResult when importo is missing', async () => {
    vi.mocked(parseExpense).mockResolvedValueOnce({ clarification: 'Quanto hai speso?' });

    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'caffè' }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clarification: 'Quanto hai speso?' });
  });

  it('forwards partial to parseExpense', async () => {
    vi.mocked(parseExpense).mockResolvedValueOnce({ titolo: 'Caffè', importo: 2.0, tag: ['bar'] });

    await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'due euro', partial: { titolo: 'Caffè' } }),
    });

    expect(parseExpense).toHaveBeenCalledWith('due euro', { titolo: 'Caffè' });
  });

  it('returns 400 when text is missing', async () => {
    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
