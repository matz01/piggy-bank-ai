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

    expect(result).toEqual({ clarification: 'Quanto hai speso?' });
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
});
