// frontend/src/lib/localRag.ts
// RAG 100% cliente: chunking, embeddings (proveedor o local), cosine, store en localStorage.
// Espejo de server/rag.ts + server/llm.ts pero sin SDKs: fetch directo a los proveedores.

export type LocalProvider = "openai" | "gemini" | "groq" | "openrouter"

export interface LocalApiKeys {
  openai: string
  gemini: string
  groq: string
  openrouter: string
}

export interface LocalDoc {
  id: string
  text: string
  owner: string
  vector: number[]
}

export interface LocalHit {
  id: string
  owner: string
  score: number
  passedThreshold: boolean
  snippet: string
}

const STORE_KEY = "chatbot-store"
const EMBEDDING_DIM = 1536

// ── 1. CHUNKING (igual que server/rag.ts) ──
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

// ── 2. COSINE (igual que server/rag.ts) ──
export function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0
  const dot = a.reduce((s, x, i) => s + x * b[i]!, 0)
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))
  const denom = norm(a) * norm(b)
  return denom === 0 ? 0 : dot / denom
}

// ── 3. EMBEDDING LOCAL (port de server/llm.ts: generateLocalEmbedding) ──
const STOP_WORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "en", "para", "por",
  "que", "es", "del", "al", "se", "con", "su", "sus", "como", "cuanto", "cuantos",
  "cuanta", "cuantas", "cuando", "donde", "quien", "quienes", "o", "y", "a", "te",
  "me", "le", "nos", "les", "mi", "tu", "yo", "tu", "el", "ella", "ellos", "ellas",
])

export function generateLocalEmbedding(text: string, dim = EMBEDDING_DIM): number[] {
  const vec = new Float64Array(dim)
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const words = clean.split(/\W+/).filter((w) => w.length > 1)

  const fnv1a = (str: string, seed = 0x811c9dc5): number => {
    let hash = seed
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
    return Math.abs(hash)
  }

  const tf = new Map<string, number>()
  for (const w of words) {
    tf.set(w, (tf.get(w) ?? 0) + 1)
  }

  for (const [word, count] of tf.entries()) {
    const isStop = STOP_WORDS.has(word)
    const weight = isStop ? 0.2 : (1 + Math.log(1 + count)) * (1.5 + Math.min(3, word.length * 0.3))
    const idx = fnv1a(word) % dim
    vec[idx] += weight

    if (!isStop && word.length >= 3) {
      for (let n = 3; n <= Math.min(5, word.length); n++) {
        for (let i = 0; i <= word.length - n; i++) {
          const sub = word.slice(i, i + n)
          const subIdx = fnv1a(sub, 0x9e3779b9) % dim
          vec[subIdx] += 0.5 * (1 / (i + 1))
        }
      }
    }
  }

  let normSq = 0
  for (let i = 0; i < dim; i++) normSq += vec[i] * vec[i]
  const norm = Math.sqrt(normSq) || 1e-12
  const result: number[] = new Array(dim)
  for (let i = 0; i < dim; i++) result[i] = Number((vec[i] / norm).toFixed(6))
  return result
}

// Normaliza a 1536 dims (consistencia del store, igual que el server).
function toEmbeddingDim(vec: number[], dim = EMBEDDING_DIM): number[] {
  if (vec.length === dim) return vec
  if (vec.length > dim) return vec.slice(0, dim)
  return [...vec, ...new Array(dim - vec.length).fill(0)]
}

// ── 4. STORE en localStorage ──
export function loadStore(): LocalDoc[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as LocalDoc[]) : []
  } catch {
    return []
  }
}

export function saveStore(docs: LocalDoc[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(docs))
  } catch {
    // localStorage lleno o bloqueado: el chat sigue sin persistir vectores nuevos
  }
}

export function clearStore(): void {
  try {
    localStorage.removeItem(STORE_KEY)
  } catch {
    // ignore
  }
}

// ── 5. EMBEDDINGS vía proveedor (fetch directo, CORS habilitado) ──
interface EmbedResolved {
  mode: "provider" | "local"
  url?: string
  key?: string
  model?: string
  provider?: string
}

function resolveEmbedding(keys: LocalApiKeys, provider: LocalProvider): EmbedResolved {
  switch (provider) {
    case "openai":
      if (keys.openai?.trim())
        return { mode: "provider", url: "https://api.openai.com/v1/embeddings", key: keys.openai.trim(), model: "text-embedding-3-small", provider: "openai" }
      break
    case "openrouter":
      if (keys.openrouter?.trim())
        return { mode: "provider", url: "https://openrouter.ai/api/v1/embeddings", key: keys.openrouter.trim(), model: "nvidia/nemotron-3-embed-1b:free", provider: "openrouter" }
      break
    case "gemini":
      if (keys.gemini?.trim())
        return { mode: "provider", url: "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent", key: keys.gemini.trim(), model: "text-embedding-004", provider: "gemini" }
      break
    case "groq":
      // Groq no tiene API de embeddings: usar OpenRouter si hay key (igual que el server).
      if (keys.openrouter?.trim())
        return { mode: "provider", url: "https://openrouter.ai/api/v1/embeddings", key: keys.openrouter.trim(), model: "nvidia/nemotron-3-embed-1b:free", provider: "openrouter" }
      break
  }
  return { mode: "local" }
}

async function fetchEmbedding(resolved: EmbedResolved, text: string): Promise<{ vector: number[]; mode: "provider" | "local" }> {
  if (resolved.mode !== "provider" || !resolved.url || !resolved.key) {
    return { vector: generateLocalEmbedding(text), mode: "local" }
  }
  if (resolved.provider === "gemini") {
    const res = await fetch(`${resolved.url}?key=${encodeURIComponent(resolved.key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    })
    if (!res.ok) throw new Error(`Embedding HTTP ${res.status}: ${await safeErrorText(res)}`)
    const data = await res.json()
    return { vector: toEmbeddingDim(data.embedding?.values ?? []), mode: "provider" }
  }
  const res = await fetch(resolved.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolved.key}` },
    body: JSON.stringify({ model: resolved.model, input: text, encoding_format: "float" }),
  })
  if (!res.ok) throw new Error(`Embedding HTTP ${res.status}: ${await safeErrorText(res)}`)
  const data = await res.json()
  return { vector: toEmbeddingDim(data.data?.[0]?.embedding ?? []), mode: "provider" }
}

export async function embedTexts(
  texts: string[],
  keys: LocalApiKeys,
  provider: LocalProvider
): Promise<{ vectors: number[][]; mode: "provider" | "local" }> {
  const resolved = resolveEmbedding(keys, provider)
  const results: number[][] = []
  let finalMode: "provider" | "local" = "local"
  for (const text of texts) {
    try {
      const r = await fetchEmbedding(resolved, text)
      results.push(r.vector)
      if (r.mode === "provider") finalMode = "provider"
    } catch {
      results.push(generateLocalEmbedding(text))
    }
  }
  return { vectors: results, mode: finalMode }
}

// ── 6. INDEXAR texto subido ──
export async function indexText(
  name: string,
  text: string,
  keys: LocalApiKeys,
  provider: LocalProvider
): Promise<{ chunks: number; mode: "provider" | "local" }> {
  const chunks = chunkText(text)
  const { vectors, mode } = await embedTexts(chunks, keys, provider)
  const docs = loadStore()
  chunks.forEach((c, i) => docs.push({ id: `${name}:${i}`, text: c, owner: "local", vector: vectors[i] }))
  saveStore(docs)
  return { chunks: chunks.length, mode }
}

// ── 7. IMPORTAR base vectorial del server (re-embed con espacio local) ──
export async function importFromServer(
  keys: LocalApiKeys,
  provider: LocalProvider
): Promise<{ imported: number; mode: "provider" | "local" }> {
  const res = await fetch("/api/rag/store")
  if (!res.ok) throw new Error(`Import HTTP ${res.status}`)
  const data = await res.json()
  const chunks: Array<{ id: string; text: string; owner: string }> = data?.chunks ?? []
  if (chunks.length === 0) return { imported: 0, mode: "local" }

  const { vectors, mode } = await embedTexts(chunks.map((c) => c.text), keys, provider)
  const docs = loadStore()
  // Reemplazo completo: el store local refleja la base del server.
  const merged: LocalDoc[] = chunks.map((c, i) => ({ id: c.id, text: c.text, owner: c.owner, vector: vectors[i] }))
  saveStore([...docs.filter((d) => !merged.some((m) => m.id === d.id)), ...merged])
  return { imported: chunks.length, mode }
}

// ── 8. BÚSQUEDA VECTORIAL ──
export function searchLocal(queryVec: number[], docs: LocalDoc[], k = 4, threshold = 0.2): LocalHit[] {
  return docs
    .map((d) => {
      const rawScore = cosine(queryVec, d.vector)
      const score = Number(rawScore.toFixed(4))
      return { id: d.id, owner: d.owner, score, passedThreshold: score >= threshold, snippet: d.text.slice(0, 140) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}

// ── 9. CHAT (fetch directo, OpenAI-compatible + Gemini) ──
interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

function resolveChat(keys: LocalApiKeys, provider: LocalProvider): { url: string; key: string; model: string; provider: string } {
  switch (provider) {
    case "openai":
      return { url: "https://api.openai.com/v1/chat/completions", key: keys.openai.trim(), model: "gpt-4o-mini", provider: "openai" }
    case "openrouter":
      return { url: "https://openrouter.ai/api/v1/chat/completions", key: keys.openrouter.trim(), model: "google/gemma-4-26b-a4b-it:free", provider: "openrouter" }
    case "groq":
      return { url: "https://api.groq.com/openai/v1/chat/completions", key: keys.groq.trim(), model: "llama-3.1-70b-versatile", provider: "groq" }
    case "gemini":
      return { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", key: keys.gemini.trim(), model: "gemini-1.5-flash", provider: "gemini" }
  }
}

export async function chatCompletion(
  keys: LocalApiKeys,
  provider: LocalProvider,
  messages: ChatMessage[]
): Promise<string> {
  const cfg = resolveChat(keys, provider)
  if (!cfg.key.trim()) {
    throw new Error(`La API Key para ${provider.toUpperCase()} no está configurada. Configúrala en el Gestor de API Keys.`)
  }

  if (cfg.provider === "gemini") {
    const system = messages.find((m) => m.role === "system")?.content ?? ""
    const history = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, parts: [{ text: m.content }] }))
    const res = await fetch(`${cfg.url}?key=${encodeURIComponent(cfg.key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history, systemInstruction: system ? { parts: [{ text: system }] } : undefined }),
    })
    if (!res.ok) throw new Error(`Chat HTTP ${res.status}: ${await safeErrorText(res)}`)
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  }

  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, messages, temperature: 0 }),
  })
  if (!res.ok) throw new Error(`Chat HTTP ${res.status}: ${await safeErrorText(res)}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ""
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data?.error?.message ?? data?.message ?? JSON.stringify(data).slice(0, 200)
  } catch {
    return res.statusText
  }
}