import { LessonShell } from "@/components/LessonShell"

const HTTP = `GET    → consultar         200 → OK
POST   → crear             201 → Created
PUT    → reemplazar        204 → No Content
PATCH  → modificar parcial  400 → Bad Request (NO retry)
DELETE → eliminar          401 → Unauthenticated
                            403 → Forbidden
                            404 → Not Found
                            409 → Conflict
                            429 → Too Many Requests (retryable)
                            500 → Server Error
                            502/503 → Bad Gateway/Unavailable`

const RETRY = `Retry candidatos:  429, 503, timeout   → reintentar con backoff
NO retry:         400, 401, 403          → corregir request/auth

Idempotencia: repetir la operación no produce efectos extra.
  POST /payment  +  Idempotency-Key: abc123

Rate limiting: 100 req/min protege abuso, saturación y costos.`

export function ApisLesson() {
  return (
    <LessonShell
      title="APIs: REST, webhooks, retry, idempotencia (#36-42)"
      tag="doc.md #36-42 · server/server.ts"
      intro={
        <>
          <p>
            <strong>REST</strong> es un estilo de arquitectura HTTP común: recursos + métodos +
            status codes.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{HTTP}</pre>
          <p>
            <strong>Webhooks (#39)</strong>: el sistema externo avisa por HTTP cuando pasa algo (pago →
            POST /webhook → backend), en vez de que vos consultes.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{RETRY}</pre>
        </>
      }
      code={{
        label: "Status codes reales de esta web (server/server.ts)",
        code: `app.post("/api/agent", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400)   // 400 → NO retry (#40)
      .json({ error: "question requerido" });
    const result = await runAgent(question);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// y cada request se loguea (#48):
// {"method":"POST","path":"/api/agent","status":200,"durationMs":6779}`,
      }}
      interview="Un webhook de pagos reintenta el mismo evento 5 veces y tu backend crea 5 registros. ¿Cómo lo arreglás? ¿Y por qué 401/403 no se reintentan?"
      solution="Idempotencia (#41): mismo evento → misma clave (event_id / idempotency key) → si ya se procesó, responder con el resultado previo y no duplicar. Guardarla ANTES de ejecutar. 401/403 no se reintentan porque son errores permanentes: reintentar no cambia el resultado, solo repite el error — el retry es para transitorios (5xx, 429, timeout, red) (#40)."
      prev={{ to: "/aprender/seguridad", label: "Seguridad" }}
      next={{ to: "/aprender/arquitectura", label: "Arquitectura empresarial" }}
    />
  )
}

export default ApisLesson