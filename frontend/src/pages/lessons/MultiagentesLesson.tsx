import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"
import { NumberPopIn } from "@/components/NumberPopIn"

const ORCH_CODE = `// server/orchestrator.ts — sistemas multiagente reales de esta web
// 1. agentes especializados corren en paralelo (#75 reduce latencia)
const results = await Promise.all(
  agents.map((a) => specialized(a.name, a.role, question))
);

// 2. evaluación: confianza final = la más baja (visión conservadora)
const finalConfidence = Math.min(...results.map((r) => r.confidence));

// 3. síntesis: un LLM combina los outputs
const summaryRes = await chatCompletion({
  model: chatModel(),
  messages: [{
    role: "system",
    content:
      "Sos el sintetizador. Combiná los resultados ... " +
      "Detectá contradicciones y señalalas explícitamente (#20).",
  }, {
    role: "user",
    content: results.map((r) => \`[\${r.agent}] \${r.output}\`).join("\\n"),
  }],
});`

const PROBS = `Más agentes NO significa mejor:

  ✗ costos            ✗ contradicciones
  ✗ latencia          ✗ debugging difícil
  ✗ complejidad

Pregunta que debés poder responder:
"¿Por qué realmente necesito cinco agentes?"

Además (doc.md "Memoria en agentes" y "Planning"):
  - memoria: working / episódica / largo plazo / resumida
  - patrones: ReAct, Plan-and-Execute, reflexión
  - human-in-the-loop: approval gate, interruption, escalation`

interface Proposal {
  id: string
  type: string
  amount: number
  provider: string
  checks: string[]
  status: "pending" | "approved" | "rejected"
}

interface HitlResult {
  proposal: Proposal
  idempotent?: boolean
  audit?: { timestamp: string; action: string; by: string }
}

export function MultiagentesLesson() {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [audit, setAudit] = useState<HitlResult["audit"] | null>(null)
  const [idempotent, setIdempotent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function hitl(body: Record<string, string>) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/demo/hitl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }
      const data: HitlResult = await res.json()
      setProposal(data.proposal)
      setAudit(data.audit ?? null)
      setIdempotent(data.idempotent ?? false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LessonShell
      title="Multiagentes, orquestador y human-in-the-loop"
      tag="doc.md #15-20 · “HITL: patrones” · server/app.ts"
      intro={
        <>
          <p>
            Un sistema <strong>multiagente</strong> usa agentes especializados que colaboran: arquitectura,
            seguridad, UX... cada uno evalúa una dimensión. El <strong>orquestador</strong> decide qué
            ejecutar, con qué contexto, en qué orden, cuándo terminar y cuándo pedir segunda evaluación.
          </p>
          <CodeBlock label="patrones-multiagente.txt" code={PROBS} />
          <p>
            <strong>Loops (#19)</strong>: nunca confíes solo en el agente. Límites externos: maxIterations,
            maxToolCalls, timeout, tokenBudget, costBudget + detección de acciones repetidas, condiciones de
            finalización, circuit breakers, cancelación. En esta web: <code>MAX_ITERATIONS = 4</code>,
            <code> MAX_TOOL_CALLS = 6</code> y <code>Promise.race</code> con timeout en el orquestador.
          </p>
          <p>
            <strong>Contradicciones (#20)</strong>: el orquestador compara, detecta conflictos, busca
            evidencia, aplica reglas y sintetiza. Si es crítico: humano decide (human-in-the-loop).
          </p>
          <p>
            <strong>HITL (doc.md patrones)</strong>: niveles in/on/out-of-the-loop; approval gate para
            acciones irreversibles, interruption ante ambigüedad, escalation cuando el agente no puede, y
            timeout-escalation con rechazo por defecto. Abajo lo probás: el agente prepara la transferencia,
            el humano decide, y la decisión queda auditada.
          </p>
        </>
      }
      code={{ label: "El orquestador real de esta web", code: ORCH_CODE }}
      interview="¿Por qué realmente necesitás un multiagente? ¿Cómo evitás loops y qué hacés si dos agentes se contradicen? ¿Y si el agente quiere transferir $20.000.000?"
      solution="Justificación real: tareas naturalmente paralelas o por dominio (arquitectura + seguridad + síntesis), no «más agentes = más pro» — cada agente extra cuesta tokens, latencia y caos. Loops: límites externos (maxIterations, maxToolCalls, timeout, Promise.race). Contradicciones: reglas de resolución explícitas (nivel de confianza, orden de autoridad, síntesis por un orquestador) — nunca dejar que peleen solos. Transferencia: approval gate (#HITL) — el agente PREPARA (valida cuenta, saldo, límites, bloqueos), el humano APRUEBA o RECHAZA con la evidencia visible, y la decisión queda en audit log. Decidir dos veces es idempotente (#41)."
      prev={{ to: "/aprender/agentes", label: "Agente con tools" }}
      next={{ to: "/aprender/chunks", label: "Chunks" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: approval gate — agente prepara, humano decide</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Button onClick={() => hitl({ action: "prepare" })} disabled={loading}>
              {loading ? "Procesando…" : "Agente prepara transferencia"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          {proposal && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{proposal.id}</span>
                <Badge variant="secondary">{proposal.type}</Badge>
                <Badge
                  variant={proposal.status === "approved" ? "default" : proposal.status === "rejected" ? "destructive" : "outline"}
                >
                  {proposal.status}
                </Badge>
                {idempotent && <Badge variant="outline">idempotente (#41): ya decidida</Badge>}
              </div>
              <p className="text-lg font-semibold">
                $<NumberPopIn value={proposal.amount.toLocaleString("es-AR")} /> → {proposal.provider}
              </p>
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                {proposal.checks.map((c) => (
                  <li key={c}>✓ {c}</li>
                ))}
              </ul>

              {proposal.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => hitl({ action: "decide", id: proposal.id, decision: "approve" })}
                    disabled={loading}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => hitl({ action: "decide", id: proposal.id, decision: "reject" })}
                    disabled={loading}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => hitl({ action: "decide", id: proposal.id, decision: "approve" })}
                    disabled={loading}
                  >
                    Decidir de nuevo (idempotencia)
                  </Button>
                </div>
              )}

              {audit && (
                <p className="rounded-md bg-muted p-2 text-xs">
                  Audit: {audit.action} · {audit.by} · {new Date(audit.timestamp).toLocaleString("es-AR")}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            El LLM solo prepara la propuesta; la ejecución la autoriza el humano y el backend la registra.
            Reintentar la decisión no re-ejecuta: misma propuesta, mismo resultado (#41).
          </p>
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default MultiagentesLesson