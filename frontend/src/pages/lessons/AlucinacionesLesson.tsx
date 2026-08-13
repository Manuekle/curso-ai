import { LessonShell } from "@/components/LessonShell"

const MITIGACION = `RAG
+ Fuentes confiables
+ Structured Output
+ Validación
+ Tool usage
+ Guardrails
+ Evaluation

Regla crítica (#66):
"No encontré suficiente información
 para responder con seguridad."
→ mejor eso que inventar.`

export function AlucinacionesLesson() {
  return (
    <LessonShell
      title="Alucinaciones: por qué y cómo mitigarlas"
      tag="doc.md #64-66 · #27"
      intro={
        <>
          <p>
            Ocurren por: falta de contexto, contexto incorrecto, ambigüedad, modelo, prompt, recuperación
            deficiente, instrucciones contradictorias.
          </p>
          <p>
            No hay solución única — combinación:
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{MITIGACION}</pre>
          <p>
            La respuesta correcta para la entrevista (#27): <em>&quot;RAG reduce el riesgo de alucinaciones al
            proporcionar información externa relevante, pero necesito validación, fuentes confiables y
            reglas para cuando no exista evidencia suficiente.&quot;</em>
          </p>
          <p>
            Nunca digas: &quot;RAG garantiza que la respuesta sea 100% real&quot;.
          </p>
        </>
      }
      code={{
        label: "La regla #66 ya está activa en esta web (server/rag.ts)",
        code: `// si el contexto no responde, el sistema dice:
"Regla crítica (#66): si el contexto no responde la pregunta, decí
 'No encontré suficiente información para responder con seguridad.'"

// y si el filtro de permisos bloquea todo:
if (!allowed.length) {
  return { answer: "No encontré información a la que tengas acceso." };
}`,
      }}
      interview="¿RAG elimina las alucinaciones? ¿Qué combinación de técnicas usarías para mitigarlas?"
      solution="No — las reduce significativamente (#27). Combinación: RAG con recuperación de buena calidad y citas de fuente, temperature baja (#5), instrucción de «no sé» (#66), validación/grounding de la respuesta contra el contexto, y evaluación con dataset propio (casos fáciles, límites y adversarios) para medir cuánto mejoró antes de confiar."
      prev={{ to: "/aprender/rag", label: "RAG" }}
      next={{ to: "/aprender/seguridad", label: "Seguridad" }}
    />
  )
}

export default AlucinacionesLesson