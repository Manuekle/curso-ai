// api/index.ts — Entry serverless Vercel (proyecto curso-ai-api).
// Un solo handler catch-all bajo /api/* para la Express app completa.

import "dotenv/config";
import { app } from "../server/app.js";
import { store } from "../server/rag.js";
import { seedDocs } from "../server/seed.js";

console.log("api/index: module init begin");

// Store en memoria: sembrar una vez por instancia (evita queries vacías)
if (store.length === 0) {
  console.log("api/index: seeding docs (async)...");
  seedDocs()
    .then((n) => console.log(`api/index: seed done, ${n} chunks`))
    .catch((err) => {
      console.error("api/index: seed falló:", (err as Error).stack ?? (err as Error).message);
    });
}

console.log("api/index: module init done");

export default app;