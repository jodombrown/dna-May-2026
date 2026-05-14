/**
 * Composer attachment IndexedDB store.
 *
 * Persists in-progress / errored attachment File blobs across reloads so the
 * user can resume or retry without re-picking. Done items live in the regular
 * draft (URLs only); this store is strictly for non-done items.
 *
 * Keyed by user id. Each entry is the original File plus a small metadata
 * envelope so the uploader can rebuild its visual state on hydrate.
 */

const DB_NAME = 'dna-composer';
const STORE = 'pending-attachments';
const VERSION = 1;

export interface PendingAttachmentRecord {
  id: string;
  userId: string;
  name: string;
  kind: 'image' | 'video';
  size: number;
  status: 'uploading' | 'error' | 'cancelled';
  error?: string;
  /** Position in the visual order, for stable rehydration. */
  order: number;
  file: File;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, VERSION);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('userId', 'userId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function listPendingAttachments(userId: string): Promise<PendingAttachmentRecord[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('userId');
    const req = idx.getAll(userId);
    req.onsuccess = () => {
      const rows = (req.result ?? []) as PendingAttachmentRecord[];
      rows.sort((a, b) => a.order - b.order);
      resolve(rows);
    };
    req.onerror = () => resolve([]);
  });
}

export async function savePendingAttachment(rec: PendingAttachmentRecord): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function deletePendingAttachment(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function clearPendingAttachments(userId: string): Promise<void> {
  const rows = await listPendingAttachments(userId);
  await Promise.all(rows.map((r) => deletePendingAttachment(r.id)));
}
