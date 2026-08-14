// api/index.ts — Entry serverless Vercel (proyecto curso-ai-api).
// Un solo handler catch-all bajo /api/* para la Express app completa.

import "dotenv/config";
import { app } from "../server/app.js";
import { store, hydrateStoreFromPersistence } from "../server/rag.js";
import { seedAll } from "../server/seed.js";
import { saveStore, persistenceEnabled } from "../server/store-persist.js";

console.log("api/index: module init begin");

// Store en memoria: hidratar desde Blob, y si quedó vacío, sembrar (evita queries vacías)
if (store.length === 0) {
  console.log("api/index: hydrating/seed docs (async)...");
  hydrateStoreFromPersistence()
    .then((loaded) => {
      if (store.length === 0) {
        return seedAll().then((n) => {
          console.log(`api/index: seed done, ${n} chunks`);
          if (persistenceEnabled()) saveStore(store);
          return n;
        });
      }
      console.log(`api/index: store cargado desde Blob (${loaded} chunks)`);
      return loaded;
    })
    .catch((err) => {
      console.error("api/index: hydratar/seed falló:", (err as Error).stack ?? (err as Error).message);
    });
}

console.log("api/index: module init done");

export default app;