import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"

const SERVER_CODE = `// server/rag.ts — lo que corre en tu backend (#24)
export async function embed(texts: string[]): Promise<number[][]> {
  // encoding_format float: Nvidia via OpenRouter rechaza el base64 por defecto del SDK
  const res = await client().embeddings.create({
    model: embeddingModel(),                  // nvidia/nemotron-3-embed-1b:free
    input: texts,
    encoding_format: "float",
  });
  return res.data.map((d) => d.embedding);
}

export function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, x, i) => s + x * b[i]!, 0);
  const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (norm(a) * norm(b));           // 1 = iguales, 0 = ortogonales
}`

const PRESETS = [
  { a: "perro", b: "gato" },
  { a: "perro", b: "avión" },
  { a: "hola", b: "adios" },
  { a: "política de vacaciones", b: "días de descanso del empleado" },
]

export function EmbeddingsLesson() {
  const [a, setA] = useState("perro")
  const [b, setB] = useState("gato")
  const [result, setResult] = useState<{ dims: number; sample: number[] } | null>(null)
  const [cos, setCos] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function run(ta = a, tb = b) {
    setLoading(true)
    setError("")
    setResult(null)
    setCos(null)
    try {
      const [emb, sim] = await Promise.all([
        fetch("/api/demo/embed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ta }) }),
        fetch("/api/demo/cosine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a: ta, b: tb }) }),
      ])
      if (!emb.ok || !sim.ok) throw new Error(`HTTP ${emb.status}/${sim.status}`)
      setResult(await emb.json())
      const simData = await sim.json()
      setCos(simData.cosine)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LessonShell
      title="Embeddings: texto → números (#24)"
      tag="doc.md #24 · server/rag.ts"
      intro={
        <>
          <p>
            Un <strong>embedding</strong> convierte texto en un vector de números. El modelo de embeddings
            aprende a ubicar textos con significado parecido <em>cerca</em> en el espacio vectorial, sin
            depender de palabras exactas: &quot;perro&quot; queda más cerca de &quot;gato&quot; que de &quot;avión&quot;.
          </p>
          <p>
            La <strong>similitud coseno</strong> mide el ángulo entre dos vectores: 1 = misma dirección
            (semánticamente parecidos), 0 = ortogonales (sin relación), -1 = opuestos.
          </p>
          <p>
            Los embeddings no son un índice de palabras clave: capturan significado. Por eso el retrieval
            funciona con sinónimos y reformulaciones.
          </p>
        </>
      }
      code={{ label: "Las funciones reales de tu server", code: SERVER_CODE }}
      interview="¿Por qué usar embeddings y no una búsqueda por palabras clave? ¿Qué limitaciones tienen?"
      solution="Semántica: '¿cuándo se considera stock bajo?' encuentra 'política de reposición' aunque no comparta palabras exactas — keywords fallan con sinónimos y parafraseo. Limitaciones: los embeddings no entienden reglas de negocio, no filtran permisos (autorización es capa aparte), el texto debe ser indexable (PDFs escaneados no), y hay un costo de procesar y actualizar el corpus."
      prev={{ to: "/aprender/chunks", label: "Chunks" }}
      next={{ to: "/aprender/retrieval", label: "Búsqueda vectorial" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: similitud con el modelo real</CardTitle>
          <CardDescription>Llamadas reales a embeddings (nemotron-3-embed-1b) + cosine del server</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.a + p.b}
                variant="outline"
                size="sm"
                onClick={() => {
                  setA(p.a)
                  setB(p.b)
                  run(p.a, p.b)
                }}
              >
                “{p.a}” vs “{p.b}”
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="a">Texto A</Label>
              <Input id="a" value={a} onChange={(e) => setA(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="b">Texto B</Label>
              <Input id="b" value={b} onChange={(e) => setB(e.target.value)} />
            </div>
          </div>
          <div>
            <Button onClick={() => run()} disabled={loading || !a || !b}>
              {loading ? "Calculando…" : "Calcular similitud"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          {cos !== null && result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Similitud coseno:</span>
                <Badge variant={cos > 0.5 ? "default" : cos > 0.2 ? "secondary" : "outline"}>{cos}</Badge>
                <span className="text-xs text-muted-foreground">
                  {cos > 0.5 ? "semánticamente parecidos" : cos > 0.2 ? "levemente relacionados" : "sin relación clara"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">
                  Dimensión del vector: {result.dims} (texto: “{a}”)
                </p>
                <pre className="overflow-x-auto rounded-lg border bg-muted p-3 font-mono text-xs">
                  [{result.sample.join(", ")}, … {result.dims - result.sample.length} valores más]
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default EmbeddingsLesson