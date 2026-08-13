import { LessonShell } from "@/components/LessonShell"

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
"¿Por qué realmente necesito cinco agentes?"`

export function MultiagentesLesson() {
  return (
    <LessonShell
      title="Multiagentes y orquestador (#15-20)"
      tag="doc.md #15-20 · server/orchestrator.ts"
      intro={
        <>
          <p>
            Un sistema <strong>multiagente</strong> usa agentes especializados que colaboran: arquitectura,
            seguridad, UX... cada uno evalúa una dimensión. El <strong>orquestador</strong> decide qué
            ejecutar, con qué contexto, en qué orden, cuándo terminar y cuándo pedir segunda evaluación.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-4 font-mono text-xs">{PROBS}</pre>
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
        </>
      }
      code={{ label: "El orquestador real de esta web", code: ORCH_CODE }}
      interview="¿Por qué realmente necesitás un multiagente? ¿Cómo evitás loops y qué hacés si dos agentes se contradicen?"
      solution="Justificación real: tareas naturalmente paralelas o por dominio (arquitectura + seguridad + síntesis), no «más agentes = más pro» — cada agente extra cuesta tokens, latencia y caos. Loops: límites externos (maxIterations, maxToolCalls, timeout, Promise.race). Contradicciones: reglas de resolución explícitas (nivel de confianza, orden de autoridad, síntesis por un orquestador) — nunca dejar que peleen solos."
      prev={{ to: "/aprender/agentes", label: "Agente con tools" }}
      next={{ to: "/aprender/chunks", label: "Chunks" }}
    />
  )
}

export default MultiagentesLesson