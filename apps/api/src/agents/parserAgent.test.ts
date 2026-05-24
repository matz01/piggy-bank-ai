import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../providers/llm.js', () => ({ defaultModel: 'mock-model' }));

import * as aiSdk from 'ai';
import { parseExpense } from './parserAgent.js';

beforeEach(() => vi.clearAllMocks());

describe('parseExpense', () => {
  it('returns ParseResult when importo is present', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ titolo: 'Caffè', importo: 1.5, tag: ['bar'], clarification: null }),
    } as any);

    const result = await parseExpense('caffè al bar 1.50');

    expect(result).toEqual({ titolo: 'Caffè', importo: 1.5, tag: ['bar'] });
  });

  it('returns ClarificationResult when importo is null', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ titolo: 'Caffè', importo: null, tag: ['bar'], clarification: 'Quanto hai speso?' }),
    } as any);

    const result = await parseExpense('caffè al bar');

    expect(result).toEqual({ clarification: 'Quanto hai speso?', partial: { titolo: 'Caffè', tag: ['bar'] } });
  });

  it('returns ClarificationResult when titolo is null', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ titolo: null, importo: 1, tag: [], clarification: 'Per cosa hai speso?' }),
    } as any);

    const result = await parseExpense('ho speso un euro');

    expect(result).toEqual({ clarification: 'Per cosa hai speso?', partial: { importo: 1, tag: [] } });
  });

  it('includes partial in prompt when provided', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ titolo: 'Caffè', importo: 2.0, tag: ['bar'], clarification: null }),
    } as any);

    await parseExpense('due euro', { titolo: 'Caffè', tag: ['bar'] });

    const [call] = vi.mocked(aiSdk.generateText).mock.calls;
    expect((call[0] as any).prompt).toContain('Caffè');
    expect((call[0] as any).prompt).toContain('due euro');
  });

  it('uses a neutral system prompt valid for both expenses and income', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ titolo: 'Stipendio', importo: 2000, tag: ['lavoro'], clarification: null }),
    } as any);

    await parseExpense('stipendio 2000');

    const [call] = vi.mocked(aiSdk.generateText).mock.calls;
    const system: string = (call[0] as any).system;
    expect(system).not.toMatch(/\bspese personali\b/i);
    expect(system).toMatch(/finanze|operazion/i);
  });
});
