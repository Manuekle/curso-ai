import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"

const LLM_CODE = `// server/llm.ts — desacople de proveedor real de esta web (#XXI.6)
export function provider(): Provider {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "openai";
}

export function client(): OpenAI {
  // mismo SDK, cambia baseURL
  return provider() === "openrouter"
    ? new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// la app depende de chatCompletion(), nunca del proveedor directo
export async function chatCompletion(params, options?) {
  return client().chat.completions.create(params, options);
}`

const GWS = `Google Workspace = herramientas (Drive, Docs, Sheets, Gmail, Calendar)
Gemini = modelo

No confundas modelo con herramienta:
  OpenAI / Anthropic / Gemini  →  Agent  →  Google APIs
La decisión del modelo depende de requisitos, no de la integración.

MCP (#46): protocolo para estandarizar cómo los agentes acceden a
herramientas y contexto. NO reemplaza auth ni reglas de negocio.`

export function ArquitecturaLesson() {
  return (
    <LessonShell
      title="Arquitectura empresarial: ERP, Workspace, MCP"
      tag="doc.md #43-46 · #67-68"
      intro={
        <>
          <p>
            El patrón general (#43): Frontend → API Gateway → Backend → Orquestador → {`{Agent, RAG,
            Workflow}`} → {`{Tools, Vector DB, APIs}`} → {`{ERP, CRM, Google}`}.
          </p>
          <p>
            <strong>Agente + ERP (#44)</strong>: Usuario → Chat → Backend → Agent → Tool → ERP API → ERP.
            Nunca: Usuario → LLM → Base de datos. El LLM no ejecuta operaciones directas.
          </p>
          <p>
            <strong>Legacy (#54-57, CASO 6)</strong>: no asumas que legacy necesita agente. Investigá
            primero: ¿tiene API, DB, archivos, web services, middleware? Un adaptador que normalice a JSON
            (ej. CSV cada hora → parse → validar → guardar) es código tradicional, no IA.
          </p>
          <CodeBlock label="gws-mcp-herramientas.txt" code={GWS} />
        </>
      }
      code={{ label: "Desacople de proveedor real (server/llm.ts)", code: LLM_CODE }}
      interview="Tenés un ERP legacy que exporta CSV cada hora. ¿Cómo lo integrás a una arquitectura de agentes sin 'poner IA por poner IA'?"
      solution="File processor clásico, sin IA: poll al export → parsear CSV con código → validar/normalizar a JSON → cargar en la fuente de datos. Eso es determinista y barato. La IA entra donde aporta: preguntarle al agente sobre esos datos, no para parsearlos. Adapter desacopla el ERP del resto (#45): si mañana cambia el formato, solo cambia el adapter."
      prev={{ to: "/aprender/apis", label: "APIs" }}
      next={{ to: "/aprender/produccion", label: "Producción" }}
    />
  )
}

export default ArquitecturaLesson