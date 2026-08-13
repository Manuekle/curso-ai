import { useEffect, useRef, useState } from "react"
import { RiCheckLine, RiCloseLine, RiFileLine, RiLoader4Line, RiUploadCloud2Line } from "@remixicon/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SlidingTabs } from "@/components/SlidingTabs"
import { Textarea } from "@/components/ui/textarea"

type Mode = "agent" | "rag" | "orchestrate"
type Provider = "openai" | "gemini" | "groq" | "openrouter"

type UploadItem = {
  file: File
  state: "pending" | "uploading" | "done" | "error"
  msg?: string
}

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.md,.mdx,.txt,.json,.html"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MODES: Record<Mode, { label: string; description: string }> = {
  agent: {
    label: "Agente",
    description:
      "Agente con tool calling: consulta stock o registra pedidos. Probá: '¿Cuál es el stock del LAP-001?' o 'Registrá un pedido de 3 unidades de MOU-001'",
  },
  rag: {
    label: "RAG",
    description:
      "Recuperación con permisos. Probá '¿Cuándo se considera stock bajo?' (demo ve rh+inventario) y '¿Cada cuánto se rotan las contraseñas?' (owner IT debe denegarse)",
  },
  orchestrate: {
    label: "Multiagente",
    description:
      "Orquestador: arquitectura + seguridad en paralelo, luego síntesis. Ej: '¿Qué arquitectura y riesgos tiene un sistema de inventario con IA?'",
  },
}

const ENDPOINTS: Record<Mode, string> = {
  agent: "/api/agent",
  rag: "/api/rag/ask",
  orchestrate: "/api/orchestrate",
}

function SwapText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(text)

  useEffect(() => {
    const el = ref.current
    if (!el || el.textContent === prevRef.current) return
    el.classList.add("is-exit")
    const timer = window.setTimeout(() => {
      prevRef.current = text
      el.textContent = text
      el.classList.remove("is-exit")
      el.classList.add("is-enter-start")
      void el.offsetWidth
      el.classList.remove("is-enter-start")
    }, 150)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <span ref={ref} className="t-text-swap">
      {text}
    </span>
  )
}

export function Playground() {
  const [mode, setMode] = useState<Mode>("agent")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [meta, setMeta] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<Provider>(() => (localStorage.getItem("active-provider") as Provider) || "openai")
  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(() => 
    JSON.parse(localStorage.getItem("api-keys") || '{"openai":"","gemini":"","groq":"","openrouter":""}')
  )

  useEffect(() => {
    const activeAgent = localStorage.getItem("active-agent")
    if (activeAgent) {
      const agent = JSON.parse(activeAgent) as { instructions?: string; provider?: Provider }
      if (agent.instructions) {
        setQuestion(`System Instructions:\n${agent.instructions}`)
      }
      if (agent.provider) {
        setProvider(agent.provider)
      }
      localStorage.removeItem("active-agent")
    }
  }, [])

  const [docText, setDocText] = useState("")
  const [docOwner, setDocOwner] = useState("demo")
  const [indexInfo, setIndexInfo] = useState("")

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem("active-provider", provider)
    localStorage.setItem("api-keys", JSON.stringify(apiKeys))
  }, [provider, apiKeys])

  async function send() {
    setLoading(true)
    setError("")
    setAnswer("")
    setMeta("")
    try {
      const res = await fetch(ENDPOINTS[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question, 
          user: "demo", 
          config: { provider, apiKey: apiKeys[provider] } 
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(`HTTP ${res.status}: ${body?.error ?? res.statusText}`)
      }
      const data = await res.json()
      if (mode === "agent") {
        setAnswer(data.answer)
        setMeta(`tool calls: ${data.toolCalls} · iteraciones: ${data.iterations}`)
      } else if (mode === "rag") {
        setAnswer(data.answer)
        setMeta(`hits: ${data.hits} · permitidos: ${data.allowedHits} · fuentes: ${data.sources.join(", ")}`)
      } else {
        setAnswer(data.summary)
        setMeta(
          `confianza: ${data.finalConfidence} · ` +
            data.results.map((r: { agent: string; output: string }) => `${r.agent}: ${r.output}`).join(" · ")
        )
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function indexDoc() {
    if (!docText.trim()) return
    setIndexInfo("")
    try {
      const res = await fetch("/api/rag/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: docText, owner: docOwner }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIndexInfo(`Indexado: ${data.chunks} chunks · total en store: ${data.totalDocs}`)
    } catch (err) {
      setIndexInfo((err as Error).message)
    }
  }

  async function uploadFiles(items: UploadItem[]) {
    for (const item of items) {
      setUploads((prev) => prev.map((u) => (u.file === item.file ? { ...u, state: "uploading" } : u)))
      try {
        const fd = new FormData()
        fd.append("files", item.file)
        fd.append("owner", docOwner)
        const res = await fetch("/api/rag/index-file", {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const r = data.files?.[0]
        if (!r) throw new Error("Respuesta vacía del servidor")
        setUploads((prev) =>
          prev.map((u) =>
            u.file === item.file
              ? {
                  ...u,
                  state: r.error ? "error" : "done",
                  msg: r.error ?? `${r.chunks} chunks · ${r.chars} chars`,
                }
              : u
          )
        )
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) => (u.file === item.file ? { ...u, state: "error", msg: (err as Error).message } : u))
        )
      }
    }
  }

  function addFiles(list: FileList | File[]) {
    const items = Array.from(list).map((file) => ({ file, state: "pending" as const }))
    setUploads((prev) => [...prev, ...items])
    void uploadFiles(items)
  }

  function removeUpload(file: File) {
    setUploads((prev) => prev.filter((u) => u.file !== file))
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="px-8">
        <CardTitle>Práctica local</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-8">
        <div className="flex gap-2">
          <Select 
            value={provider} 
            onValueChange={(v) => setProvider(v as Provider)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="password"
            value={apiKeys[provider]}
            onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
            placeholder={`API Key para ${provider}`}
          />
        </div>
        <div className="flex flex-col gap-4">
          <SlidingTabs
            fill
            tabs={(Object.keys(MODES) as Mode[]).map((m) => ({ key: m, label: MODES[m].label }))}
            active={(Object.keys(MODES) as Mode[]).indexOf(mode)}
            onChange={(i) => setMode((Object.keys(MODES) as Mode[])[i])}
          />
          <div className="anim-tab">
            <p className="text-sm text-muted-foreground">{MODES[mode].description}</p>
          </div>
        </div>

        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Tu pregunta…" rows={3} />
        <div className="flex gap-2">
          <Button onClick={send} disabled={loading || !question}>
            {loading ? (
              <span className="t-shimmer" data-text="Pensando…">
                Pensando…
              </span>
            ) : (
              "Enviar"
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="anim-shake">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="break-all">{error}</AlertDescription>
          </Alert>
        )}

        {answer && (
          <div className="flex flex-col gap-2">
            <pre className="rounded-lg border bg-muted p-4 font-mono text-sm whitespace-pre-wrap">
              <SwapText text={answer} />
            </pre>
            {meta && (
              <p className="text-xs text-muted-foreground">
                <SwapText text={meta} />
              </p>
            )}
          </div>
        )}

        {mode === "rag" && (
          <>
            <Separator />
            <div className="flex flex-col gap-3">
              <h3 className="text-sm">Indexar documentos</h3>
              <Input value={docOwner} onChange={(e) => setDocOwner(e.target.value)} placeholder="owner (rh / inventario / it / admin / otro)" />
              <div
                role="button"
                tabIndex={0}
                aria-label="Seleccionar archivos"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  addFiles(e.dataTransfer.files)
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-4xl border-2 border-dashed px-6 py-8 text-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                  dragging
                    ? "border-ring bg-ring/10 scale-[1.01]"
                    : "border-input bg-input/30 hover:border-ring/60 hover:bg-input/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
                <RiUploadCloud2Line className={`h-10 w-10 ${dragging ? "text-ring" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">
                  {dragging ? "Soltá los archivos acá" : "Arrastrá tus archivos acá"}
                </p>
                <p className="text-xs text-muted-foreground">
                  o hacé clic para elegir · 1 o más · máx 10 MB c/u
                </p>
              </div>
              {uploads.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {uploads.map((u) => (
                    <li
                      key={u.file.name + u.file.size}
                      className="flex items-center gap-2 rounded-xl border border-input bg-input/30 px-3 py-2"
                    >
                      <RiFileLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm" title={u.file.name}>
                            {u.file.name}
                          </p>
                          <p className="shrink-0 text-xs text-muted-foreground">{formatSize(u.file.size)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.state === "uploading" && (
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-1/2 animate-pulse rounded-full bg-ring" />
                            </div>
                          )}
                          {u.state === "done" && <p className="text-xs text-muted-foreground">{u.msg}</p>}
                          {u.state === "error" && (
                            <p className="truncate text-xs text-destructive" title={u.msg}>
                              {u.msg}
                            </p>
                          )}
                        </div>
                      </div>
                      {u.state === "pending" && <span className="text-xs text-muted-foreground">En cola</span>}
                      {u.state === "uploading" && (
                        <RiLoader4Line className="h-4 w-4 shrink-0 animate-spin text-ring" />
                      )}
                      {u.state === "done" && <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-500" />}
                      {u.state === "error" && <RiCloseLine className="h-4 w-4 shrink-0 text-destructive" />}
                      {u.state !== "uploading" && (
                        <button
                          type="button"
                          aria-label={`Quitar ${u.file.name}`}
                          onClick={() => removeUpload(u.file)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <RiCloseLine className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Textarea value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="Pegá el contenido del documento…" rows={5} />
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={indexDoc}>
                  Indexar
                </Button>
                {indexInfo && <Badge variant="outline" className="anim-pop">{indexInfo}</Badge>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default Playground