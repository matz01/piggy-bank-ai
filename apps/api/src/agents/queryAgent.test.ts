import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('../providers/llm.js', () => ({ defaultModel: 'mock-model' }));

import * as aiSdk from 'ai';
import { queryExpenses } from './queryAgent.js';

const TODAY = 1716278400000;

beforeEach(() => vi.clearAllMocks());

describe('queryExpenses', () => {
  it('returns QueryResult when tag matches', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        tag_ids: ['bar'],
        date_from: TODAY - 7 * 86400000,
        date_to: TODAY,
        clarification: null,
      }),
    } as any);

    const result = await queryExpenses('quanto ho speso in bar questa settimana', ['bar', 'cibo'], TODAY);

    expect(result).toEqual({
      tag_ids: ['bar'],
      date_from: TODAY - 7 * 86400000,
      date_to: TODAY,
    });
  });

  it('returns clarification when no tag matches', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        tag_ids: [],
        date_from: 0,
        date_to: 0,
        clarification: 'Non ho trovato "ristoranti". Prova con: bar, cibo.',
      }),
    } as any);

    const result = await queryExpenses('quanto ho speso in ristoranti', ['bar', 'cibo'], TODAY);

    expect(result).toEqual({ clarification: 'Non ho trovato "ristoranti". Prova con: bar, cibo.' });
  });

  it('includes today timestamp in system prompt', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ tag_ids: [], date_from: 0, date_to: TODAY, clarification: null }),
    } as any);

    await queryExpenses('tutto', ['cibo'], TODAY);

    const [call] = vi.mocked(aiSdk.generateText).mock.calls;
    expect((call[0] as any).system).toContain(String(TODAY));
  });

  it('includes tag list in system prompt', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: JSON.stringify({ tag_ids: ['cibo'], date_from: 0, date_to: TODAY, clarification: null }),
    } as any);

    await queryExpenses('cibo', ['cibo', 'bar', 'trasporti'], TODAY);

    const [call] = vi.mocked(aiSdk.generateText).mock.calls;
    const system: string = (call[0] as any).system;
    expect(system).toContain('cibo');
    expect(system).toContain('bar');
    expect(system).toContain('trasporti');
  });

  it('extracts JSON from code blocks', async () => {
    vi.mocked(aiSdk.generateText).mockResolvedValueOnce({
      text: '```json\n' + JSON.stringify({ tag_ids: ['bar'], date_from: 0, date_to: TODAY, clarification: null }) + '\n```',
    } as any);

    const result = await queryExpenses('test', ['bar'], TODAY);

    expect(result).toHaveProperty('tag_ids', ['bar']);
  });
});
