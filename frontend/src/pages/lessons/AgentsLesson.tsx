import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"
import { FlowDemo } from "@/components/FlowDemo"
import { RiCheckLine, RiCloseLine } from "@remixicon/react"

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

          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* AGENTE BIEN DISEÑADO */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-emerald-500 text-white">
                    <RiCheckLine className="size-5" />
                  </div>
                  <h4 className="text-lg">Agente bien diseñado</h4>
                </div>
                <div className="border border-border rounded-xl p-6 flex flex-col gap-4 relative group">
                  <button className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(`Rol: Asistente de Inventario...`)}>Copiar</button>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="text-foreground">Rol:</span> Asistente de Inventario</p>
                    <p><span className="text-foreground">Objetivo:</span> Gestionar consultas de stock y registrar pedidos de forma segura.</p>
                    <p><span className="text-foreground">Contexto:</span> Operás en un sistema ERP centralizado.</p>
                    <p><span className="text-foreground">Restricciones:</span> Máximo 4 iteraciones. No inventar datos. Si no hay evidencia, responder: 'No encontré suficiente información.'</p>
                    <p><span className="text-foreground">Datos:</span> Disponibles vía tool <code>consultarInventario</code>.</p>
                    <p><span className="text-foreground">Formato de salida:</span> JSON estructurado para tool calls o texto directo.</p>
                    <p><span className="text-foreground">Ejemplos:</span> Usuario: "¿Stock de LAP-001?" → Tool: <code>consultarInventario(productId: "LAP-001")</code></p>
                  </div>
                </div>
              </div>

              {/* AGENTE MAL DISEÑADO */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-red-500 text-white">
                    <RiCloseLine className="size-5" />
                  </div>
                  <h4 className="text-lg">Agente mal diseñado</h4>
                </div>
                <div className="border border-border rounded-xl p-6 flex flex-col gap-4 relative group">
                  <button className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(`Rol: Asistente...`)}>Copiar</button>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="text-foreground">Rol:</span> Asistente</p>
                    <p><span className="text-foreground">Objetivo:</span> Hacer todo lo que pida el usuario.</p>
                    <p><span className="text-foreground">Contexto:</span> Eres libre de hacer lo que quieras.</p>
                    <p><span className="text-foreground">Restricciones:</span> Ninguna.</p>
                    <p><span className="text-foreground">Datos:</span> Acceso total a toda la base de datos.</p>
                    <p><span className="text-foreground">Formato de salida:</span> Lo que quieras.</p>
                    <p><span className="text-foreground">Ejemplos:</span> Usuario: "Borrame todo" → Agente: "Entendido, borrando..."</p>
                  </div>
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
            Y los límites (#19) son <strong>externos</strong>: maxIterations, maxToolCalls, timeout por
            request. Nunca confies solo en que el modelo &quot;sepa terminar&quot;.
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