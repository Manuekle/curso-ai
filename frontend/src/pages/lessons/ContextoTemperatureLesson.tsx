import { Badge } from "@/components/ui/badge"
import { LessonShell } from "@/components/LessonShell"

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
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{TRADE_OFF}</pre>
          <p>
            La <strong>temperature</strong> controla (simplificado) cuánto varía la generación. Baja =
            consistencia; alta = variabilidad creativa.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{TEMP_USE}</pre>
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
    />
  )
}

export default ContextoTemperatureLesson