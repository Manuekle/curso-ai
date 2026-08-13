import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"

const CORTAS = `Respuestas cortas para memorizar (#XXIII):

Agente     → sistema orientado a objetivos que decide y usa herramientas.
RAG        → recupera información relevante para dar contexto al LLM antes de generar.
Embedding  → representación vectorial para comparar información semánticamente.
Workflow   → secuencia de pasos definidos para automatizar.
Orquestador→ coordina agentes, herramientas, contexto y resultados.
Reducir costos → menos contexto, menos llamadas, modelos adecuados, caching, límites.
Proteger datos → auth, authorization, least privilege, minimización, validación, auditoría.
Evitar loops  → maxIterations, límites, timeout, budget, condiciones de fin.
Elegir LLM    → benchmark: calidad, costo, latencia, seguridad, contexto, integración.
¿RAG elimina alucinaciones? → No. Las reduce; necesito fuentes y validación.
¿Prompt es seguridad? → No. Los permisos se imponen en la arquitectura.
¿Siempre IA? → No. Workflow tradicional si resuelve mejor.`

const QUINCE = `Las 15 ideas que debés recordar (#XXVIII):
1  No todo necesita IA.
2  No todo lo que necesita IA necesita un agente.
3  El prompt no es seguridad.
4  Los permisos deben estar en la arquitectura.
5  El LLM no debería ejecutar operaciones críticas directamente.
6  Las tools controlan las acciones del agente.
7  RAG reduce contexto innecesario y da info relevante.
8  RAG no garantiza cero alucinaciones.
9  Más agentes no significa mejor arquitectura.
10 El modelo más potente no siempre es el mejor.
11 Primero medí costos antes de optimizar.
12 En producción necesitás observabilidad.
13 Para acciones críticas: validación y posible aprobación humana.
14 Las reglas de negocio viven en la aplicación, no en el modelo.
15 La IA debe generar valor de negocio, no demostrar tecnología.`

export function EntrevistaLesson() {
  return (
    <LessonShell
      title="Simulacro: respuestas cortas, 15 ideas, método"
      tag="doc.md #XVII-XXVIII · todo el material"
      intro={
        <>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{CORTAS}</pre>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{QUINCE}</pre>
          <p>
            <strong>Respuesta modelo (#XXVI)</strong> para &quot;diseñá una solución de IA&quot;: entender el
            proceso → separar determinista de IA → código/workflows/APIs para determinista → herramientas del
            agente + permisos → RAG si hay documentación → validaciones + aprobación humana en crítico →
            observabilidad, costos, errores, escalabilidad, métricas de valor.
          </p>
          <p>
            <strong>Frase final</strong>: &quot;Mi enfoque no es usar IA por usar IA. Primero entiendo el problema
            y diseño una arquitectura donde LLM, agentes, APIs y reglas trabajen de forma controlada, segura,
            observable y con costos sostenibles.&quot;
          </p>
          <p>
            <strong>Método de estudio (#XXVII)</strong>: 1ª vuelta conceptos → 2ª ejercicios sin mirar →
            3ª dibujar de memoria → 4ª verbalizar → 5ª entrevista simulada completa.
          </p>
        </>
      }
      interview="Última práctica: hacete la entrevista completa sin mirar. Problema → arquitectura → seguridad → IA → integración → costos → producción → métricas."
      solution="Estructura para responder cualquier caso: 1) Problema: qué necesita el negocio, qué es IA y qué no. 2) Arquitectura: flujo de datos completo (ingesta → pipeline → consulta), decisiones de diseño. 3) Seguridad: auth + autorización ANTES del LLM, datos sensibles. 4) IA: workflow vs agente, modelos, prompts. 5) Integración: APIs, webhooks, idempotencia. 6) Costos: tokens, caché, routing. 7) Producción: observabilidad, retries, límites. 8) Métricas: cómo se evalúa y mejora con datos."
      prev={{ to: "/aprender/ts-esencial", label: "TypeScript" }}
      next={undefined}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Toda la teoría de esta página ya está implementada y demostrable en la práctica — usala de
          evidencia en la entrevista.
        </p>
        <div>
          <Link to="/">
            <Button>Volver a la práctica →</Button>
          </Link>
        </div>
      </div>
    </LessonShell>
  )
}

export default EntrevistaLesson