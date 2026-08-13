import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"
import { FlowDemo } from "@/components/FlowDemo"

const SERVER_CODE = `// server/rag.ts — el corazón de ask() (#26)
export async function ask(question: string, user = "demo") {
  const [qVec] = await embed([question]);              // 1. pregunta → embedding
  const hits = search(qVec);                           // 2. top-K por cosine

  // 3. #28 — filtro de permisos ANTES del LLM (crítico)
  const allowed = hits.filter((d) => userCanAccess(user, d.owner));
  if (!allowed.length) {
    return { answer: "No encontré información a la que tengas acceso.", ... };
  }

  // 4. contexto armado SOLO con lo permitido
  const context = allowed.map((d) => \`[fuente: \${d.id}]\\n\${d.text}\`).join("\\n\\n---\\n\\n");

  // 5. LLM con contexto, no con todo el corpus (#26)
  const res = await chatCompletion({
    model: chatModel(),
    temperature: 0,                                    // #5 consistencia
    messages: [{
      role: "system",
      content:
        "Respondé SOLO con base en el contexto. Citá la fuente [fuente: ...]. " +
        "Regla crítica (#66): si el contexto no responde, decí " +
        "'No encontré suficiente información para responder con seguridad.'",
    }, { role: "user", content: \`Contexto:\\n\${context}\\n\\nPregunta: \${question}\` }],
  });
  return { answer: res.choices[0]?.message.content ?? "", sources: allowed.map(d => d.id) };
}`

export function RagLesson() {
  return (
    <LessonShell
      title="RAG: el pipeline completo"
      tag="doc.md #21-28 · server/rag.ts"
      intro={
        <>
          <p>
            <strong>Retrieval-Augmented Generation</strong>: se recupera información relevante
            <em> antes</em> de generar, y el LLM responde con base en ese contexto. Así el modelo trabaja
            con tus documentos en vez de con su memoria.
          </p>
          <FlowDemo
              phases={[
                {
                  label: "Indexación",
                  steps: ["Documentos", "Chunking", "Embeddings", "Vector store"],
                },
                {
                  label: "Consulta",
                  steps: [
                    "Pregunta",
                    "Embedding de la pregunta",
                    "Búsqueda top-K",
                    "Filtro de permisos (#28)",
                    "Contexto permitido",
                    "LLM",
                    "Respuesta con fuentes",
                  ],
                },
              ]}
            />
          <p>
            ¿Por qué no enviar todo al prompt? (#26) — tokens, costo, latencia, ruido: no escala. El
            retrieval selecciona solo lo relevante.
          </p>
          <p>
            <strong>Importante (#27)</strong>: RAG <em>reduce</em> las alucinaciones, no las elimina. La
            regla #66 (decir &quot;no encontré suficiente información&quot;) es parte del diseño, no un parche.
          </p>
        </>
      }
      code={{ label: "El pipeline real de ask()", code: SERVER_CODE }}
      interview="¿RAG garantiza que la respuesta sea 100% real? ¿Cómo reducirías el riesgo de alucinaciones? (#27, #65)"
      solution="NO. RAG reduce alucinaciones, no las elimina: el modelo puede ignorar el contexto o combinarlo mal. Mitigación en capas: contexto verificado con fuentes citables, temperature baja, regla de diseño «si el contexto no responde, decilo» (#66), evaluación continua con casos reales, y validación post-generación cuando el riesgo lo justifica. Ninguna técnica sola alcanza."
      prev={{ to: "/aprender/retrieval", label: "Búsqueda vectorial" }}
      next={{ to: "/aprender/agentes", label: "Agentes" }}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Probalo en la práctica: preguntá algo cubierto por las políticas (stock bajo, vacaciones) y algo
          que no deberías ver como demo (contraseñas, owner IT).
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

export default RagLesson