import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"
import { NumberPopIn } from "@/components/NumberPopIn"

const COSTO = `Costo =
  Tokens entrada + Tokens salida
  + Número de llamadas
  + Infraestructura
  + Herramientas externas

Optimización (primero MEDÍ, después optimizá):
  1. Reducir contexto        6. Limitar iteraciones
  2. Reducir llamadas        7. Paralelizar
  3. Seleccionar modelos     8. Eliminar IA innecesaria
  4. Cachear                 9. Evaluar modelos alternativos
  5. Resumir memoria`

const ROUTING = `Model routing (#57): no todas las tareas necesitan el mismo modelo.

  Clasificación        → modelo económico
  Extracción           → modelo eficiente
  Razonamiento complejo → modelo más capaz

API vs open source (#58):
  API: rápido, sin infra, escalable — pero dependencia y costo por uso
  OSS: control y personalización — pero GPU, DevOps, mantenimiento`

// Precios aproximados por 1M tokens (USD), entrada/salida.
// VERIFICAR siempre en la página oficial del proveedor: cambian seguido.
const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", in: 0.15, out: 0.6 },
  { id: "gemini-flash", label: "Gemini Flash", in: 0.3, out: 2.5 },
  { id: "claude-sonnet", label: "Claude Sonnet", in: 3.0, out: 15.0 },
  { id: "gpt-4o", label: "GPT-4o", in: 2.5, out: 10.0 },
  { id: "claude-opus", label: "Claude Opus", in: 15.0, out: 75.0 },
] as const

const PRESETS = [
  {
    label: "Clasificación simple",
    tokensIn: 400,
    tokensOut: 50,
    callsPerDay: 20000,
  },
  {
    label: "RAG: pregunta + 3 chunks",
    tokensIn: 3000,
    tokensOut: 300,
    callsPerDay: 5000,
  },
  {
    label: "Workflow multiagente (25 llamadas)",
    tokensIn: 25000,
    tokensOut: 2500,
    callsPerDay: 1000,
  },
]

const DAYS_PER_MONTH = 22

export function CostosModelosLesson() {
  const [tokensIn, setTokensIn] = useState(3000)
  const [tokensOut, setTokensOut] = useState(300)
  const [callsPerDay, setCallsPerDay] = useState(5000)

  const dayCost = (m: (typeof MODELS)[number]) =>
    ((tokensIn / 1e6) * m.in + (tokensOut / 1e6) * m.out) * callsPerDay

  const monthCost = (m: (typeof MODELS)[number]) => dayCost(m) * DAYS_PER_MONTH

  return (
    <LessonShell
      title="Costos y elección de modelos"
      tag="doc.md #55-60 · server/llm.ts"
      intro={
        <>
          <CodeBlock label="calculo-costo.txt" code={COSTO} />
          <p>
            Ejemplo real de esta web: 5 agentes × 5 llamadas = 25 llamadas/workflow × 10.000 workflows/día =
            250.000 llamadas. Antes de optimizar preguntá: <em>¿por qué 25?</em>. Eliminá redundancias,
            paralelizá, cacheá.
          </p>
          <CodeBlock label="model-routing.txt" code={ROUTING} />
          <p>
            <strong>Elección (#59-60)</strong>: nunca respondas &quot;X es el mejor&quot;. Definí requisitos y
            hacé benchmark con tus casos reales (extracción, razonamiento, resumen, clasificación, tool
            calling) comparando calidad, costo, latencia, contexto, privacidad, integración.
          </p>
          <p>
            La calculadora de abajo convierte tokens → dólares por día/mes para ver el impacto real del
            <strong> model routing</strong>: un modelo caro en una tarea de clasificación se paga carísimo sin
            ganar calidad. Precios aproximados — el ejercicio es el orden de magnitud, no el centavo.
          </p>
        </>
      }
      code={{
        label: "Model routing real de esta web (server/llm.ts)",
        code: `export function chatModel(): string {
  return provider() === "openrouter"
    ? process.env.OPENROUTER_MODEL ?? "google/gemma-4-26b-a4b-it:free"
    : process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}
// un env var = swap de modelo sin tocar código (#XXI.6 desacople)`,
      }}
      interview="25 llamadas por workflow × 10.000 workflows al día. ¿Qué optimizarías y en qué orden? ¿Cómo elegís entre OpenAI, Anthropic, Gemini u open source?"
      solution="Orden: 1) reducir llamadas y tokens (contexto filtrado, retrieval, prompts cortos), 2) cache de resultados repetidos, 3) model routing: modelo barato para tareas simples, caro solo donde importa — no un modelo para todo (#57). Elección: benchmark propio con tus casos (no pure marketing): calidad requerida, latencia, costo por tarea, cumplimiento/privacidad. Open source: control y costo, pero pagás infra y operación."
      prev={{ to: "/aprender/produccion", label: "Producción" }}
      next={{ to: "/aprender/evaluacion", label: "Evaluación" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de costos: tokens → USD</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTokensIn(p.tokensIn)
                  setTokensOut(p.tokensOut)
                  setCallsPerDay(p.callsPerDay)
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tokensIn">Tokens entrada / llamada</Label>
              <Input
                id="tokensIn"
                type="number"
                min={0}
                value={tokensIn}
                onChange={(e) => setTokensIn(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tokensOut">Tokens salida / llamada</Label>
              <Input
                id="tokensOut"
                type="number"
                min={0}
                value={tokensOut}
                onChange={(e) => setTokensOut(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="callsPerDay">Llamadas / día</Label>
              <Input
                id="callsPerDay"
                type="number"
                min={0}
                value={callsPerDay}
                onChange={(e) => setCallsPerDay(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">Modelo</th>
                  <th className="p-3">$/día</th>
                  <th className="p-3">$/mes ({DAYS_PER_MONTH} días)</th>
                  <th className="p-3">Rol sugerido</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => {
                  const month = monthCost(m)
                  const cheapest = Math.min(...MODELS.map(monthCost))
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{m.label}</td>
                      <td className="p-3">
                        $<NumberPopIn value={dayCost(m).toFixed(2)} />
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          $<NumberPopIn value={month.toFixed(2)} />
                          {month === cheapest && <Badge>más barato</Badge>}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {m.id === "gpt-4o-mini" || m.id === "gemini-flash"
                          ? "clasificación, extracción, routing (#57)"
                          : m.id === "claude-sonnet" || m.id === "gpt-4o"
                            ? "razonamiento, tool calling"
                            : "casos críticos donde la calidad justifica el costo"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Precios aproximados por 1M tokens (USD) — verificá siempre la página oficial del proveedor.
            El punto no es el valor exacto sino el orden de magnitud: la misma carga cuesta 10–100× según
            modelo, y el routing decide dónde se paga.
          </p>
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default CostosModelosLesson
