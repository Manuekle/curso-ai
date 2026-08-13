// server/orchestrator.ts
// Multiagente con orquestador (doc #18): ejecuta agentes especializados en paralelo (#75),
// evalúa resultados y sintetiza. Límites de costo/latencia por fuera (#19).

import { chatCompletion, Provider } from "./llm.js";

interface SpecializedResult {
  agent: string;
  output: string;
  confidence: number;
}

// Agente especializado genérico: cada uno tiene rol + criterio de evaluación propios
async function specialized(agentName: string, role: string, question: string, apiKey?: string, provider: Provider = "openai"): Promise<SpecializedResult> {
  const config = { provider, apiKey };
  const res = await chatCompletion(config, {
    messages: [
      { role: "system", content: role },
      { role: "user", content: question },
    ],
    // #6 structured output → fácil de validar/comparar después
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(res.choices[0]?.message.content ?? "{}") as {
    output?: string;
    confidence?: number;
  };

  return {
    agent: agentName,
    output: parsed.output ?? "sin respuesta",
    confidence: parsed.confidence ?? 0,
  };
}

export interface OrchestrationResult {
  results: SpecializedResult[];
  summary: string;
  finalConfidence: number;
}

// Orquestador: decide qué agentes corren, paraleliza, evalúa y sintetiza
export async function orchestrate(question: string, apiKey?: string, provider: Provider = "openai"): Promise<OrchestrationResult> {
  const config = { provider, apiKey };
  // Free tier de OpenRouter es lento (colas upstream): 120s de margen (#19 timeout externo)
  const timeoutMs = 120_000;

  // Agentes especializados: cada uno mira una dimensión del problema (#16)
  const agents: Array<{ name: string; role: string }> = [
    {
      name: "arquitectura",
      role:
        "Sos arquitecto de software. Evalúa el problema y proponé la arquitectura. " +
        'Respondé JSON: {"output": "...", "confidence": 0-1}',
    },
    {
      name: "seguridad",
      role:
        "Sos experto en seguridad. Identificá riesgos, datos sensibles y controles necesarios. " +
        'Respondé JSON: {"output": "...", "confidence": 0-1}',
    },
  ];

  // Promise.race con timer: timeout aborta sin crashear el proceso (#19)
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout de orquestación (${timeoutMs}ms)`)), timeoutMs);
  });

  const work = (async () => {
    // Promise.all → latencia = peor agente, no la suma (#75)
    const results = await Promise.all(
      agents.map((a) => specialized(a.name, a.role, question, apiKey, provider))
    );


    // Evaluación: la confianza final = la más baja (visión conservadora)
    const finalConfidence = Math.min(...results.map((r) => r.confidence));

    // Síntesis: un LLM combina los outputs en una respuesta coherente
    const summaryRes = await chatCompletion(config, {
      messages: [
        {
          role: "system",
          content: "Sos el sintetizador. Combiná los resultados de los agentes especializados en una respuesta única, coherente y accionable. Detectá contradicciones y señalalas explícitamente (#20).",
        },
        {
          role: "user",
          content: results.map((r) => `[${r.agent}] ${r.output}`).join("\n"),
        },
      ],
    });

    return {
      results,
      summary: summaryRes.choices[0]?.message.content ?? "",
      finalConfidence,
    };
  })();

  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}