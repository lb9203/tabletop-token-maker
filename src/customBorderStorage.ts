import type { Shape } from "./types";

export interface CustomBorderRecord {
  id: `custom:${string}`;
  label: string;
  shape: Shape;
  blob: Blob;
}

const databaseName = "tabletop-token-maker";
const storeName = "custom-borders";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error("Custom border storage is unavailable in this browser."),
      );
      return;
    }

    const request = indexedDB.open(databaseName, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onerror = () => {
      reject(
        request.error ??
          new Error("Custom border storage could not be opened."),
      );
    };
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Custom border storage is blocked. Close other token maker tabs and try again.",
        ),
      );
    };
    request.onsuccess = () => {
      const database = request.result;
      if (blocked) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => {
        reject(
          transaction.error ??
            request.error ??
            new Error("Custom border storage failed."),
        );
      };
    });
  } finally {
    database.close();
  }
}

export function readCustomBorders(): Promise<CustomBorderRecord[]> {
  return runTransaction<CustomBorderRecord[]>("readonly", (store) =>
    store.getAll(),
  );
}

export async function saveCustomBorder(
  record: CustomBorderRecord,
): Promise<void> {
  await runTransaction("readwrite", (store) => store.put(record));
}
