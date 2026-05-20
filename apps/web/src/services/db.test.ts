import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { saveTransaction, getTag, saveTag, resolveAndSaveTags } from './db.js';
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
