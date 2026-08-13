import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"
import { LiquidSlider } from "@/components/LiquidSlider"
import { NumberPopIn } from "@/components/NumberPopIn"

const TRADE_OFF = `Más contexto puede significar:
  ✗ mayor costo        ✗ más ruido
  ✗ mayor latencia     ✗ info irrelevante
  ✗ más complejidad    ✗ peor foco del modelo

La optimización: contexto NECESARIO, no el MÁXIMO posible.`

const TEMP_USE = `Temperature baja (0-0.3)
  → extracción de datos, clasificación, retrieval, JSON
  → consistencia y determinismo

Temperature alta (0.7-1+)
  → textos creativos, variación deseada

Importante: temperature NO convierte un modelo en "más inteligente".`

export function ContextoTemperatureLesson() {
  const [temp, setTemp] = useState<number>(0.0)

  return (
    <LessonShell
      title="Context window y temperature"
      tag="doc.md #3 · #5"
      intro={
        <>
          <p>
            El <strong>context window</strong> es la cantidad máxima de información que el modelo procesa
            por interacción. Error común: &quot;si soporta mucho contexto, le mando todo&quot;. No necesariamente.
          </p>
          <CodeBlock label="context-window-tradeoffs.txt" code={TRADE_OFF} />
          <p>
            La <strong>temperature</strong> controla (simplificado) cuánto varía la generación. Baja =
            consistencia; alta = variabilidad creativa.
          </p>
          <CodeBlock label="usos-temperature.txt" code={TEMP_USE} />
          <p>
            En esta web es un parámetro real: <Badge variant="outline">temperature: 0</Badge> en
            <code> server/llm.ts → chatCompletion()</code> — usado por agente, RAG y orquestador, porque
            todos son tareas de exactitud, no de creatividad.
          </p>
        </>
      }
      code={{
        label: "Temperature real de esta web (server/llm.ts wrapper)",
        code: `// server/agent.ts, rag.ts, orchestrator.ts → todo pasa por chatCompletion()
const res = await chatCompletion({
  model: chatModel(),
  temperature: 0,   // #5 baja temperatura → consistencia
  messages,
});`,
      }}
      interview="El modelo soporta 200k tokens de contexto. ¿Le envías todo el corpus? ¿Qué temperature usarías para extraer datos de facturas?"
      solution="No: enviar todo el corpus no escala — cuesta tokens de entrada, aumenta latencia y mete ruido. Se selecciona lo relevante antes (retrieval). Para extraer datos de facturas: temperature 0 (tarea determinista, repetible, sin inventar campos). Para ideas o textos creativos: temperature alta."
      prev={{ to: "/aprender/fundamentos", label: "LLM y tokens" }}
      next={{ to: "/aprender/prompts-structured", label: "Prompts y structured output" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Simulador: impacto de la Temperature</CardTitle>
          <CardDescription>Ajustá la temperature con la animación líquida y mirá el régimen de generación</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tempSlider" className="text-xs font-medium">
                Temperature = <NumberPopIn value={temp.toFixed(2)} />
              </Label>
              <Badge variant={temp <= 0.3 ? "default" : temp <= 0.7 ? "secondary" : "outline"}>
                {temp <= 0.3 ? "Determinista (RAG / JSON / Agentes)" : temp <= 0.7 ? "Equilibrado" : "Creativo / Alta Variabilidad"}
              </Badge>
            </div>
            <LiquidSlider
              id="tempSlider"
              min={0.0}
              max={1.0}
              step={0.05}
              value={temp}
              onChange={setTemp}
            />
          </div>

          <div className="rounded-lg border p-3 text-xs flex flex-col gap-1.5 bg-muted/20">
            <span className="font-semibold text-muted-foreground">Comportamiento esperado en producción:</span>
            {temp <= 0.3 ? (
              <p className="text-emerald-500 font-medium">
                ✓ Puntero en top tokens con máxima probabilidad. Salida estructurada JSON exacta, sin alucinaciones de formato, ideal para RAG y tool calling.
              </p>
            ) : temp <= 0.7 ? (
              <p className="text-primary font-medium">
                ~ Distribución suavizada. Variación moderada en sinónimos y redacción de respuestas.
              </p>
            ) : (
              <p className="text-amber-500 font-medium">
                ⚠ Alta entropía. El modelo puede elegir tokens menos probables, introduciendo creatividad pero arriesgando errores en datos exactos o esquemas JSON.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default ContextoTemperatureLesson