import { useState, useEffect } from "react"
import {
  RiCloseLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiExternalLinkLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiInformationLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useApiKeys, type Provider, type ApiKeysState } from "@/hooks/useApiKeys"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

function readMs(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

interface ApiKeysModalProps {
  open: boolean
  onClose: () => void
}

type ModalState = "closed" | "open" | "closing"

const PROVIDERS_CONFIG: Array<{
  id: Provider
  name: string
  envVar: string
  desc: string
  url: string
  placeholder: string
  recommended?: boolean
}> = [
  {
    id: "openrouter",
    name: "OpenRouter",
    envVar: "OPENROUTER_API_KEY",
    desc: "Recomendado para cursos. Da acceso a modelos gratuitos (Gemma, Llama, Mistral) y comerciales con una sola clave.",
    url: "https://openrouter.ai/keys",
    placeholder: "sk-or-v1-...",
    recommended: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    envVar: "OPENAI_API_KEY",
    desc: "Modelos GPT-4o-mini, GPT-4o y embeddings oficiales (text-embedding-3-small).",
    url: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    envVar: "GEMINI_API_KEY",
    desc: "Modelos Gemini 1.5 Flash y embeddings text-embedding-004 de Google AI Studio.",
    url: "https://aistudio.google.com/app/apikey",
    placeholder: "AIzaSy...",
  },
  {
    id: "groq",
    name: "Groq",
    envVar: "GROQ_API_KEY",
    desc: "Inferencia ultra rápida para modelos Llama 3.1 y Mixtral con hardware LPU.",
    url: "https://console.groq.com/keys",
    placeholder: "gsk_...",
  },
]

export function ApiKeysModal({ open, onClose }: ApiKeysModalProps) {
  const [modalState, setModalState] = useState<ModalState>(open ? "open" : "closed")
  const { apiKeys, saveApiKeys, activeProvider, setActiveProvider } = useApiKeys()
  const [localKeys, setLocalKeys] = useState<ApiKeysState>(apiKeys)
  const [showKey, setShowKey] = useState<Record<Provider, boolean>>({
    openrouter: false,
    openai: false,
    gemini: false,
    groq: false,
  })

  // Sincronizar apertura con el prop open
  useEffect(() => {
    if (open) {
      setLocalKeys(apiKeys)
      setModalState("open")
    } else if (modalState === "open") {
      setModalState("closing")
    }
  }, [open, apiKeys])

  // Temporizador de cierre dinámico según --modal-close-dur (Transitions.dev)
  useEffect(() => {
    if (modalState !== "closing") return
    const ms = readMs("--modal-close-dur", 150)
    const id = window.setTimeout(() => {
      setModalState("closed")
      onClose()
    }, ms)
    return () => window.clearTimeout(id)
  }, [modalState, onClose])

  const close = () => {
    setModalState("closing")
  }

  const handleSave = () => {
    saveApiKeys(localKeys)
    sileo.success({
      title: "Claves guardadas",
      description: "Tus API Keys se guardaron en tu navegador (LocalStorage).",
    })
    close()
  }

  const handleClearAll = () => {
    const emptyKeys: ApiKeysState = {
      openrouter: "",
      openai: "",
      gemini: "",
      groq: "",
    }
    setLocalKeys(emptyKeys)
    saveApiKeys(emptyKeys)
    sileo.info({
      title: "Claves eliminadas",
      description: "Se han borrado todas las API keys de LocalStorage.",
    })
  }

  const toggleShow = (p: Provider) => {
    setShowKey((prev) => ({ ...prev, [p]: !prev[p] }))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalState === "open") {
        close()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modalState])

  if (modalState === "closed") return null

  const configuredCount = Object.values(localKeys).filter((k) => k && k.trim().length > 0).length

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Overlay con animación t-modal-overlay */}
      <div
        className={cn(
          "t-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-xs",
          modalState === "open" && "is-open",
          modalState === "closing" && "is-closing"
        )}
        onClick={close}
      />

      {/* Diálogo con animación Transitions.dev .t-modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gestor de API Keys"
        className={cn(
          "t-modal relative w-full max-w-[620px] rounded-[22px] border border-border bg-card p-6 sm:p-7 shadow-2xl z-10 my-auto flex flex-col max-h-[86vh]",
          modalState === "open" && "is-open",
          modalState === "closing" && "is-closing"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">          
            <div>
              <h2 className="text-base font-semibold tracking-[-0.01em]">
                Gestor de API Keys (.env local)
              </h2>
              <p className="text-xs text-muted-foreground">
                Configura tus claves directamente en tu navegador. {configuredCount} de {PROVIDERS_CONFIG.length} configuradas.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={close}
            aria-label="Cerrar"
          >
            <RiCloseLine className="size-5" />
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed border border-border/40">
          <RiInformationLine className="size-4 shrink-0 text-primary mt-0.5" />
          <p>
            Tus claves se almacenan <strong>únicamente en tu LocalStorage</strong> y se envían de forma segura en las consultas a la IA. Puedes ingresar y guardar todas tus claves a la vez.
          </p>
        </div>

        {/* Keys Form List */}
        <div className="mt-4 flex flex-col gap-3.5 overflow-y-auto pr-1 flex-1 py-1">
          {PROVIDERS_CONFIG.map((prov) => {
            const hasKey = Boolean(localKeys[prov.id]?.trim())
            const isSelected = activeProvider === prov.id

            return (
              <div
                key={prov.id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-3.5 transition-colors duration-150",
                  isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/70 bg-card hover:border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`key-${prov.id}`}
                      className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      {prov.name}
                      <code className="text-[10px] font-mono font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {prov.envVar}
                      </code>
                    </Label>
                    {prov.recommended && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 text-primary">
                        Recomendado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasKey ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <RiCheckLine className="size-3.5" />
                        Lista
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Sin clave</span>
                    )}

                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      className="h-6 text-[11px] px-2 rounded-full cursor-pointer"
                      onClick={() => setActiveProvider(prov.id)}
                    >
                      {isSelected ? "Activo" : "Usar"}
                    </Button>
                  </div>
                </div>

                <p className="text-[11.5px] text-muted-foreground leading-snug">{prov.desc}</p>

                <div className="relative mt-1 flex items-center">
                  <Input
                    id={`key-${prov.id}`}
                    type={showKey[prov.id] ? "text" : "password"}
                    value={localKeys[prov.id]}
                    onChange={(e) =>
                      setLocalKeys((prev) => ({ ...prev, [prov.id]: e.target.value }))
                    }
                    placeholder={prov.placeholder}
                    className="h-9 pr-20 font-mono text-xs"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleShow(prov.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded cursor-pointer"
                      aria-label={showKey[prov.id] ? "Ocultar clave" : "Mostrar clave"}
                    >
                      {showKey[prov.id] ? (
                        <RiEyeOffLine className="size-3.5" />
                      ) : (
                        <RiEyeLine className="size-3.5" />
                      )}
                    </button>
                    <a
                      href={prov.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted-foreground hover:text-primary transition-colors rounded cursor-pointer"
                      title={`Obtener API Key de ${prov.name}`}
                    >
                      <RiExternalLinkLine className="size-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5 cursor-pointer"
          >
            <RiDeleteBinLine className="size-3.5 mr-1" />
            Borrar todas
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={close}
              className="text-xs h-8 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs h-8 gap-1.5 font-medium cursor-pointer"
            >
              <RiSaveLine className="size-3.5" />
              Guardar todas las claves
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeysModal
