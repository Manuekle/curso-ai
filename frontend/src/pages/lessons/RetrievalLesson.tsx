import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"

const SERVER_CODE = `// server/rag.ts — lo que corre en tu backend (#25, #28)
function search(queryVec: number[], k = 4): Doc[] {
  return store
    .map((d) => ({ d, score: cosine(queryVec, d.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.d);
}

 // #28 — PERMISSION FILTER ANTES de que el documento llegue al LLM
 const allowed = hits.filter((d) => userCanAccess(user, d.owner));`

interface Hit {
  id: string
  owner: string
  score: number
  permitted: boolean
  snippet: string
}

export function RetrievalLesson() {
  const [question, setQuestion] = useState("¿Cada cuánto se rotan las contraseñas?")
  const [user, setUser] = useState("demo")
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    setError("")
    setHits(null)
    try {
      const res = await fetch("/api/demo/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setHits((await res.json()).hits)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LessonShell
      title="Búsqueda vectorial: top-K con scores (#25)"
      tag="doc.md #25 · #28 · server/rag.ts"
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
            En producción la store es una base vectorial (pgvector, Pinecone, Qdrant) con búsqueda por
            índice tipo ANN; acá es un array en memoria con fuerza bruta — para aprender es ideal.
          </p>
        </>
      }
      code={{ label: "La búsqueda y el filtro reales", code: SERVER_CODE }}
      interview="Tienen 500.000 documentos y un usuario solo puede ver 2.500. ¿Dónde aplicás el filtro de permisos y por qué?"
      solution="En el backend, en el retriever, ANTES de que el contexto llegue al LLM (#28). Nunca en el prompt ni en el modelo: el prompt no es seguridad y el modelo no tiene por qué saber el ACL. Flujo: retrieval top-K → filtro por owner permitido → recién ahí armar contexto → LLM. El documento del owner IT jamás entra al modelo."
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
          <div>
            <Button onClick={run} disabled={loading || !question}>
              {loading ? "Buscando…" : "Buscar top 5"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          {hits && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {hits.filter((h) => h.permitted).length} de {hits.length} resultados llegarían al LLM como {user}
              </p>
              {hits.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{h.id}</span>
                    <Badge variant="secondary">owner: {h.owner}</Badge>
                    <Badge variant="outline">score: {h.score}</Badge>
                    <Badge variant={h.permitted ? "default" : "destructive"}>
                      {h.permitted ? "permitido" : "bloqueado"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{h.snippet}…</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default RetrievalLesson