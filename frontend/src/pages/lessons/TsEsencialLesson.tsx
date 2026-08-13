import { LessonShell } from "@/components/LessonShell"

const FETCH_CODE = `// frontend/src/pages/Playground.tsx — consumir la API real (#71-72)
async function send() {
  setLoading(true);
  setError("");
  try {
    const res = await fetch(ENDPOINTS[mode], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, user: "demo" }),
    });
    if (!res.ok) {                                  // #72 errores explícitos
      const body = await res.json().catch(() => null);
      throw new Error(\`HTTP \${res.status}: \${body?.error ?? res.statusText}\`);
    }
    const data = await res.json();
    setAnswer(data.answer);
  } catch (err) {
    setError((err as Error).message);               // capturado → UI, no crash
  } finally {
    setLoading(false);
  }
}`

const PARALLEL_CODE = `// server/orchestrator.ts — Promise.all real (#75)
// operaciones independientes → latencia = peor, no la suma
const results = await Promise.all(
  agents.map((a) => specialized(a.name, a.role, question))
);
// cuidado: límites de APIs, errores parciales, carga, dependencias (#75)

// y en el frontend:
const [emb, sim] = await Promise.all([
  fetch("/api/demo/embed", ...),
  fetch("/api/demo/cosine", ...),
]);`

const TRANSFORM_CODE = `// #73 transformación de datos — tu filtro de stock bajo
const lowStock = products.filter((p) => p.stock < 10);`

export function TsEsencialLesson() {
  return (
    <LessonShell
      title="TypeScript esencial para la entrevista"
      tag="doc.md #71-75 · código real de esta web"
      intro={
        <>
          <p>
            Los 5 temas que pregunta el doc: consumir una API, manejo de errores, transformación de datos,
            async/await y Promise.all. Todos ya están vivos en esta web — este es el código real.
          </p>
        </>
      }
      code={{ label: "Consumir API + errores (Playground.tsx)", code: FETCH_CODE }}
      interview="¿Cuándo usás Promise.all vs await secuencial? ¿Qué cuidados tenés con Promise.all en producción (errores parciales, límites, carga)?"
      solution="Promise.all cuando las llamadas son independientes (ej. 3 embeddings a la vez): corre en paralelo, latencia = la más lenta, no la suma. Secuencial cuando una depende de la anterior. Cuidados: si UNA falla, Promise.all rechaza todas (usá Promise.allSettled si querés degradar parcial); ojo con rate limits del proveedor y picos de carga — paralelizá con límite; errores parciales requieren manejo explícito."
      prev={{ to: "/aprender/ejercicios", label: "Ejercicios" }}
      next={{ to: "/aprender/entrevista", label: "Entrevista" }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">Paralelismo real (#75)</p>
          <pre className="max-h-96 overflow-auto whitespace-pre rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed">
            {PARALLEL_CODE}
          </pre>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs text-muted-foreground">Transformación (#73)</p>
          <pre className="max-h-96 overflow-auto whitespace-pre rounded-lg border bg-muted p-4 font-mono text-xs leading-relaxed">
            {TRANSFORM_CODE}
          </pre>
        </div>
      </div>
    </LessonShell>
  )
}

export default TsEsencialLesson