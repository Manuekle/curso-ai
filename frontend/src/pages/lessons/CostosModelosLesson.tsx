import { LessonShell } from "@/components/LessonShell"

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

export function CostosModelosLesson() {
  return (
    <LessonShell
      title="Costos y elección de modelos (#55-60)"
      tag="doc.md #55-60 · server/llm.ts"
      intro={
        <>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{COSTO}</pre>
          <p>
            Ejemplo real de esta web: 5 agentes × 5 llamadas = 25 llamadas/workflow × 10.000 workflows/día =
            250.000 llamadas. Antes de optimizar preguntá: <em>¿por qué 25?</em>. Eliminá redundancias,
            paralelizá, cacheá.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{ROUTING}</pre>
          <p>
            <strong>Elección (#59-60)</strong>: nunca respondas &quot;X es el mejor&quot;. Definí requisitos y
            hacé benchmark con tus casos reales (extracción, razonamiento, resumen, clasificación, tool
            calling) comparando calidad, costo, latencia, contexto, privacidad, integración.
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
    />
  )
}

export default CostosModelosLesson