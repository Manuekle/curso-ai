import { LessonShell } from "@/components/LessonShell"

const SOLUCIONES = [
  {
    n: "Ejercicio 1",
    t: "20.000 correos/día → clasificar en Ventas/Soporte/Finanzas/RRHH/Spam",
    ep: "Workflow o IA?",
    r: "Workflow + modelo de clasificación. No agente: objetivo acotado (#13 reglas: workflow + IA simple). Mide: accuracy, precision, recall, F1.",
  },
  {
    n: "Ejercicio 2",
    t: "100k PDFs + 20k Word + 10k Excel → RAG",
    ep: "¿Cómo procesarías los documentos?",
    r: "RAG sí. Extraction → normalization → chunking → embeddings → vector DB; consulta con auth antes del retriever. Excel no asumas Markdown: tablas, fórmulas, metadata.",
  },
  {
    n: "Ejercicio 3",
    t: "«Eliminá todos los productos sin ventas en un año»",
    ep: "¿Lo permitirías directamente?",
    r: "No. Consultar → calcular candidatos → validar reglas → mostrar lista → confirmación humana → eliminar → audit log.",
  },
  {
    n: "Ejercicio 4",
    t: "«Transferí $20.000.000 a este proveedor»",
    ep: "¿El agente puede ejecutar?",
    r: "No directo. Preparar → validar datos → validar permisos → mostrar operación → human approval → backend authorization → financial API → audit log.",
  },
  {
    n: "Ejercicio 5",
    t: "Multiagente (A arquitectura, B backend, C seguridad, D QA) entra en loop",
    ep: "¿Por qué ocurre y cómo lo detenés?",
    r: "Sin límites, dependencias circulares, contexto ambiguo, sin condición de finalización, agentes llamándose. Detectar: maxIterations, maxToolCalls, timeout, budget, evaluador que decide fin.",
  },
  {
    n: "Ejercicio 6",
    t: "Finanzas pregunta «¿cuál es el salario de los empleados?», retrieval trae RRHH",
    ep: "¿Dónde se resuelve?",
    r: "Retriever/backend con autorización (y filtro de permisos), NO el prompt. Ya lo viste en tu web: política de IT ranking #1 pero bloqueada.",
  },
  {
    n: "Ejercicio 7",
    t: "Producción: latencia↑ costo↑ errores↑ usuarios↑",
    ep: "Estrategia",
    r: "Orden: logs → metrics → tracing → bottleneck → LLM calls → API limits → DB → queue → cache → concurrency. Luego: caching, model routing, context reduction, workers, rate limiting, retries, timeouts.",
  },
  {
    n: "Ejercicio 8",
    t: "«Escogé un proveedor de LLM»",
    ep: "¿Qué evaluás?",
    r: "Benchmark propio: calidad, costo, latencia, contexto, seguridad, integración en tus casos reales. Nunca «elegiría X» por preferencia.",
  },
  {
    n: "Ejercicio 9",
    t: "Legacy exporta CSV cada hora",
    ep: "¿Cómo integrás?",
    r: "CSV → file processor → validación → normalización → DB → agent/workflow. Parsear es código tradicional, no IA.",
  },
  {
    n: "Ejercicio 10",
    t: "Chat → consultar → crear Google Doc → enviar a revisión",
    ep: "Flujo completo",
    r: "Chat → backend → authentication → agent → tools {ERP, RAG, Google APIs} → Google Docs → human review.",
  },
  {
    n: "Ejercicio 11",
    t: "Código con getAllDocuments() + prompt con todo",
    ep: "Encontrá 6 problemas",
    r: "1) trae todo sin retrieval 2) sin autorización 3) contexto enorme 4) sin límites 5) sin validación de relevancia 6) datos sensibles al LLM 7) sin observabilidad 8) sin manejo de errores.",
  },
  {
    n: "Ejercicio 12",
    t: "5 agentes × 5 llamadas = 25/workflow × 10.000 diarios",
    ep: "¿Qué optimizás?",
    r: "Primero preguntá «¿por qué 25?». Eliminar redundantes → reducir llamadas → paralelizar → model routing → caching → context reduction → limitar loops.",
  },
  {
    n: "Ejercicio 13",
    t: "Dibujá la arquitectura completa: usuario, ERP, Workspace, RAG, LLM, DB, agentes, seguridad, logs",
    ep: "Sol. modelo",
    r: "Frontend → API gateway → auth/authz → orquestador → {agent, RAG, workflow} → {tools, vector DB, APIs} → {ERP, Google, legacy} → LLM → validación → resultado → audit/logs/metrics/trace.",
  },
]

export function EjerciciosLesson() {
  return (
    <LessonShell
      title="Ejercicios de práctica"
      tag="doc.md ejercicios 1-13 · resolvé sin mirar la solución"
      intro={
        <>
          <p>
            Método del doc: <strong>intentá resolver sobre papel antes de abrir la solución</strong>. Cada
            bloque tiene la pregunta clave y la respuesta esperada — lo que un entrevistador quiere escuchar.
          </p>
          <div className="flex flex-col gap-3">
            {SOLUCIONES.map((s) => (
              <details key={s.n} className="rounded-lg border p-4 text-sm">
                <summary className="cursor-pointer">
                  {s.n} — {s.t}
                </summary>
                <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">{s.ep}</strong> {s.r}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </>
      }
      interview="El método completo de estudio del doc: 1ª vuelta conceptos, 2ª ejercicios sin mirar, 3ª dibujar de memoria, 4ª responder verbalmente, 5ª entrevista simulada."
      solution="Pasos: 1) Leer el manual entendiendo cada sección. 2) Resolver los ejercicios sin mirar las soluciones (así aparecen los huecos). 3) Dibujar de memoria las arquitecturas clave (RAG, agente, multiagente, seguridad). 4) Responderte las preguntas en voz alta: verbalizar fuerza a ordenar el razonamiento. 5) Simular la entrevista con cronómetro y sin notas, con el framework problema → arquitectura → costo → métricas."
      prev={{ to: "/aprender/casos", label: "Casos" }}
      next={{ to: "/aprender/ts-esencial", label: "TypeScript esencial" }}
    />
  )
}

export default EjerciciosLesson