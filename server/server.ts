// server/server.ts
// Entry local (tsx) — levanta Express y siembra el store en memoria.

import { app } from "./app.js";
import { store } from "./rag.js";
import { seedDocs } from "./seed.js";

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, async () => {
  console.log(`API local en http://localhost:${PORT}`);
  // Store en memoria: si está vacía, indexa los docs de ejemplo (seedDocs no duplica)
  if (store.length === 0) {
    try {
      await seedDocs();
      console.log(`Seed inicial: ${store.length} chunks`);
    } catch (err) {
      console.error("Seed inicial falló (¿key inválida?):", (err as Error).message);
    }
  }
});