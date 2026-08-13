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

export function EvaluacionLesson() {
  return (
    <LessonShell
      title="Evaluación de agentes (#61-63)"
      tag="doc.md #61-63"
      intro={
        <>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{METRICAS}</pre>
          <p>
            Armá un <strong>golden dataset</strong> con los casos que importan: la web ya tiene los inputs
            para construirlo (playground + demos).
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{GOLDEN}</pre>
          <p>
            <strong>Regression testing (#63)</strong>: cambiás un prompt → 95% correcto → 87%. Si no lo
            detectás antes de producción, te enterás con usuarios reales.
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
      solution="Test set fijo y representativo (casos normales, límites, adversarios) + métricas automáticas: exactitud, tasa de «no sé», retenciones, latencia, costo por caso. Toda propuesta (prompt, modelo, chunking) se evalúa contra el baseline en el mismo dataset: si no mejora la métrica que importa, no se mergea. Así «me suena mejor» se vuelve «subió 12% de exactitud correcta»."
      prev={{ to: "/aprender/costos-modelos", label: "Costos y modelos" }}
      next={{ to: "/aprender/casos", label: "Casos de arquitectura" }}
    />
  )
}

export default EvaluacionLesson