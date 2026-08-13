import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const LLM_ERRORS = `Errores típicos de llamadas LLM (sección "Streaming y latencia"):

  context length exceeded → contexto > ventana del modelo
                            (reducir, resumir, mejor chunking)
  429                     → rate limit del proveedor
                            (backoff #40, queue #52, menos llamadas)
  content filter          → entrada/salida bloqueada
                            (error controlado, no reintento ciego)
  timeout                 → backoff + retry, o degradar

Regla: retry solo para transitorios (429, 5xx, red, timeout).
Errores permanentes (400, 401, 403) se corrigen, no se reintentan (#40).`

// Respuesta simulada para el demo de streaming (no llama al LLM)
const STREAM_RESPONSE =
  "La política de seguridad indica que las contraseñas deben rotarse cada 90 días y tener al menos 12 caracteres. " +
  "Además, el acceso a datos sensibles se concede bajo el principio de mínimo privilegio y se audita trimestralmente. " +
  "Si necesitás más detalle sobre los requisitos de autenticación, puedo consultar la sección de acceso remoto."

export function ProduccionLesson() {
  const [shown, setShown] = useState("")
  const [phase, setPhase] = useState<"idle" | "streaming" | "done" | "cached">("idle")
  const [ttft, setTtft] = useState<number | null>(null)
  const [totalMs, setTotalMs] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  function simulateStream() {
    if (phase === "cached") {
      // cache hit (#51): la respuesta ya estaba → sin llamada LLM, instantánea
      setShown(STREAM_RESPONSE)
      setTtft(0)
      setTotalMs(1)
      return
    }
    setPhase("streaming")
    setShown("")
    setTtft(null)
    setTotalMs(null)
    const words = STREAM_RESPONSE.split(" ")
    const started = Date.now()
    let firstTokenAt: number | null = null
    let i = 0
    timerRef.current = setInterval(() => {
      i += 1
      if (firstTokenAt === null) firstTokenAt = Date.now()
      setShown(words.slice(0, i).join(" "))
      if (i >= words.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setTtft(firstTokenAt - started)
        setTotalMs(Date.now() - started)
        setPhase("done")
      }
    }, 45)
  }

  return (
    <LessonShell
      title="Producción: observabilidad, caching, queues, streaming (#47-54)"
      tag="doc.md #47-54 · “Streaming y latencia” · server/server.ts"
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
            sensibles y cambio. En IA además: exact-match, semantic cache y prompt caching.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{ESCALAR}</pre>
          <p>
            <strong>Streaming (#47-54, “Streaming y latencia”)</strong>: el LLM genera por fragmentos (SSE).
            El usuario ve el primer token rápido (TTFT) aunque la respuesta total tarde. Sin streaming, la UI
            queda bloqueada minutos. Abajo lo simulás.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{LLM_ERRORS}</pre>
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
}

// Streaming real (server): respuesta por chunks vía SSE
// res.write(\`data: \${JSON.stringify({ delta })}\\n\\n\`) por token`,
      }}
      interview="Tu agente en producción tiene latencia y costos creciendo con usuarios. ¿Cuál es tu orden de análisis y qué optimizás?"
      solution="Primero medir, después optimizar (#47-50): logs, tracing y métricas (latencia por etapa, tokens por llamada, errores, rate limit). Con datos: atacar la etapa dominante — retrieval pesado → mejores embeddings/índice; repeticiones → cache (#51); tareas lentas y no urgentes → queue async (#52); picos → rate limit + escalar (#53, #54). Reducir tokens (menos contexto) suele ganar en costo Y latencia a la vez. Y streaming (SSE) para que el usuario no espere la respuesta completa: primer token rápido, TTFT como métrica."
      prev={{ to: "/aprender/arquitectura", label: "Arquitectura" }}
      next={{ to: "/aprender/costos-modelos", label: "Costos y modelos" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: streaming simulado + cache hit</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={simulateStream} disabled={phase === "streaming"}>
              {phase === "streaming" ? "Generando…" : phase === "cached" ? "Repetir (cache hit)" : "Simular streaming"}
            </Button>
            {phase === "done" && (
              <Badge variant="secondary">primera llamada: {ttft}ms al primer token · {totalMs}ms total</Badge>
            )}
            {phase === "cached" && (
              <Badge variant="default">cache hit: 0ms, sin llamada LLM (#51)</Badge>
            )}
          </div>
          <p className="min-h-24 rounded-lg border bg-muted p-3 font-mono text-sm leading-relaxed">
            {shown || <span className="text-muted-foreground">La respuesta aparece token a token, como con SSE…</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            Simulación local (sin LLM). En producción: SSE entrega chunks del proveedor → el cliente los
            renderiza; TTFT mide la UX, el total mide el procesamiento. Segunda ejecución = cache: instantánea,
            cero tokens consumidos.
          </p>
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default ProduccionLesson