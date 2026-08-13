// server/rag.ts
// RAG completo (doc #22-28): chunk → embedding → vector store → retrieve → filtro permisos → LLM.
// Store en memoria (local, sin infra). Para prod: pgvector / Pinecone / Qdrant (#25).

import { chatCompletion, chatModel, client, embeddingModel } from "./llm";

// ── 1. CHUNKING (#23) ──
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// ── 2. EMBEDDINGS (#24) ──
export async function embed(texts: string[]): Promise<number[][]> {
  // encoding_format float: algunos proveedores (Nvidia via OpenRouter) rechazan el base64 por defecto del SDK
  const res = await client().embeddings.create({
    model: embeddingModel(),
    input: texts,
    encoding_format: "float",
  });
  return res.data.map((d) => d.embedding);
}

// ── 3. VECTOR STORE en memoria (#25) ──
interface Doc {
  id: string;
  text: string;
  owner: string; // dueño del documento → base del filtro de permisos (#28)
  vector: number[];
}
export const store: Doc[] = [];

export async function indexDocument(id: string, text: string, owner: string): Promise<number> {
  const chunks = chunkText(text);
  const vectors = await embed(chunks);
  chunks.forEach((c, i) => store.push({ id: `${id}:${i}`, text: c, owner, vector: vectors[i] }));
  return chunks.length;
}

// ── 4. BÚSQUEDA VECTORIAL (cosine) ──
export function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, x, i) => s + x * b[i]!, 0);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));
}

function search(queryVec: number[], k = 4): Doc[] {
  return store
    .map((d) => ({ d, score: cosine(queryVec, d.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.d);
}

// ── 0. AUTORIZACIÓN (doc #29) — quién puede ver qué ──
// user → lista de owners permitidos. Ejemplo minimalista de RBAC (#32):
const ACL: Record<string, string[]> = {
  admin: ["*"], // admin ve todo
  demo: ["rh", "inventario"],
};

export function userCanAccess(user: string, owner: string): boolean {
  const allow = ACL[user];
  if (!allow) return false;
  return allow.includes("*") || allow.includes(owner);
}

// ── 5. CONSULTA: pregunta → embedding → retrieve → FILTRO ANTES del LLM → LLM ──
export interface RagResult {
  answer: string;
  sources: string[];
  hits: number;
  allowedHits: number;
}

export async function ask(question: string, user = "demo"): Promise<RagResult> {
  const [qVec] = await embed([question]); // un embedding por pregunta
  const hits = search(qVec);

  // #28 — PERMISSION FILTER ANTES de que el documento llegue al LLM (crítico)
  const allowed = hits.filter((d) => userCanAccess(user, d.owner));

  if (!allowed.length) {
    return {
      answer: "No encontré información a la que tengas acceso.",
      sources: [],
      hits: hits.length,
      allowedHits: 0,
    };
  }

  const context = allowed.map((d) => `[fuente: ${d.id}]\n${d.text}`).join("\n\n---\n\n");

  const res = await chatCompletion({
    model: chatModel(),
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Respondé SOLO con base en el contexto dado, en español. " +
          "Mencioná la fuente citando [fuente: ...]. " +
          "Regla crítica (#66): si el contexto no responde la pregunta, decí 'No encontré suficiente información para responder con seguridad.' " +
          "No inventes datos.",
      },
      { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${question}` },
    ],
  });

  return {
    answer: res.choices[0]?.message.content ?? "",
    sources: allowed.map((d) => d.id),
    hits: hits.length,
    allowedHits: allowed.length,
  };
}