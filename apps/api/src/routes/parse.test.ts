import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents/parserAgent.js', () => ({ parseExpense: vi.fn() }));
vi.mock('../agents/classifierAgent.js', () => ({ classifyIntent: vi.fn() }));
vi.mock('../agents/queryAgent.js', () => ({ queryExpenses: vi.fn() }));

import { parseExpense } from '../agents/parserAgent.js';
import { classifyIntent } from '../agents/classifierAgent.js';
import { queryExpenses } from '../agents/queryAgent.js';
import app from '../app.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(classifyIntent).mockResolvedValue({ intent: 'expense' });
});

describe('POST /parse', () => {
  it('returns 400 when text is missing', async () => {
    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

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

  it('routes to queryExpenses for query intent', async () => {
    vi.mocked(classifyIntent).mockResolvedValueOnce({ intent: 'query' });
    vi.mocked(queryExpenses).mockResolvedValueOnce({
      tag_ids: ['bar'],
      date_from: 1000,
      date_to: 2000,
    });

    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'quanto ho speso in bar', tags: ['bar', 'cibo'], today: 2000 }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tag_ids: ['bar'], date_from: 1000, date_to: 2000 });
    expect(parseExpense).not.toHaveBeenCalled();
  });

  it('passes tags and today to queryExpenses', async () => {
    vi.mocked(classifyIntent).mockResolvedValueOnce({ intent: 'query' });
    vi.mocked(queryExpenses).mockResolvedValueOnce({ tag_ids: [], date_from: 0, date_to: 0 });

    await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test', tags: ['bar'], today: 9999 }),
    });

    expect(queryExpenses).toHaveBeenCalledWith('test', ['bar'], 9999);
  });

  it('defaults tags to [] and today to a recent timestamp when not provided', async () => {
    vi.mocked(classifyIntent).mockResolvedValueOnce({ intent: 'query' });
    vi.mocked(queryExpenses).mockResolvedValueOnce({ tag_ids: [], date_from: 0, date_to: 0 });

    const before = Date.now();
    await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    });
    const after = Date.now();

    const [, tags, today] = vi.mocked(queryExpenses).mock.calls[0];
    expect(tags).toEqual([]);
    expect(today).toBeGreaterThanOrEqual(before);
    expect(today).toBeLessThanOrEqual(after);
  });

  it('falls back to expense intent when classifier throws', async () => {
    vi.mocked(classifyIntent).mockRejectedValueOnce(new Error('LLM timeout'));
    vi.mocked(parseExpense).mockResolvedValueOnce({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });

    const res = await app.request('/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'caffè 1.50' }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
    expect(queryExpenses).not.toHaveBeenCalled();
  });
});
