import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"

const CASOS = [
  {
    n: "CASO 1",
    t: "Mostrar productos con stock menor a 10",
    r: "¿Es determinista? Sí → workflow, no agente (#10). " +
      "¿Qué API existe? /products. ¿Qué permisos? solo lectura.",
  },
  {
    n: "CASO 2",
    t: "«Cambia el inventario del producto 123 a 100»",
    r: "Acción de escritura: Agente → identificar producto → validar permisos → mostrar operación → confirmación → API ERP → auditoría.",
  },
  {
    n: "CASO 3",
    t: "«Elimina el producto 123»",
    r: "Potencialmente destructiva: validación → permisos → confirmación → delete API → audit log. Nunca ejecución directa (#XXI.3 human-in-the-loop).",
  },
  {
    n: "CASO 4",
    t: "500.000 documentos, empleados preguntan políticas",
    r: "RAG: processing → chunks → embeddings → vector DB; consulta: auth → authorization → retrieval → chunks relevantes → LLM → respuesta + fuentes.",
  },
  {
    n: "CASO 5",
    t: "«Revisa ventas, compáralas con inventario y creá un informe»",
    r: "Orquestador → {ERP, Finanzas, Documents(RAG)} en paralelo → validación → LLM → crear informe (Google Docs) → revisión humana.",
  },
  {
    n: "CASO 6",
    t: "Sistema legacy",
    r: "Investigar primero: ¿API, DB, archivos, webservices, middleware? Adapter → JSON normalizado → Backend → Agent/Workflow. CSV horario = parsear con código, no IA.",
  },
]

export function CasosLesson() {
  return (
    <LessonShell
      title="Casos de arquitectura (#1976-2000, CASOS 1-6)"
      tag="doc.md CASO 1-6 · regla general #XXV"
      intro={
        <>
          <p>
            Regla del doc para resolver cualquier caso (#25): problema → ¿qué necesita negocio? → ¿qué es
            determinista? → workflow o IA → ¿agente? → ¿multiagente? → ¿qué tools? → ¿qué datos? → RAG →
            ¿qué permisos? → ¿cómo validamos? → ¿cómo escalar? → ¿cuánto cuesta? → ¿cómo monitorear? →
            producción.
          </p>
          <div className="flex flex-col gap-3">
            {CASOS.map((c) => (
              <div key={c.n} className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
                <p className="">
                  {c.n} — {c.t}
                </p>
                <p className="text-muted-foreground">{c.r}</p>
              </div>
            ))}
          </div>
        </>
      }
      interview="«Tenemos 500.000 documentos corporativos y queremos un agente que los consulte.» Diseñalo completo: arquitectura, permisos, costo, validación."
      solution="Arquitectura: ingesta (extraer texto de cada formato: pdf/docx/xlsx) → chunking → embeddings → vector store. Consulta: pregunta → embedding → top-K → filtro de permisos ACL ANTES del LLM (#28) → contexto con fuentes → LLM (temperature 0, regla «no sé» #66) → respuesta citando fuentes. Costo: tokens de ingesta única + tokens por consulta (contexto breve); estimar con chars/4. Validación: dataset de preguntas con respuestas esperadas, evaluar exactitud y que nunca filtre lo no autorizado."
      prev={{ to: "/aprender/evaluacion", label: "Evaluación" }}
      next={{ to: "/aprender/ejercicios", label: "Ejercicios" }}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          El CASO 2 y 3 (escritura/destrucción) ya existen como tools en tu playground: registrarPedido pide
          validación de stock, y nunca borra.
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

export default CasosLesson