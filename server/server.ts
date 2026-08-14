// server/server.ts
// Entry local (tsx) — levanta Express y siembra el store en memoria.

import { app } from "./app.js";
import { store, hydrateStoreFromPersistence } from "./rag.js";
import { seedAll } from "./seed.js";
import { saveStore, persistenceEnabled } from "./store-persist.js";

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, async () => {
  console.log(`API local en http://localhost:${PORT}`);
  // 1) Store persistido (Blob): cargar antes de sembrar para no duplicar.
  const loaded = await hydrateStoreFromPersistence().catch((err) => {
    console.warn("Hydrate falló, continúo con seed:", err.message);
    return 0;
  });
  // 2) Si quedó vacío, indexar los docs de ejemplo (seedAll no duplica).
  if (store.length === 0) {
    try {
      await seedAll();
      if (persistenceEnabled()) saveStore(store);
      console.log(`Seed inicial: ${store.length} chunks`);
    } catch (err) {
      console.error("Seed inicial falló (¿key inválida?):", (err as Error).message);
    }
  } else {
    console.log(`Store: ${store.length} chunks (${loaded} desde persistencia)`);
  }
});