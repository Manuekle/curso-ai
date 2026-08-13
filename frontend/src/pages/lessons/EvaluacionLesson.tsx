import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonShell } from "@/components/LessonShell"

const GOLDEN = `// golden dataset (#62): casos con respuesta esperada
const dataset = [
  { input: "stock LAP-001", tool: "consultarInventario", expected: "5" },
  { input: "registrá 3 de MOU-001", tool: "registrarPedido", expected: "stock 0" },
  { input: "¿política de seguridad?", filter: "bloqueado", expected: "sin datos" },
  { input: "¿cuándo stock bajo?", rag: "politica-inventario", expected: "< 10" },
];

// corre contra cambios de prompt/modelo/RAG/tools/orquestación (#62)
// y detecta regresiones antes de producción (#63): 95% → 87% = no deploy`

const METRICAS = `¿Cómo sabés que un agente funciona? No basta con "respondió":

  Correctness  → ¿la respuesta es correcta?
  Relevance    → ¿responde lo que se preguntó?
  Groundedness → ¿está sustentada en las fuentes?
  Tool success → ¿usó bien las herramientas?
  Safety       → ¿respetó permisos y restricciones?
  Cost         → ¿cuánto cuesta?
  Latency      → ¿cuánto demora?

  + accuracy, precision, recall, F1 para clasificación.`

const METRICAS_RETRIEVAL = `El retrieval también se mide, con queries etiquetadas (#61 + "Métricas de retrieval"):

  recall@k  → ¿apareció el documento relevante en el top-k?
  precision@k → ¿cuánto del top-k era relevante?
  MRR       → ¿en qué posición aparece el primer documento relevante?

  Se decide reranking, embeddings y chunking con estas métricas, no por intuición.`

interface TopHit {
  id: string
  score: number
}

interface EvalRow {
  q: string
  relevant: string
  topK: TopHit[]
  recall: { k1: boolean; k3: boolean; k5: boolean }
  precisionK5: number
  mrr: number
}

interface EvalResult {
  perQuery: EvalRow[]
  aggregate: { recallAt1: number; recallAt3: number; recallAt5: number; mrr: number }
}

export function EvaluacionLesson() {
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function runEval() {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/demo/eval-retrieval", { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult(await res.json())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LessonShell
      title="Evaluación de agentes y retrieval (#61-63)"
      tag="doc.md #61-63 · “Métricas de retrieval (RAG)” · server/app.ts"
      intro={
        <>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{METRICAS}</pre>
          <p>
            Armá un <strong>golden dataset</strong> con los casos que importan: la web ya tiene los inputs
            para construirlo (playground + demos).
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{GOLDEN}</pre>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{METRICAS_RETRIEVAL}</pre>
          <p>
            <strong>Regression testing (#63)</strong>: cambiás un prompt → 95% correcto → 87%. Si no lo
            detectás antes de producción, te enterás con usuarios reales.
          </p>
          <p>
            Abajo corre la evaluación real sobre la store: 4 golden queries etiquetadas → recall@k, precision@k
            y MRR calculados con el retrieval de verdad. Así se decide si un cambio de embeddings/chunking
            mejora o empeora — con datos, no “se ve mejor”.
          </p>
        </>
      }
      code={{
        label: "Las 5 preguntas que cierran la entrevista (doc §61)",
        code: `// extends también al benchmark de modelos (#60)
const benchmark = [
  { test: "extracción", modeloA: 90, modeloB: 93, modeloC: 87 },
  { test: "razonamiento", ... },
  { test: "resumen", ... },
  { test: "clasificación", ... },
  { test: "tool calling", ... },
];
// elegí por datos con calidad/costo/latencia, no por popularidad`,
      }}
      interview="Tu equipo pide 'cambiar el prompt' y 'probar otro modelo'. ¿Cómo justificás cada cambio con datos antes de tocar producción?"
      solution="Test set fijo y representativo (casos normales, límites, adversarios) + métricas automáticas: exactitud, tasa de «no sé», retenciones, latencia, costo por caso. Toda propuesta (prompt, modelo, chunking) se evalúa contra el baseline en el mismo dataset: si no mejora la métrica que importa, no se mergea. Para RAG sumá recall@k y MRR sobre queries etiquetadas. Así «me suena mejor» se vuelve «subió 12% de exactitud correcta»."
      prev={{ to: "/aprender/costos-modelos", label: "Costos y modelos" }}
      next={{ to: "/aprender/casos", label: "Casos de arquitectura" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: evaluación de retrieval con métricas reales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Button onClick={runEval} disabled={loading}>
              {loading ? "Evaluando…" : "Correr evaluación (golden set → recall@k + MRR)"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Agregado sobre {result.perQuery.length} queries:</span>
                <Badge variant="secondary">recall@1: {result.aggregate.recallAt1}</Badge>
                <Badge variant="secondary">recall@3: {result.aggregate.recallAt3}</Badge>
                <Badge variant="secondary">recall@5: {result.aggregate.recallAt5}</Badge>
                <Badge variant="secondary">MRR: {result.aggregate.mrr}</Badge>
              </div>

              {result.perQuery.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.q}</span>
                    <Badge variant="outline">relevante: {row.relevant}</Badge>
                    <Badge variant={row.recall.k1 ? "default" : "destructive"}>
                      {row.recall.k1 ? "hit@1" : row.recall.k3 ? "hit@3" : row.recall.k5 ? "hit@5" : "no en top-5"}
                    </Badge>
                    <Badge variant="outline">precision@5: {row.precisionK5}</Badge>
                    <Badge variant="outline">MRR: {row.mrr}</Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    {row.topK.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <span className="min-w-0 flex-1 truncate">{h.id}</span>
                        <span>{h.score}</span>
                        {h.id.startsWith(row.relevant) && <Badge>relevante</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default EvaluacionLesson
