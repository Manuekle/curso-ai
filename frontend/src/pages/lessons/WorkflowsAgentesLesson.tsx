import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"

const CMP = `| Característica | Workflow | Agente |
| Pasos | Definidos | Dinámicos |
| Decisiones | Reglas | Puede usar LLM |
| Predictibilidad | Alta | Menor |
| Costo | Menor | Puede ser mayor |
| Auditoría | Sencilla | Más compleja |
| Uso ideal | Procesos deterministas | Problemas dinámicos |`

const NO_IA = `if (stock < 10) sendAlert();

Código + Reglas + APIs → no necesitás un LLM para esto.`

export function WorkflowsAgentesLesson() {
  return (
    <LessonShell
      title="Workflows vs agentes: cuándo usar IA"
      tag="doc.md #7-12"
      intro={
        <>
          <p>
            Un <strong>workflow</strong> es una secuencia de pasos definida: determinista, predecible, fácil
            de auditar. Formulario → validar → guardar → llamar API → enviar correo.
          </p>
          <CodeBlock label="workflows-vs-agentes.txt" code={CMP} />
          <p>
            <strong>Cuándo NO usar IA (#10)</strong>:
          </p>
          <CodeBlock label="cuando-no-usar-ia.txt" code={NO_IA} />
          <p>
            <strong>Cuándo sí (#11)</strong>: lenguaje natural, documentos no estructurados, clasificación,
            resumen, extracción, razonamiento, decisiones con contexto.
          </p>
          <p>
            Dos reglas que debés repetir en la entrevista (#12, y la #1 y #2 de las 15 ideas):
          </p>
          <ul className="list-disc pl-5">
            <li>No todo problema necesita IA.</li>
            <li>No todo problema que necesita IA necesita un agente.</li>
          </ul>
          <p>
            Formulario de decisión del doc (#25 XXV): ¿partes deterministas? → workflow. ¿Lenguaje natural,
            decisiones dinámicas? → recién ahí IA, y solo ahí agente.
          </p>
        </>
      }
      interview="La empresa pide 'mostrar productos con stock menor a 10'. ¿Usarías un agente? ¿Y 'analizá este contrato y detectá cláusulas riesgosas'?"
      solution="Stock < 10: NO agente — es una query determinista (SELECT + filtro). Un workflow/código fijo es más barato, predecible y testeable. Analizar contratos: sí agente — la tarea es abierta, semántica y requiere decisiones (qué es «riesgoso» depende del contexto). Regla: determinista → código; problema abierto → IA."
      prev={{ to: "/aprender/prompts-structured", label: "Prompts" }}
      next={{ to: "/aprender/agentes", label: "Agente con tools" }}
    />
  )
}

export default WorkflowsAgentesLesson