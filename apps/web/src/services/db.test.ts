import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { saveTransaction, getTag, saveTag, resolveAndSaveTags, readAllTagIds, queryTransactions } from './db.js';
import type { Transaction, Tag } from '@pbai/shared';

beforeEach(() => {
  (globalThis as any).indexedDB = new IDBFactory();
});

describe('saveTag / getTag', () => {
  it('saves a new tag and retrieves it', async () => {
    const tag: Tag = { id: 'bar', nome: 'Bar', frequenza_uso: 0 };
    await saveTag(tag);
    const result = await getTag('bar');
    expect(result).toEqual(tag);
  });

  it('returns null for unknown tag', async () => {
    const result = await getTag('nonexistent');
    expect(result).toBeNull();
  });
});

describe('resolveAndSaveTags', () => {
  it('creates new tags and returns their ids', async () => {
    const ids = await resolveAndSaveTags(['alcolici', 'cibo']);
    expect(ids).toEqual(['alcolici', 'cibo']);
    const tag = await getTag('alcolici');
    expect(tag?.nome).toBe('Alcolici');
    expect(tag?.frequenza_uso).toBe(1);
  });

  it('increments frequenza_uso for existing tags', async () => {
    await saveTag({ id: 'bar', nome: 'Bar', frequenza_uso: 2 });
    await resolveAndSaveTags(['bar']);
    const tag = await getTag('bar');
    expect(tag?.frequenza_uso).toBe(3);
  });
});

describe('saveTransaction', () => {
  it('saves a transaction and returns its id', async () => {
    const tx: Transaction = {
      id: 'test-id-1',
      titolo: 'Caffè',
      importo: 1.5,
      data: Date.now(),
      tag_ids: ['bar'],
    };
    const id = await saveTransaction(tx);
    expect(id).toBe('test-id-1');
  });
});

describe('readAllTagIds', () => {
  it('returns empty array when no tags exist', async () => {
    const ids = await readAllTagIds();
    expect(ids).toEqual([]);
  });

  it('returns all saved tag ids', async () => {
    await saveTag({ id: 'bar', nome: 'Bar', frequenza_uso: 1 });
    await saveTag({ id: 'cibo', nome: 'Cibo', frequenza_uso: 2 });
    const ids = await readAllTagIds();
    expect(ids.sort()).toEqual(['bar', 'cibo']);
  });
});

describe('queryTransactions', () => {
  it('returns transactions matching tag and date range', async () => {
    const t1: Transaction = { id: 'q1', titolo: 'Negroni', importo: 8, data: 500, tag_ids: ['bar'] };
    const t2: Transaction = { id: 'q2', titolo: 'Pizza', importo: 12, data: 500, tag_ids: ['cibo'] };
    await saveTransaction(t1);
    await saveTransaction(t2);

    const result = await queryTransactions(['bar'], 0, 1000);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q1');
  });

  it('returns all transactions when tag_ids is empty', async () => {
    const t1: Transaction = { id: 'qa', titolo: 'A', importo: 1, data: 500, tag_ids: ['bar'] };
    const t2: Transaction = { id: 'qb', titolo: 'B', importo: 2, data: 500, tag_ids: ['cibo'] };
    await saveTransaction(t1);
    await saveTransaction(t2);

    const result = await queryTransactions([], 0, 1000);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('excludes transactions outside the date range', async () => {
    const t1: Transaction = { id: 'qc', titolo: 'Early', importo: 1, data: 100, tag_ids: ['bar'] };
    const t2: Transaction = { id: 'qd', titolo: 'Late', importo: 2, data: 900, tag_ids: ['bar'] };
    await saveTransaction(t1);
    await saveTransaction(t2);

    const result = await queryTransactions(['bar'], 200, 1000);
    const ids = result.map((t) => t.id);
    expect(ids).toContain('qd');
    expect(ids).not.toContain('qc');
  });
});
