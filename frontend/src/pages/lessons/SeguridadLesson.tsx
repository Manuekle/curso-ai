import { LessonShell } from "@/components/LessonShell"

const AUTHZ = `Authentication   → "¿Quién sos?"      (login, OAuth, session, JWT)
Authorization    → "¿Qué podés hacer?" (Admin → elimina, Employee → lee)

OAuth ≠ JWT: OAuth delega autorización (protocolo),
JWT transporta identidad/autorización firmada (formato).

RBAC: roles con permisos
  Admin    → read, create, update, delete
  Employee → read

Least privilege: cada componente SOLO los permisos que necesita.
  ✗ Agent → Admin Access → Toda la empresa
  ✓ Agent → ConsultarInventario → Solo lectura`

const ACL_CODE = `// server/rag.ts — ACL real de esta web (RBAC minimalista, #32)
const ACL: Record<string, string[]> = {
  admin: ["*"],                 // admin ve todo
  demo: ["rh", "inventario"],   // demo NO ve "it"
};

export function userCanAccess(user: string, owner: string): boolean {
  const allow = ACL[user];
  if (!allow) return false;
  return allow.includes("*") || allow.includes(owner);
}`

export function SeguridadLesson() {
  return (
    <LessonShell
      title="Seguridad: auth, autorización y datos (#29-35)"
      tag="doc.md #29-35 · server/rag.ts"
      intro={
        <>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{AUTHZ}</pre>
          <p>
            <strong>Datos sensibles (#34)</strong>: si procesás finanzas, personales, contratos o clientes,
            evaluá: qué datos salen de la empresa, qué proveedor los recibe, retención, cifrado, acceso,
            auditoría, anonimización, compliance.
          </p>
          <p>
            <strong>Antes del LLM (#35)</strong>: identificación → minimización → anonimización/redacción →
            LLM. Pero recordá: <em>anonimizar no reemplaza autorización</em>.
          </p>
          <p>
            Y el caso RAG (#28, ejercicio 6): el filtro va <strong>en el retriever/backend</strong>, no en el
            prompt. Ya lo probaste en la lección &quot;Búsqueda vectorial&quot;: la política de IT aparece primera
            en el ranking pero queda bloqueada antes del LLM.
          </p>
        </>
      }
      code={{ label: "ACL real de esta web", code: ACL_CODE }}
      interview="Un empleado de Finanzas pregunta '¿cuál es el salario de los empleados?' y el retrieval encuentra docs de RRHH. ¿Dónde se resuelve: prompt, modelo, retriever o backend?"
      solution="En el backend, en el retriever antes del LLM (#28). El prompt es instrucción, no control: «no muestres salarios» se puede violar. Autenticación (quién es) + autorización (qué owners ve) se aplican en el pipeline de datos: hits → filtrar por ACL del usuario → armar contexto solo con lo permitido. Lo que no entra al modelo, no se puede filtrar en la respuesta."
      prev={{ to: "/aprender/alucinaciones", label: "Alucinaciones" }}
      next={{ to: "/aprender/apis", label: "APIs" }}
    />
  )
}

export default SeguridadLesson