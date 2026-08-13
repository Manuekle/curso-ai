import { useState } from "react"
import {
  RiAlertLine,
  RiCoinLine,
  RiKey2Line,
  RiWifiOffLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AIErrorCardProps {
  error: string
  onOpenKeysModal?: () => void
  onRetry?: () => void
  className?: string
}

export function parseAIError(errorStr: string): {
  type: "quota" | "key" | "network" | "general"
  title: string
  description: string
  suggestion: string
  details?: string
} {
  const lower = errorStr.toLowerCase()

  // 1. Quota / Tokens agotados (429, 402, tokens, credit, quota, balance)
  if (
    lower.includes("quota") ||
    lower.includes("token") ||
    lower.includes("credit") ||
    lower.includes("balance") ||
    lower.includes("429") ||
    lower.includes("402") ||
    lower.includes("resource_exhausted") ||
    lower.includes("rate limit")
  ) {
    return {
      type: "quota",
      title: "Límite de tokens o cuota agotada",
      description:
        "El proveedor de IA ha rechazado la solicitud porque se agotaron los tokens gratuitos o la cuota de tu cuenta.",
      suggestion:
        "Prueba cambiando de modelo o proveedor en el Gestor de API Keys (OpenRouter tiene modelos gratuitos disponibles como Gemma o Llama).",
      details: errorStr,
    }
  }

  // 2. Clave de API no configurada o inválida (401, 403, api key, unauthorized)
  if (
    lower.includes("api key") ||
    lower.includes("apikey") ||
    lower.includes("clave") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid key") ||
    lower.includes("sin configurar")
  ) {
    return {
      type: "key",
      title: "API Key requerida o no válida",
      description:
        "No se encontró una clave de API válida para el proveedor seleccionado o fue rechazada por autenticación.",
      suggestion:
        "Ingresa una clave válida para este proveedor en el Gestor de API Keys (.env local).",
      details: errorStr,
    }
  }

  // 3. Fallo de red / Desconexión / Servicio no disponible (503, 502, fetch failed, timeout, network)
  if (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("desconectado") ||
    lower.includes("enotfound")
  ) {
    return {
      type: "network",
      title: "Fallo de conexión con el servicio",
      description:
        "No se pudo establecer conexión con el servidor o el servicio de IA. Puede estar temporalmente fuera de línea o sin acceso a la red.",
      suggestion:
        "Verifica tu conexión a internet o intenta nuevamente en unos segundos.",
      details: errorStr,
    }
  }

  // 4. Error general
  return {
    type: "general",
    title: "Error al procesar la solicitud de IA",
    description: errorStr.replace(/^HTTP \d+:\s*/, "") || "Ocurrió un error inesperado al consultar el modelo de IA.",
    suggestion: "Verifica la configuración del proveedor o intenta con otra consulta.",
    details: errorStr,
  }
}

export function AIErrorCard({
  error,
  onOpenKeysModal,
  onRetry,
  className = "",
}: AIErrorCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  if (!error) return null

  const info = parseAIError(error)

  const iconMap = {
    quota: <RiCoinLine className="size-5 text-amber-500 shrink-0" />,
    key: <RiKey2Line className="size-5 text-red-500 shrink-0" />,
    network: <RiWifiOffLine className="size-5 text-blue-500 shrink-0" />,
    general: <RiAlertLine className="size-5 text-destructive shrink-0" />,
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 text-foreground transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{iconMap[info.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground tracking-[-0.01em]">
              {info.title}
            </h4>
          </div>

          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {info.description}
          </p>

          {info.suggestion && (
            <div className="mt-2.5 rounded-xl bg-background/80 p-2.5 text-xs text-foreground/90 border border-border/60">
              <span className="font-medium text-foreground">Sugerencia: </span>
              {info.suggestion}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onOpenKeysModal && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs rounded-full gap-1.5"
                onClick={onOpenKeysModal}
              >
                <RiKey2Line className="size-3.5" />
                Configurar API Keys
              </Button>
            )}

            {onRetry && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs rounded-full"
                onClick={onRetry}
              >
                Reintentar
              </Button>
            )}

            {info.details && (
              <button
                type="button"
                onClick={() => setShowDetails((p) => !p)}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showDetails ? (
                  <RiArrowDownSLine className="size-3.5" />
                ) : (
                  <RiArrowRightSLine className="size-3.5" />
                )}
                {showDetails ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}
              </button>
            )}
          </div>

          {showDetails && info.details && (
            <pre className="mt-2.5 max-h-32 overflow-y-auto rounded-lg bg-muted/80 p-2.5 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap border border-border/40">
              {info.details}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIErrorCard
