import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"
import { NumberPopIn } from "@/components/NumberPopIn"
import { AIErrorCard } from "@/components/AIErrorCard"

const SERVER_CODE = `// server/rag.ts — lo que corre en tu backend (#25, #28)
function search(queryVec: number[], k = 4): Doc[] {
  return store
    .map((d) => ({ d, score: cosine(queryVec, d.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.d);
}

 // #28 — PERMISSION FILTER ANTES de que el documento llegue al LLM
 const allowed = hits.filter((d) => userCanAccess(user, d.owner));

// ── Producción (ilustrativo): hybrid + rerank ───────────────────────────────
// 1. Top-K AMPLIO (ej. 50) mezclando semántica (embeddings) y léxico (BM25)
//    → los códigos y siglas que la semántica pierde, el léxico los rescata.
// 2. Filtro de permisos sobre los candidatos (metadatos: owner/tenant).
// 3. Reranker (cross-encoder) reordena comparando pregunta vs candidato.
// 4. Solo el top-N final (ej. 5) entra al contexto del LLM.
// /api/demo/rerank simula el paso 1→4 con una señal léxica de solape de tokens.`

interface Hit {
  id: string
  owner: string
  score: number
  permitted: boolean
  snippet: string
}

interface RerankHit extends Hit {
  overlap: number
}

interface RerankData {
  raw: RerankHit[]
  reranked: RerankHit[]
}

function HitRow({ h }: { h: RerankHit }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs">{h.id}</span>
        <Badge variant="secondary">owner: {h.owner}</Badge>
        <Badge variant="outline">
          coseno: <NumberPopIn value={h.score} />
        </Badge>
        <Badge variant="outline">
          léxico: <NumberPopIn value={h.overlap} />
        </Badge>
        <Badge variant={h.permitted ? "default" : "destructive"}>
          {h.permitted ? "permitido" : "bloqueado"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{h.snippet}…</p>
    </div>
  )
}

export function RetrievalLesson() {
  const [question, setQuestion] = useState("¿Cada cuánto se rotan las contraseñas?")
  const [user, setUser] = useState("demo")
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [rerank, setRerank] = useState<RerankData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    setError("")
    setHits(null)
    setRerank(null)
    try {
      const activeProvider = (localStorage.getItem("active-provider") as string) || "openrouter"
      const apiKeys = JSON.parse(localStorage.getItem("api-keys") || "{}")
      const config = { provider: activeProvider, apiKey: apiKeys[activeProvider] }

      const res = await fetch("/api/demo/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user, config }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      setHits((await res.json()).hits)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function runRerank() {
    setLoading(true)
    setError("")
    setHits(null)
    setRerank(null)
    try {
      const activeProvider = (localStorage.getItem("active-provider") as string) || "openrouter"
      const apiKeys = JSON.parse(localStorage.getItem("api-keys") || "{}")
      const config = { provider: activeProvider, apiKey: apiKeys[activeProvider] }

      const res = await fetch("/api/demo/rerank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user, config }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      setRerank(await res.json())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LessonShell
      title="Retrieval: top-K, permisos, hybrid y rerank"
      tag="doc.md #25 · #28 · “Reranking y búsqueda híbrida” · server/rag.ts"
      intro={
        <>
          <p>
            La pregunta se embebe con el mismo modelo y se comparan todos los vectores de la store con
            <strong> similitud coseno</strong>. Los K más cercanos son los candidatos a contexto.
          </p>
          <p>
            Ojo: la búsqueda es <strong>semántica, no autorizada</strong>. Un documento del owner IT puede
            quedar primero por similitud aunque el usuario no tenga permiso. Por eso el filtro de permisos
            va <strong>después del retrieval y antes del LLM</strong> (#28): el documento nunca llega al modelo.
          </p>
          <p>
            En producción la store es una base vectorial (pgvector, Pinecone, Qdrant) con índice tipo ANN
            (HNSW/IVF) y <strong>metadata filtering</strong>; acá es un array en memoria con fuerza bruta — para
            aprender es ideal.
          </p>
          <p>
            El top-K crudo no siempre es el mejor contexto: la semántica pierde códigos y siglas que la
            <strong> búsqueda léxica</strong> (BM25) rescata, y el orden por coseno no es orden por relevancia.
            Por eso producción usa <strong>hybrid search + reranker</strong> (cross-encoder): recuperar K amplio,
            filtrar permisos, reordenar y recién ahí armar contexto. Probalo abajo: el rerank híbrido
            simulado reordena el top 8 con señal léxica.
          </p>
        </>
      }
      code={{ label: "La búsqueda, el filtro y el pipeline de producción", code: SERVER_CODE }}
      interview="Recuperás top-K por embeddings y la respuesta es mala para consultas con códigos de producto (ej. 'SKU-4412'). ¿Qué cambiás? ¿Y dónde entra el filtro de permisos en un pipeline con reranker?"
      solution="Hybrid search: combinar embeddings con búsqueda léxica (BM25/full-text) porque los códigos y acrónimos no tienen representación semántica buena; además probar query rewriting y reranker (cross-encoder) sobre un top-K amplio. Orden del pipeline: retrieval amplio → metadata filter (owner/tenant) → rerank sobre permitidos → top-N → LLM (#28). El filtro va ANTES del rerank y del LLM: el modelo nunca ve documentos no autorizados, sin importar qué tan relevantes parezcan."
      prev={{ to: "/aprender/embeddings", label: "Embeddings" }}
      next={{ to: "/aprender/rag", label: "RAG" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: retrieval crudo de tu store</CardTitle>
          <CardDescription>
            Pregunta fija (contraseñas) que debería matchear la política de seguridad… de owner IT
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="q">Pregunta</Label>
              <Input id="q" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u">Usuario</Label>
              <div className="flex gap-2">
                {(["demo", "admin"] as const).map((u) => (
                  <Button
                    key={u}
                    variant={user === u ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUser(u)}
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={run} disabled={loading || !question}>
              {loading ? "Buscando…" : "Buscar top 5"}
            </Button>
            <Button variant="secondary" onClick={runRerank} disabled={loading || !question}>
              {loading ? "Rerankando…" : "Top 8 → rerank híbrido"}
            </Button>
          </div>

          {error && <AIErrorCard error={error} />}

          {hits && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                <NumberPopIn value={hits.filter((h) => h.permitted).length} /> de{" "}
                <NumberPopIn value={hits.length} /> resultados llegarían al LLM como {user}
              </p>
              {hits.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{h.id}</span>
                    <Badge variant="secondary">owner: {h.owner}</Badge>
                    <Badge variant="outline">
                      score: <NumberPopIn value={h.score} />
                    </Badge>
                    <Badge variant={h.permitted ? "default" : "destructive"}>
                      {h.permitted ? "permitido" : "bloqueado"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.snippet}…</p>
                </div>
              ))}
            </div>
          )}

          {rerank && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Top 8 por coseno → top 5 con señal léxica (solape de tokens). El reranker real (cross-encoder)
                hace lo mismo con un modelo dedicado.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Top 8 crudo (coseno)</p>
                  {rerank.raw.map((h) => (
                    <HitRow key={h.id} h={h} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Top 5 reranked (coseno + léxico)</p>
                  {rerank.reranked.map((h) => (
                    <HitRow key={h.id} h={h} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <NumberPopIn value={rerank.reranked.filter((h) => h.permitted).length} /> de{" "}
                <NumberPopIn value={rerank.reranked.length} /> llegarían al LLM como {user}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default RetrievalLesson
