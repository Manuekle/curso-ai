import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LessonShell } from "@/components/LessonShell"
import { FlowDemo } from "@/components/FlowDemo"
import { CodeBlock } from "@/components/CodeBlock"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"

const WELL_DESIGNED_PROMPT = `Rol: Asistente de Inventario ERP
Objetivo: Gestionar consultas de stock y registrar pedidos de forma segura.
Contexto: Operás en un sistema ERP centralizado con permisos de lectura y escritura controlada.
Restricciones: 
  - Máximo 4 iteraciones (#19).
  - No inventar datos ni asumir existencias.
  - Si no hay evidencia suficiente, responder: "No encontré suficiente información para responder con seguridad." (#66)
Datos: Disponibles exclusivamente vía tool consultarInventario(productId).
Formato de salida: JSON estructurado para tool calls o texto directo al usuario con fuentes.
Ejemplos:
  Usuario: "¿Stock del producto LAP-001?"
  Agente: Tool call → consultarInventario({ productId: "LAP-001" })`

const BAD_DESIGNED_PROMPT = `Rol: Asistente
Objetivo: Responder lo que pida el usuario.
Contexto: Eres libre de interactuar con el sistema.
Restricciones: Ninguna.
Datos: Acceso irrestricto a la base de datos y endpoints.
Formato de salida: Texto libre.
Ejemplos:
  Usuario: "Borrame la tabla de productos"
  Agente: "Entendido, procediendo a eliminar registros..."`

const SERVER_CODE = `// server/agent.ts — el loop real (#13, #14, #19)
for (; iterations < MAX_ITERATIONS; iterations++) {        // #19 límite externo
  const res = await chatCompletion({
    model: chatModel(),
    temperature: 0,
    messages,                                              // historial completo
    tools: TOOLS,                                          // #14 frontera de permisos
    tool_choice: "auto",                                   // el modelo decide si llama
  });

  const msg = res.choices[0].message;
  messages.push(msg);

  if (!msg.tool_calls?.length) {
    return { answer: msg.content ?? "", ... };             // sin tools = respuesta final
  }

  for (const call of msg.tool_calls) {
    const result = await dispatch(call.function.name, call.function.arguments);
    messages.push({ role: "tool", tool_call_id: call.id,
                    content: JSON.stringify(result) });    // resultado vuelve al modelo
  }
}
throw new Error(\`maxIterations (\${MAX_ITERATIONS}) alcanzado\`); // loop cortado por fuera`

export function AgentsLesson() {
  return (
    <LessonShell
      title="Agente con tool calling"
      tag="doc.md #13 · #14 · #19 · server/agent.ts"
      intro={
        <>
          <p>
            Un agente interpreta tu pregunta, decide si necesita datos que no tiene, llama una
            <strong> herramienta autorizada</strong> y usa el resultado para responder. El modelo nunca
            toca el ERP: solo las tools expuestas (#44).
          </p>

          <div className="my-6 flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* AGENTE BIEN DISEÑADO */}
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <RiCheckLine className="size-4" />
                    </span>
                    <h4 className="text-sm font-semibold tracking-tight text-foreground">
                      Agente bien diseñado
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400">
                    Producción (#4, #6)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Delimita rol, límites de ejecución, regla de fallback ante falta de datos y tools autorizadas.
                </p>
                <div className="mt-1 flex-1 flex flex-col">
                  <CodeBlock label="system-prompt.txt" code={WELL_DESIGNED_PROMPT} className="h-full flex-1" />
                </div>
              </div>

              {/* AGENTE MAL DISEÑADO */}
              <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                      <RiCloseLine className="size-4" />
                    </span>
                    <h4 className="text-sm font-semibold tracking-tight text-foreground">
                      Agente mal diseñado
                    </h4>
                  </div>
                  <Badge variant="outline" className="border-destructive/30 text-[11px] text-destructive">
                    Vulnerable (#13, #19)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sin límites de iteración, sin tools explícitas, vulnerable a prompt injection y alucinaciones.
                </p>
                <div className="mt-1 flex-1 flex flex-col">
                  <CodeBlock label="prompt-inseguro.txt" code={BAD_DESIGNED_PROMPT} className="h-full flex-1" />
                </div>
              </div>
            </div>
          </div>
          
          <FlowDemo
              loop
              phases={[
                {
                  label: "Loop del agente",
                  steps: [
                    "Usuario",
                    "Agente",
                    "¿Llamo una tool? — no → responder (fin)",
                    "Tool autorizada (consultarInventario / registrarPedido)",
                    "Resultado → vuelve al historial",
                    "Repetir (con límites externos #19)",
                  ],
                },
              ]}
            />
          <p>
            Por qué tools y no acceso directo (#14): el agente puede hacer <strong>exactamente</strong> lo
            que las tools permiten — consultar stock de lectura y registrar pedidos verificados, nada más.
          </p>
          <p>
            Y los límites (#19) son <strong>externos</strong>: <code>maxIterations</code>, <code>maxToolCalls</code>, timeout por
            request. Nunca confíes solo en que el modelo &quot;sepa cuándo terminar&quot;.
          </p>
        </>
      }
      code={{ label: "El loop real del agente", code: SERVER_CODE }}
      interview="Trabajo vs agente: ¿cuándo usás un workflow determinista y cuándo un agente con herramientas? (#9, #10, #11)"
      solution="Workflow: proceso fijo, pasos y datos conocidos — stock bajo, generar reporte, parsear CSV (determinista, barato, testeable). Agente: problema abierto que requiere decisiones en runtime — interpretar pregunta, elegir entre tools, razonar con resultados de herramientas. El agente nunca accede directo a datos: solo lo que exponen las tools autorizadas, con límites externos (maxIterations, timeout)."
      prev={{ to: "/aprender/rag", label: "RAG" }}
      next={undefined}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Probalo en la práctica: consultá stock del LAP-001 y registrá un pedido de MOU-001. Fijate en
          toolCalls e iteraciones de la respuesta.
        </p>
        <div>
          <Link to="/">
            <Button>Ir a la práctica →</Button>
          </Link>
        </div>
      </div>
    </LessonShell>
  )
}

export default AgentsLesson