import { LessonShell } from "@/components/LessonShell"

const LOG_CODE = `// server/server.ts — observabilidad real de esta web (#48-49)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(JSON.stringify({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    }));
  });
  next();
});`

const ESCALAR = `50.000 usuarios NO es "pongo más servidores":

  Load Balancer → Backend → Cache → Queue → Workers → Agents → LLM

  Concurrencia · límites del proveedor · rate limiting
  caching · queues · workers · database scaling · observabilidad

Combinación útil (#53):
  Usuarios → Rate Limiter → API → Queue → Workers → Agents → LLM

Queue útil cuando el trabajo es: pesado, asíncrono, lento, con picos.`

export function ProduccionLesson() {
  return (
    <LessonShell
      title="Producción: observabilidad, caching, queues (#47-54)"
      tag="doc.md #47-54 · server/server.ts"
      intro={
        <>
          <p>
            Prototipo demuestra &quot;la idea funciona&quot;. Producción necesita: seguridad, escalabilidad,
            observabilidad, disponibilidad, costos, resiliencia, mantenibilidad.
          </p>
          <p>
            <strong>Observabilidad (#48)</strong>: respondé &quot;¿qué hizo el sistema?&quot;. Medí latencia,
            errores, tokens, costo, herramientas usadas, tasa de éxito. La web ya lo hace por request:
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{LOG_CODE}</pre>
          <p>
            <strong>Tracing (#50)</strong>: seguí una request a través de componentes — crítico en
            multiagentes. <strong>Caching (#51)</strong>: cuidado con expiración, invalidación, datos
            sensibles y cambio.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{ESCALAR}</pre>
        </>
      }
      code={{
        label: "Fe de producción: no loguees secrets",
        code: `// #49 — nunca registres indiscriminadamente secretos o info sensible
{
  "userId": "123",
  "workflowId": "inventory-01",
  "agent": "inventory-agent",
  "tool": "consultInventory",
  "durationMs": 842,
  "status": "success"
}`,
      }}
      interview="Tu agente en producción tiene latencia y costos creciendo con usuarios. ¿Cuál es tu orden de análisis y qué optimizás?"
      solution="Primero medir, después optimizar (#47-50): logs, tracing y métricas (latencia por etapa, tokens por llamada, errores, rate limit). Con datos: atacar la etapa dominante — retrieval pesado → mejores embeddings/índice; repeticiones → cache (#51); tareas lentas y no urgentes → queue async (#52); picos → rate limit + escalar (#53, #54). Reducir tokens (menos contexto) suele ganar en costo Y latencia a la vez."
      prev={{ to: "/aprender/arquitectura", label: "Arquitectura" }}
      next={{ to: "/aprender/costos-modelos", label: "Costos y modelos" }}
    />
  )
}

export default ProduccionLesson