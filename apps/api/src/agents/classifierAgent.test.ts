import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../providers/llm.js', () => ({ defaultModel: 'mock-model' }));

import * as aiSdk from 'ai';
import { classifyIntent } from './classifierAgent.js';

beforeEach(() => vi.clearAllMocks());

describe('classifyIntent', () => {
  it('returns expense for expense phrases', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({ text: 'expense' } as any);
    const result = await classifyIntent('caffè al bar 1.50');
    expect(result).toEqual({ intent: 'expense' });
  });

  it('returns query for question phrases', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({ text: 'query' } as any);
    const result = await classifyIntent('quanto ho speso questa settimana in aperitivi');
    expect(result).toEqual({ intent: 'query' });
  });

  it('defaults to expense for unexpected LLM output', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({ text: 'unknown' } as any);
    const result = await classifyIntent('qualcosa di strano');
    expect(result).toEqual({ intent: 'expense' });
  });

  it('handles uppercase LLM output', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({ text: 'QUERY' } as any);
    const result = await classifyIntent('mostrami le spese');
    expect(result).toEqual({ intent: 'query' });
  });
});
