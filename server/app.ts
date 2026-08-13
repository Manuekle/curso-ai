// server/app.ts
// Express app exportada — la usan server.ts (local) y api/index.ts (Vercel).

import "dotenv/config";
import express from "express";
import multer from "multer";
import { runAgent } from "./agent.js";
import { ask, indexDocument, store, cosine, embed, userCanAccess } from "./rag.js";
import { orchestrate } from "./orchestrator.js";
import { extractText } from "./extract.js";

export const app = express();
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
});

// Log de request → qué hizo el sistema, cuánto tardó (#48)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      JSON.stringify({
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      })
    );
  });
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, docs: store.length }));

// ── Agente con tools (#13) ──
app.post("/api/agent", async (req, res) => {
  try {
    const { question, user = "demo" } = req.body as { question: string; user?: string };
    if (!question) return res.status(400).json({ error: "question requerido" }); // 400 → no retry (#40)
    const result = await runAgent(question, user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── RAG: indexar documento (#22) ──
app.post("/api/rag/index", async (req, res) => {
  try {
    const { text, owner = "demo" } = req.body as { text: string; owner?: string };
    if (!text) return res.status(400).json({ error: "text requerido" });
    const id = `doc-${Date.now()}`;
    const chunks = await indexDocument(id, text, owner);
    res.json({ id, chunks, totalDocs: store.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── RAG: indexar ARCHIVO real (pdf/docx/xlsx/txt/md…) → extrae texto → chunks (#22, #23) ──
app.post("/api/rag/index-file", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) return res.status(400).json({ error: "files requerido" });
    const owner = (req.body?.owner as string) || "demo";
    const results: { id?: string; filename: string; chars?: number; chunks?: number; error?: string }[] = [];
    for (const file of files) {
      const filename = file.originalname;
      const text = await extractText(file.buffer, filename);
      if (!text.trim()) {
        results.push({ filename, error: `Formato no soportado o sin texto extraíble: ${filename}` });
        continue;
      }
      const id = `file-${Date.now()}-${results.length}`;
      const chunks = await indexDocument(id, text, owner);
      results.push({ id, filename, chars: text.length, chunks });
    }
    res.json({ files: results, totalDocs: store.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── RAG: consultar (#26) ──
app.post("/api/rag/ask", async (req, res) => {
  try {
    const { question, user = "demo" } = req.body as { question: string; user?: string };
    if (!question) return res.status(400).json({ error: "question requerido" });
    res.json(await ask(question, user));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Multiagente (#18) ──
app.post("/api/orchestrate", async (req, res) => {
  try {
    const { question } = req.body as { question: string };
    if (!question) return res.status(400).json({ error: "question requerido" });
    res.json(await orchestrate(question));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Demos educativos: internals del RAG expuestos para las lecciones ──

// 1) Embedding de un texto (#24): dimensiones + muestra del vector
app.post("/api/demo/embed", async (req, res) => {
  try {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: "text requerido" });
    const [v] = await embed([text]);
    res.json({ dims: v.length, sample: v.slice(0, 8) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2) Similitud semántica entre dos textos (#24): cosine real
app.post("/api/demo/cosine", async (req, res) => {
  try {
    const { a, b } = req.body as { a: string; b: string };
    if (!a || !b) return res.status(400).json({ error: "a y b requeridos" });
    const [va, vb] = await embed([a, b]);
    res.json({ a, b, cosine: Number(cosine(va, vb).toFixed(4)) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 3) Búsqueda vectorial cruda (#25): top 5 con score, owner y si el usuario podría verlo (#28)
app.post("/api/demo/retrieve", async (req, res) => {
  try {
    const { question, user = "demo" } = req.body as { question: string; user?: string };
    if (!question) return res.status(400).json({ error: "question requerido" });
    const [qv] = await embed([question]);
    const hits = store
      .map((d) => ({ d, score: cosine(qv, d.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    res.json({
      question,
      hits: hits.map(({ d, score }) => ({
        id: d.id,
        owner: d.owner,
        score: Number(score.toFixed(4)),
        permitted: userCanAccess(user, d.owner), // filtro ANTES del LLM
        snippet: d.text.slice(0, 120),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});