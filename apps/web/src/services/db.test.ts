import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { saveTransaction, getTag, saveTag, resolveAndSaveTags, readAllTagIds, queryTransactions, deleteTransaction } from './db.js';
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

  it('filters by titolo substring when title_query is provided', async () => {
    const t1: Transaction = { id: 'tq1', titolo: 'Sushi Yoshi', importo: 25, data: 500, tag_ids: [] };
    const t2: Transaction = { id: 'tq2', titolo: 'Pizza Margherita', importo: 12, data: 500, tag_ids: [] };
    await saveTransaction(t1);
    await saveTransaction(t2);

    const result = await queryTransactions([], 0, 1000, 'sushi');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tq1');
  });

  it('title_query match is case-insensitive', async () => {
    const t: Transaction = { id: 'tq3', titolo: 'Sushi Yoshi', importo: 25, data: 500, tag_ids: [] };
    await saveTransaction(t);

    const result = await queryTransactions([], 0, 1000, 'SUSHI');

    expect(result.some((r) => r.id === 'tq3')).toBe(true);
  });

  it('returns all transactions when title_query is null', async () => {
    const t1: Transaction = { id: 'tq4', titolo: 'Sushi', importo: 25, data: 500, tag_ids: [] };
    const t2: Transaction = { id: 'tq5', titolo: 'Pizza', importo: 12, data: 500, tag_ids: [] };
    await saveTransaction(t1);
    await saveTransaction(t2);

    const result = await queryTransactions([], 0, 1000, null);

    const ids = result.map((t) => t.id);
    expect(ids).toContain('tq4');
    expect(ids).toContain('tq5');
  });
});

describe('deleteTransaction', () => {
  it('removes the transaction from spese', async () => {
    const t: Transaction = { id: 'dt1', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: [] };
    await saveTransaction(t);
    await deleteTransaction('dt1');
    const remaining = await queryTransactions([], 0, 1000);
    expect(remaining.find((r) => r.id === 'dt1')).toBeUndefined();
  });

  it('decrements frequenza_uso for each tag in the transaction', async () => {
    await saveTag({ id: 'bar', nome: 'Bar', frequenza_uso: 3 });
    const t: Transaction = { id: 'dt2', titolo: 'Negroni', importo: 8.5, data: 500, tag_ids: ['bar'] };
    await saveTransaction(t);
    await deleteTransaction('dt2');
    const tag = await getTag('bar');
    expect(tag?.frequenza_uso).toBe(2);
  });

  it('does not decrement frequenza_uso below 0', async () => {
    await saveTag({ id: 'cibo', nome: 'Cibo', frequenza_uso: 0 });
    const t: Transaction = { id: 'dt3', titolo: 'Pizza', importo: 10, data: 500, tag_ids: ['cibo'] };
    await saveTransaction(t);
    await deleteTransaction('dt3');
    const tag = await getTag('cibo');
    expect(tag?.frequenza_uso).toBe(0);
  });

  it('is a no-op for a non-existent id', async () => {
    await expect(deleteTransaction('non-existent')).resolves.toBeUndefined();
  });
});
