// server/store-persist.ts
// Persistencia del vector store en memoria → Vercel Blob (JSON).
// Con BLOB_READ_WRITE_TOKEN configurado, los chunks sobreviven entre instancias
// serverless. Sin token (dev local sin link), todo sigue en memoria como antes.

import { put, head } from "@vercel/blob";

const STORE_PATH = "curso-ai/vector-store.json";

export interface StoredChunk {
  id: string;
  text: string;
  owner: string;
  vector: number[];
}

export function persistenceEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

// Carga el store persistido. null si no hay nada guardado (o sin token).
// La CDN de Blob es eventualmente consistente: se leen varias copias (edge) y
// se queda con la de updatedAt más reciente (write se marca con timestamp).
export async function loadStore(): Promise<StoredChunk[] | null> {
  if (!persistenceEnabled()) return null;
  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  try {
    const h = await head(STORE_PATH, { token });
    if (!h?.url) return null;
    let best: { updatedAt: number; chunks: StoredChunk[] } | null = null;
    for (let i = 0; i < 6; i++) {
      const res = await fetch(`${h.url}?cb=${Date.now()}_${i}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data?.chunks) && data.chunks.length > 0) {
          const ts = Number(data.updatedAt ?? 0);
          if (!best || ts >= best.updatedAt) {
            best = { updatedAt: ts, chunks: data.chunks as StoredChunk[] };
          }
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return best?.chunks ?? null;
  } catch {
    return null;
  }
}

// Cola de guardado: serializa PUTs para que el último estado siempre gane
// (evita races entre reset/seed/index en instancias concurrentes).
let saveQueue: Promise<unknown> = Promise.resolve();

// Guarda el estado completo del store (asíncrono, nunca rompe la request).
export function saveStore(chunks: StoredChunk[]): void {
  if (!persistenceEnabled()) return;
  const snapshot = JSON.stringify({ chunks, updatedAt: Date.now() });
  saveQueue = saveQueue
    .then(() =>
      put(
        STORE_PATH,
        snapshot,
        {
          access: "private",
          token: process.env.BLOB_READ_WRITE_TOKEN!,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
          cacheControlMaxAge: 0,
        }
      )
    )
    .catch((err) => {
      console.warn("saveStore: no se pudo persistir el store:", err.message);
    });
}