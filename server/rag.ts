// server/rag.ts
// RAG completo (doc #22-28): chunk → embedding → vector store → retrieve → filtro umbral → filtro permisos → LLM.
// Store en memoria (local, sin infra). Para prod: pgvector / Pinecone / Qdrant (#25).

import { chatCompletion, createEmbedding, getDefaultProvider, getLastEmbeddingMode, getLastEmbeddingModel, getModel, Provider } from "./llm.js";
import { loadStore, saveStore, StoredChunk } from "./store-persist.js";

// ── 1. CHUNKING (#23) ──
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// ── 2. EMBEDDINGS (#24) ──
export async function embedWithTokens(
  texts: string[],
  apiKey?: string,
  provider?: Provider,
  onProgress?: (done: number, total: number) => void
): Promise<{ vectors: number[][]; tokens: number }> {
  const activeProvider = provider || getDefaultProvider();
  const config = { provider: activeProvider, apiKey };
  // Pool con límite de concurrencia: Promise.all sobre todo el lote podía
  // saturar rate limits y no permitía reportar progreso por chunk.
  const CONCURRENCY = 5;
  const results: { vector: number[]; tokens: number }[] = [];
  let cursor = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= texts.length) return;
      results[i] = await createEmbedding(config, texts[i]);
      done++;
      onProgress?.(done, texts.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, texts.length) }, () => worker()));
  return {
    vectors: results.map((r) => r.vector),
    tokens: results.reduce((s, r) => s + r.tokens, 0),
  };
}

export async function embed(
  texts: string[],
  apiKey?: string,
  provider?: Provider,
  onProgress?: (done: number, total: number) => void
): Promise<number[][]> {
  return (await embedWithTokens(texts, apiKey, provider, onProgress)).vectors;
}

// ── 3. VECTOR STORE en memoria (#25) ──
export interface Doc {
  id: string;
  text: string;
  owner: string; // dueño del documento → base del filtro de permisos (#28)
  vector: number[];
}
export const store: Doc[] = [];

export async function indexDocument(
  id: string,
  text: string,
  owner: string,
  apiKey?: string,
  provider?: Provider,
  onProgress?: (done: number, total: number) => void
): Promise<{ chunks: number; embedTokens: number }> {
  const chunks = chunkText(text);
  const { vectors, tokens } = await embedWithTokens(chunks, apiKey, provider, onProgress);
  chunks.forEach((c, i) => store.push({ id: `${id}:${i}`, text: c, owner, vector: vectors[i] }));
  saveStore(store);
  return { chunks: chunks.length, embedTokens: tokens };
}

// Hidrata la store desde Vercel Blob (persistencia entre instancias serverless).
export async function hydrateStoreFromPersistence(): Promise<number> {
  const saved = await loadStore();
  if (!saved || saved.length === 0) return 0;
  store.length = 0;
  store.push(...saved);
  console.log(`store-persist: cargados ${saved.length} chunks desde Blob`);
  return saved.length;
}

// Reset completo: limpia memoria y persistencia.
export async function resetStore(): Promise<void> {
  store.length = 0;
  saveStore(store);
}

// ── 4. BÚSQUEDA VECTORIAL (cosine) ──
export function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((s, x, i) => s + x * b[i]!, 0);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  const denom = norm(a) * norm(b);
  return denom === 0 ? 0 : dot / denom;
}

export interface ScoredDoc {
  doc: Doc;
  score: number;
  passedThreshold: boolean;
}

export function searchScored(queryVec: number[], k = 4, threshold = 0.20): ScoredDoc[] {
  return store
    .map((d) => {
      const rawScore = cosine(queryVec, d.vector);
      const score = Number(rawScore.toFixed(4));
      return {
        doc: d,
        score,
        passedThreshold: score >= threshold,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ── 0. AUTORIZACIÓN (doc #29) — quién puede ver qué ──
const ACL: Record<string, string[]> = {
  admin: ["*"], // admin ve todo
  demo: ["rh", "inventario", "publico"], // demo NO ve "it" (datos sensibles)
};

export function userCanAccess(user: string, owner: string): boolean {
  const allow = ACL[user];
  if (!allow) return false;
  return allow.includes("*") || allow.includes(owner);
}

// ── 5. CONSULTA: pregunta → embedding → retrieve → FILTRO UMBRAL → FILTRO PERMISOS → LLM ──
export interface ScoredHit {
  id: string;
  owner: string;
  score: number;
  passedThreshold: boolean;
  permitted: boolean;
  snippet: string;
}

export interface RagResult {
  answer: string;
  sources: string[];
  hits: number;
  allowedHits: number;
  threshold: number;
  totalDocs: number;
  dimensions: number;
  latencyMs: number;
  scoredHits: ScoredHit[];
  pythonLog: string;
  embeddingMode: string;
  model: string;
  embeddingModel: string;
  llmNote?: string;
  embedTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface AskOptions {
  threshold?: number;
  topK?: number;
}

export async function ask(
  question: string,
  user = "demo",
  apiKey?: string,
  provider?: Provider,
  options?: AskOptions
): Promise<RagResult> {
  const startTime = Date.now();
  const effectiveProvider = provider || getDefaultProvider();
  const threshold = options?.threshold ?? 0.20;
  const topK = options?.topK ?? 4;

  const qEmb = await embedWithTokens([question], apiKey, effectiveProvider);
  const qVec = qEmb.vectors[0];
  const embedTokens = qEmb.tokens;
  const embTime = Date.now() - startTime;
  const vectorDim = qVec.length;
  const embeddingMode = getLastEmbeddingMode();
  const embeddingModel = getLastEmbeddingModel();
  const model = getModel({ provider: effectiveProvider, apiKey });

  const candidates = searchScored(qVec, Math.max(topK, 5), threshold);
  const scoredHits: ScoredHit[] = candidates.map(({ doc, score, passedThreshold }) => ({
    id: doc.id,
    owner: doc.owner,
    score,
    passedThreshold,
    permitted: userCanAccess(user, doc.owner),
    snippet: doc.text.slice(0, 140),
  }));

  const passedThresholdCandidates = candidates.filter((c) => c.passedThreshold);
  const allowed = passedThresholdCandidates.filter((c) => userCanAccess(user, c.doc.owner)).slice(0, topK);

  let answer = "";
  let llmTime = 0;
  let llmNote = "";
  let promptTokens = 0;
  let completionTokens = 0;

  if (store.length === 0) {
    answer =
      `La base vectorial está vacía (0 documentos indexados). ` +
      `Indexá un documento de prueba (txt, pdf…) y volvé a preguntar.`;
  } else if (passedThresholdCandidates.length === 0) {
    const topScores = candidates
      .slice(0, 3)
      .map((c) => `${c.doc.id} (similitud ${c.score})`)
      .join(", ");
    answer =
      `Ningún documento alcanzó el umbral de similitud (${threshold}). ` +
      `Los más cercanos fueron: ${topScores}. ` +
      `Probá bajar el umbral o reformular la pregunta.`;
  } else if (allowed.length === 0) {
    answer = `Se encontraron documentos relacionados pero no tienes permisos de acceso (usuario: "${user}"). Documentos bloqueados por política de seguridad: ${passedThresholdCandidates.map((c) => `[${c.doc.id} - owner: ${c.doc.owner}]`).join(", ")}.`;
  } else {
    const context = allowed.map((c) => `[fuente: ${c.doc.id}]\n${c.doc.text}`).join("\n\n---\n\n");
    const llmStart = Date.now();
    const ragMessages = [
      {
        role: "system",
        content:
          "Respondé SOLO con base en el contexto dado, en español. " +
          "Mencioná la fuente citando [fuente: ...]. " +
          "Regla crítica (#66): si el contexto no responde la pregunta, decí 'No encontré suficiente información para responder con seguridad.' " +
          "No inventes datos.",
      },
      { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${question}` },
    ];

    try {
      const res = await chatCompletion(
        { provider: effectiveProvider, apiKey },
        {
          temperature: 0,
          messages: ragMessages,
        }
      );
      llmTime = Date.now() - llmStart;
      answer = res.choices[0]?.message.content ?? "";

      const usage = res?.usage;
      if (usage?.prompt_tokens) {
        promptTokens += usage.prompt_tokens;
        completionTokens += usage.completion_tokens || 0;
      }
    } catch (llmErr: any) {
      llmTime = Date.now() - llmStart;
      // Modo local: sin LLM disponible la práctica sigue funcionando con las fuentes recuperadas.
      llmNote = `LLM sin API válida: ${llmErr?.message ?? String(llmErr)}`;
      const excerpts = allowed
        .map((c) => `[fuente: ${c.doc.id}]\n${c.doc.text.slice(0, 300)}`)
        .join("\n\n---\n\n");
      answer =
        `[Modo local] El modelo de IA no está disponible (${llmErr?.code ?? "LLM_ERROR"}). ` +
        `Estos son los documentos recuperados que responden tu consulta:\n\n${excerpts}\n\n` +
        `Configurá una API key válida para obtener respuestas generadas por el modelo.`;

      // Sin usage del proveedor: estimar con chars/4.
      if (!promptTokens && !completionTokens) {
        promptTokens = Math.ceil(JSON.stringify(ragMessages).length / 4);
        completionTokens = Math.ceil(answer.length / 4);
      }
    }
  }

  const totalLatencyMs = Date.now() - startTime;

  // Generación de log estilo terminal de Python (LangChain / LlamaIndex / Rich logger)
  const logLines: string[] = [
    `[AI Pipeline] Mode: RAG | Provider: ${effectiveProvider} | Vector Store: InMemory (Docs: ${store.length})`,
    `[Embedding] Query Vector: ${vectorDim} dims | Modo: ${embeddingMode === "local" ? "LOCAL (sin API válida)" : "proveedor"} | Tokens: ${embedTokens} | Latency: ${embTime}ms`,
    `[Vector Search] Top-${topK} candidates | Similitud Coseno | Umbral (Threshold): ${threshold.toFixed(2)}`,
    `--------------------------------------------------------------------------------`,
  ];

  if (candidates.length === 0) {
    logLines.push(`  (Store vacía o sin chunks indexados)`);
  } else {
    candidates.forEach((c, idx) => {
      const statusTh = c.passedThreshold ? `PASSED (>= ${threshold.toFixed(2)})` : `FILTERED (< ${threshold.toFixed(2)})`;
      const isPermitted = userCanAccess(user, c.doc.owner);
      const statusRbac = isPermitted ? `RBAC: ALLOWED (${c.doc.owner})` : `RBAC: DENIED (${c.doc.owner})`;
      logLines.push(
        `  #${idx + 1}  [Cosine: ${c.score.toFixed(4)}] ${c.doc.id.padEnd(24)} -> [${statusTh}] -> [${statusRbac}]`
      );
    });
  }

  logLines.push(`--------------------------------------------------------------------------------`);
  logLines.push(
    `[Context Injection] ${allowed.length} chunk(s) seleccionados | Chars: ${allowed.reduce((s, c) => s + c.doc.text.length, 0)} (~${Math.round(allowed.reduce((s, c) => s + c.doc.text.length, 0) / 4)} tokens)`
  );
  if (llmTime > 0) {
    logLines.push(`[LLM Generation] Temperature: 0.0 | Tokens in: ${promptTokens} | out: ${completionTokens} | Latency: ${llmTime}ms`);
  }
  if (llmNote) {
    logLines.push(`[LLM Generation] No disponible: ${llmNote.slice(0, 120)}`);
  }
  logLines.push(`[Execution Summary] Total Latency: ${totalLatencyMs}ms | Status: 200 OK | Fuentes: [${allowed.map((c) => c.doc.id).join(", ")}]`);

  const pythonLog = logLines.join("\n");

  return {
    answer,
    sources: allowed.map((c) => c.doc.id),
    hits: passedThresholdCandidates.length,
    allowedHits: allowed.length,
    threshold,
    totalDocs: store.length,
    dimensions: vectorDim,
    latencyMs: totalLatencyMs,
    scoredHits,
    pythonLog,
    embeddingMode,
    model,
    embeddingModel,
    llmNote: llmNote || undefined,
    embedTokens,
    promptTokens,
    completionTokens,
  };
}

