import { LessonShell } from "@/components/LessonShell"
import { FlowDemo } from "@/components/FlowDemo"

const COST_CODE = `// Cómo estimar el costo de una llamada (aprox 4 chars ≈ 1 token)
function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4);
}

// costos de esta web (modelos :free de OpenRouter → $0)
// con un modelo de pago, entrada y salida se cobran por separado:
// costo = tokensEntrada × precioIn + tokensSalida × precioOut`

export function FundamentosLesson() {
  return (
    <LessonShell
      title="LLM y tokens"
      tag="doc.md #1-2 · fundamentos"
      intro={
        <>
          <p>
            Un <strong>LLM</strong> procesa y genera lenguaje usando patrones aprendidos en el entrenamiento.
            No funciona como una base de datos: no &quot;sabe&quot; qué información tiene — genera la respuesta
            más probable según los patrones y el contexto que recibe.
          </p>
          <p>
            Las respuestas son <strong>probabilísticas</strong>, no deterministas: mismo input puede dar
            output distinto (por eso existe la temperatura, sección siguiente).
          </p>
          <FlowDemo
              phases={[
                {
                  label: "Generación",
                  steps: ["Input", "Tokens", "Modelo", "Probabilidades", "Tokens de salida", "Respuesta"],
                },
              ]}
            />
          <p>
            <strong>Tokens</strong>: los modelos no leen palabras completas, leen unidades sub-palabra.
            &quot;inteligencia artificial&quot; se divide en varias unidades. El costo depende de: tokens de
            entrada + tokens de salida + modelo + cantidad de llamadas.
          </p>
          <p>
            Regla práctica: enviar un documento de 20 páginas a cada request, para miles de usuarios,
            multiplica el costo. De ahí nace todo el diseño de RAG y reducción de contexto (#26).
          </p>
        </>
      }
      code={{ label: "Estimar tokens antes de llamar", code: COST_CODE }}
      interview="¿Qué es un token y por qué importa para el costo? ¿Cómo estimarías el costo de una app con miles de usuarios?"
      solution="Un token es una unidad sub-palabra (≈4 caracteres). El costo = (tokens de entrada × precioIn) + (tokens de salida × precioOut), multiplicado por la cantidad de llamadas. Estimación: chars/4 por mensaje, sumá el prompt del sistema en cada request, y escalá por usuarios × conversaciones. Por eso el contexto enviado a cada llamada domina el costo: menos contexto = menos dinero."
      prev={undefined}
      next={{ to: "/aprender/contexto-temperature", label: "Contexto y temperatura" }}
    />
  )
}

export default FundamentosLesson