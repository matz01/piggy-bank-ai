import type { Transaction, Tag } from '@pbai/shared';

const DB_NAME = 'pbai';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('spese')) db.createObjectStore('spese', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('tag')) db.createObjectStore('tag', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('budget')) db.createObjectStore('budget', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getTag(id: string): Promise<Tag | null> {
  const db = await openDB();
  const tx = db.transaction('tag', 'readonly');
  const result = await idbRequest<Tag | undefined>(tx.objectStore('tag').get(id));
  return result ?? null;
}

export async function saveTag(tag: Tag): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('tag', 'readwrite');
  await idbRequest(tx.objectStore('tag').put(tag));
}

export async function resolveAndSaveTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const id = name.toLowerCase();
    const existing = await getTag(id);
    if (existing) {
      await saveTag({ ...existing, frequenza_uso: existing.frequenza_uso + 1 });
    } else {
      await saveTag({ id, nome: id.charAt(0).toUpperCase() + id.slice(1), frequenza_uso: 1 });
    }
    ids.push(id);
  }
  return ids;
}

export async function saveTransaction(transaction: Transaction): Promise<string> {
  const db = await openDB();
  const tx = db.transaction('spese', 'readwrite');
  await idbRequest(tx.objectStore('spese').put(transaction));
  return transaction.id;
}

export async function readAllTagIds(): Promise<string[]> {
  const db = await openDB();
  const tx = db.transaction('tag', 'readonly');
  const keys = await idbRequest<IDBValidKey[]>(tx.objectStore('tag').getAllKeys());
  return keys as string[];
}

export async function queryTransactions(
  tag_ids: string[],
  date_from: number,
  date_to: number,
  title_query?: string | null
): Promise<Transaction[]> {
  const db = await openDB();
  const tx = db.transaction('spese', 'readonly');
  const all = await idbRequest<Transaction[]>(tx.objectStore('spese').getAll());
  return all.filter(
    (t) =>
      t.data >= date_from &&
      t.data <= date_to &&
      (tag_ids.length === 0 || tag_ids.some((id) => t.tag_ids.includes(id))) &&
      (!title_query || t.titolo.toLowerCase().includes(title_query.toLowerCase()))
  );
}
