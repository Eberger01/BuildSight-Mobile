type StoreName = 'meta' | 'jobs' | 'estimates' | 'photos' | 'tasks';

const DB_NAME = 'buildsight_web';
const DB_VERSION = 1;

type MetaRow = { key: string; value: any };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('jobs')) db.createObjectStore('jobs', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('estimates')) db.createObjectStore('estimates', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(storeName: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    fn(store)
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch(reject);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetMetaAsync<T = any>(key: string): Promise<T | null> {
  return withStore('meta', 'readonly', async (store) => {
    const row = await reqToPromise<MetaRow | undefined>(store.get(key) as any);
    return (row?.value as T) ?? null;
  });
}

export async function idbSetMetaAsync(key: string, value: any): Promise<void> {
  await withStore('meta', 'readwrite', async (store) => {
    await reqToPromise(store.put({ key, value } as MetaRow));
  });
}

export async function idbGetAllAsync<T>(storeName: Exclude<StoreName, 'meta'>): Promise<T[]> {
  return withStore(storeName, 'readonly', async (store) => {
    const all = await reqToPromise<any[]>(store.getAll());
    return all as T[];
  });
}

export async function idbGetByIdAsync<T>(storeName: Exclude<StoreName, 'meta'>, id: number): Promise<T | null> {
  return withStore(storeName, 'readonly', async (store) => {
    const row = await reqToPromise<any>(store.get(id));
    return (row as T) ?? null;
  });
}

export async function idbPutAsync<T extends { id?: number }>(storeName: Exclude<StoreName, 'meta'>, value: T): Promise<number> {
  return withStore(storeName, 'readwrite', async (store) => {
    const id = await reqToPromise<IDBValidKey>(store.put(value as any));
    return Number(id);
  });
}

export async function idbDeleteAsync(storeName: Exclude<StoreName, 'meta'>, id: number): Promise<void> {
  await withStore(storeName, 'readwrite', async (store) => {
    await reqToPromise(store.delete(id));
  });
}

export async function idbClearAllAsync(): Promise<void> {
  const db = await openDb();
  await Promise.all(
    (['jobs', 'estimates', 'photos', 'tasks', 'meta'] as StoreName[]).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(name, 'readwrite');
          const store = tx.objectStore(name);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        })
    )
  );
}


