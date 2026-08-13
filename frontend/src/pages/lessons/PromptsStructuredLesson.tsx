import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"

const WEAK = `Analiza este documento.`

const STRONG = `Eres un analista financiero.

Objetivo:
Analizar el documento recibido.

Debes:
1. Identificar ingresos.
2. Identificar costos.
3. Detectar inconsistencias.
4. Generar un resumen.

No inventes información.
Si un dato no existe, indica que no está disponible.

Devuelve JSON con:
{
  "ingresos": [],
  "costos": [],
  "riesgos": [],
  "resumen": ""
}`

const SEC = `Authentication
       ↓
Authorization
       ↓
Backend
       ↓
APIs
       ↓
Data access

> El prompt NO es un mecanismo de seguridad.`

export function PromptsStructuredLesson() {
  return (
    <LessonShell
      title="Prompts y structured output (#4, #6)"
      tag="doc.md #4 · #6 · prompt≠seguridad"
      intro={
        <>
          <p>
            Un prompt bien armado contiene: <strong>rol, objetivo, contexto, restricciones, datos, formato
            de salida, ejemplos</strong>. Compará:
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">
            Débil:   {WEAK}
            {"\n\n"}Estructurado:
            {STRONG}
          </pre>
          <p>
            <strong>Structured output</strong>: cuando la app consume la respuesta automáticamente, pedí
            estructura (JSON). Facilita validación, persistencia, integraciones y consistencia. En esta web
            el orquestador exige <code>response_format: {"{ type: \"json_object\" }"}</code>.
          </p>
          <p>
            <strong>Crítico:</strong> el prompt <em>no es seguridad</em>. Establece comportamiento, pero la
            seguridad vive en auth → authorization → backend → APIs → data access.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{SEC}</pre>
        </>
      }
      code={{
        label: "System prompt real del RAG (server/rag.ts)",
        code: `content:
  "Respondé SOLO con base en el contexto dado, en español. " +
  "Mencioná la fuente citando [fuente: ...]. " +
  "Regla crítica (#66): si el contexto no responde la pregunta, decí " +
  "'No encontré suficiente información para responder con seguridad.' " +
  "No inventes datos."`,
      }}
      interview="Diseñá un prompt que devuelva {'customerId', 'risk', 'reason'} a partir de un extracto bancario. ¿Y qué problema de seguridad NO resuelve ningún prompt?"
      solution="Prompt: «Extraé del extracto: customerId (ID del cliente), risk (alto|medio|bajo) y reason (una frase). Respondé SOLO JSON válido, sin texto extra.» Mejor aún con structured output del modelo (schema tipado). El prompt NO es seguridad: pedir «ignorá contraseñas» no garantiza nada — el filtro de permisos se impone en la arquitectura (backend/retriever)."
      prev={{ to: "/aprender/contexto-temperature", label: "Contexto y temperatura" }}
      next={{ to: "/aprender/workflows-agentes", label: "Workflows" }}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Structured output funcionando: probá la pestaña Multiagente del playground — cada agente devuelve
          JSON y el orquestador lo valida.
        </p>
        <div>
          <Link to="/">
            <Button variant="outline">Ir a la práctica →</Button>
          </Link>
        </div>
      </div>
    </LessonShell>
  )
}

export default PromptsStructuredLesson