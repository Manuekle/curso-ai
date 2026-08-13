import { useEffect, useRef, useState } from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiFileLine,
  RiFilter3Line,
  RiFlashlightLine,
  RiKey2Line,
  RiLoader4Line,
  RiRefreshLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
  RiTimeLine,
  RiUploadCloud2Line,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SlidingTabs } from "@/components/SlidingTabs"
import { Textarea } from "@/components/ui/textarea"
import { LiquidSlider } from "@/components/LiquidSlider"
import { NumberPopIn } from "@/components/NumberPopIn"
import { useApiKeys, openApiKeysModal, type Provider } from "@/hooks/useApiKeys"
import { AIErrorCard } from "@/components/AIErrorCard"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

type Mode = "rag" | "vectordb" | "agent" | "orchestrate"

type UploadItem = {
  file: File
  state: "pending" | "uploading" | "done" | "error"
  msg?: string
}

interface ScoredHit {
  id: string
  owner: string
  score: number
  passedThreshold: boolean
  permitted: boolean
  snippet: string
}

interface AgentStep {
  iteration: number
  action: "tool_call" | "tool_result" | "final_answer"
  toolName?: string
  toolArgs?: any
  toolOutput?: any
  detail?: string
}

interface SpecializedResult {
  agent: string
  output: string
  confidence: number
  latencyMs: number
}

interface VectorDoc {
  id: string
  owner: string
  text: string
  chars: number
  vectorDim: number
  vectorSample: number[]
}

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.md,.mdx,.txt,.json,.html"

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MODES: Record<Mode, { label: string; description: string }> = {
  rag: {
    label: "RAG",
    description:
      "Pipeline RAG: recuperación con filtro por umbral de similitud (threshold) y permisos RBAC antes del LLM.",
  },
  vectordb: {
    label: "Base Vectorial",
    description:
      "Laboratorio Vector DB (doc #25): inspección de embeddings, búsqueda híbrida (BM25 + Coseno), reranking y semantic cache.",
  },
  agent: {
    label: "Agente",
    description:
      "Agente con tool calling (doc #13): consulta stock o registra pedidos en el ERP. Frontera de permisos y límites.",
  },
  orchestrate: {
    label: "Multiagente",
    description:
      "Orquestador (doc #18): especialistas en arquitectura y seguridad en paralelo, evaluación y síntesis final.",
  },
}

const ENDPOINTS: Record<Mode, string> = {
  rag: "/api/rag/ask",
  vectordb: "/api/demo/retrieve",
  agent: "/api/agent",
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
  }, [text])

  return (
    <span ref={ref} className="t-text-swap">
      {text}
    </span>
  )
}

export function Playground() {
  const [mode, setMode] = useState<Mode>("rag")
  const [question, setQuestion] = useState("¿Cuándo se considera stock bajo?")
  const [user, setUser] = useState("demo")
  const [threshold, setThreshold] = useState<number>(0.20)
  const [topK, setTopK] = useState<number>(4)
  const [activeTab, setActiveTab] = useState<"result" | "trace" | "chunks">("result")

  const [answer, setAnswer] = useState("")
  const [meta, setMeta] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedLog, setCopiedLog] = useState(false)

  // Vector DB Explorer states
  const [vectorDocs, setVectorDocs] = useState<VectorDoc[]>([])
  const [vdbSubTab, setVdbSubTab] = useState<"store" | "hybrid" | "cache">("store")
  const [hybridResults, setHybridResults] = useState<{ raw: any[]; reranked: any[] } | null>(null)
  const [cacheResult, setCacheResult] = useState<any>(null)
  const [cacheThreshold, setCacheThreshold] = useState<number>(0.85)

  // Diagnostics states
  const [pythonLog, setPythonLog] = useState<string>("")
  const [scoredHits, setScoredHits] = useState<ScoredHit[]>([])
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [specializedResults, setSpecializedResults] = useState<SpecializedResult[]>([])
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [vectorDims, setVectorDims] = useState<number>(1536)

  const { apiKeys, activeProvider: provider, setActiveProvider: setProvider, configuredCount } = useApiKeys()

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
  }, [setProvider])

  const [docText, setDocText] = useState("")
  const [docOwner, setDocOwner] = useState("demo")
  const [indexInfo, setIndexInfo] = useState("")

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar chunks de la Vector DB
  const loadVectorStore = async () => {
    try {
      const res = await fetch("/api/rag/store")
      if (res.ok) {
        const data = await res.json()
        setVectorDocs(data.chunks || [])
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (mode === "vectordb" || mode === "rag") {
      void loadVectorStore()
    }
  }, [mode])

  async function resetVectorStore() {
    setLoading(true)
    try {
      const res = await fetch("/api/rag/reset-store", { method: "POST" })
      if (res.ok) {
        await loadVectorStore()
        setIndexInfo("Vector Store reiniciada con documentos por defecto")
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteChunk(id: string) {
    try {
      const res = await fetch("/api/rag/delete-chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        await loadVectorStore()
      }
    } catch {
      // ignore
    }
  }

  async function runHybridSearch() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/demo/rerank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          user,
          config: { provider, apiKey: apiKeys[provider] },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error en búsqueda híbrida")
      }
      const data = await res.json()
      setHybridResults(data)
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      sileo.error({
        title: "Error en búsqueda híbrida",
        description: msg.length > 75 ? msg.slice(0, 72) + "..." : msg,
      })
    } finally {
      setLoading(false)
    }
  }

  async function testSemanticCache() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/rag/semantic-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cacheThreshold,
          config: { provider, apiKey: apiKeys[provider] },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Error evaluando semantic cache")
      }
      const data = await res.json()
      setCacheResult(data)
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      sileo.error({
        title: "Error en semantic cache",
        description: msg.length > 75 ? msg.slice(0, 72) + "..." : msg,
      })
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    setLoading(true)
    setError("")
    setAnswer("")
    setMeta("")
    setPythonLog("")
    setScoredHits([])
    setAgentSteps([])
    setSpecializedResults([])
    setLatencyMs(0)

    try {
      const res = await fetch(ENDPOINTS[mode], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          user,
          threshold,
          topK,
          config: { provider, apiKey: apiKeys[provider] },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()

      if (mode === "agent") {
        setAnswer(data.answer)
        setMeta(`tool calls: ${data.toolCalls} · iteraciones: ${data.iterations} · latencia: ${data.latencyMs ?? 0}ms`)
        setPythonLog(data.pythonLog ?? "")
        setAgentSteps(data.steps ?? [])
        setLatencyMs(data.latencyMs ?? 0)
      } else if (mode === "rag") {
        setAnswer(data.answer)
        setMeta(`hits superan umbral: ${data.hits} · permitidos RBAC: ${data.allowedHits} · fuentes: ${data.sources.join(", ")} · latencia: ${data.latencyMs ?? 0}ms`)
        setPythonLog(data.pythonLog ?? "")
        setScoredHits(data.scoredHits ?? [])
        setLatencyMs(data.latencyMs ?? 0)
        setVectorDims(data.dimensions ?? 1536)
      } else if (mode === "orchestrate") {
        setAnswer(data.summary)
        setMeta(`confianza final: ${data.finalConfidence} · agentes: ${data.results.length} · latencia: ${data.latencyMs ?? 0}ms`)
        setPythonLog(data.pythonLog ?? "")
        setSpecializedResults(data.results ?? [])
        setLatencyMs(data.latencyMs ?? 0)
      } else if (mode === "vectordb") {
        setScoredHits(data.hits ?? [])
        setMeta(`top-${data.hits?.length ?? 0} candidatos recuperados de la base vectorial`)
      }
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      sileo.error({
        title: "Error en la consulta",
        description: msg.length > 75 ? msg.slice(0, 72) + "..." : msg,
      })
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
        body: JSON.stringify({
          text: docText,
          owner: docOwner,
          config: { provider, apiKey: apiKeys[provider] },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIndexInfo(`Indexado: ${data.chunks} chunks · total en store: ${data.totalDocs}`)
      setDocText("")
      await loadVectorStore()
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
        await loadVectorStore()
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

  const logSwapRef = useRef<HTMLSpanElement>(null)

  async function copyLogToClipboard() {
    if (!pythonLog) return
    try {
      await navigator.clipboard.writeText(pythonLog)
      setCopiedLog(true)
      const el = logSwapRef.current
      if (el) {
        el.classList.add("is-exit")
        window.setTimeout(() => {
          el.classList.remove("is-exit")
          el.classList.add("is-enter-start")
          void el.offsetWidth
          el.classList.remove("is-enter-start")
        }, 150)
      }
      setTimeout(() => setCopiedLog(false), 1800)
    } catch {}
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/80 shadow-sm">
      <CardHeader className="px-6 pb-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl font-medium">Práctica local</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-medium">
              vector-db: <NumberPopIn value={vectorDocs.length} /> chunks
            </Badge>
            {latencyMs > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1 font-mono text-xs font-normal">
                <RiTimeLine className="h-3 w-3" />
                <NumberPopIn value={latencyMs} />ms
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 px-6 sm:px-8">
        {/* Proveedor y Gestor de API Keys (.env local) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground ml-0.5">Proveedor:</span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full shadow-xs">
              {(["openrouter", "openai", "gemini", "groq"] as Provider[]).map((p) => {
                const hasKey = Boolean(apiKeys[p]?.trim())
                const isSelected = provider === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        hasKey ? "bg-emerald-500" : "bg-muted-foreground/40"
                      )}
                    />
                    <span className="capitalize">{p}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openApiKeysModal}
              className="h-8 text-xs gap-1.5 rounded-full border-border/80 hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <RiKey2Line className="size-3.5 text-primary" />
              <span>Configurar API Keys (.env)</span>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                {configuredCount}/4
              </span>
            </Button>
          </div>
        </div>

        {/* Modo selector */}
        <div className="flex flex-col gap-3">
          <SlidingTabs
            fill
            tabs={(Object.keys(MODES) as Mode[]).map((m) => ({ key: m, label: MODES[m].label }))}
            active={(Object.keys(MODES) as Mode[]).indexOf(mode)}
            onChange={(i) => {
              const newMode = (Object.keys(MODES) as Mode[])[i]
              setMode(newMode)
              if (newMode === "agent") setQuestion("¿Cuál es el stock del LAP-001?")
              else if (newMode === "rag") setQuestion("¿Cuándo se considera stock bajo?")
              else if (newMode === "vectordb") setQuestion("¿Cada cuánto se rotan las contraseñas?")
              else setQuestion("¿Qué arquitectura y riesgos tiene un sistema de inventario con IA?")
            }}
          />
          <div className="anim-tab rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{MODES[mode].description}</p>
          </div>
        </div>

        {/* Controles avanzados de RAG con LiquidSlider y NumberPopIn */}
        {mode === "rag" && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold" className="flex items-center gap-1 text-xs font-medium">
                  <RiFilter3Line className="h-3.5 w-3.5 text-primary" />
                  Umbral (Threshold):
                </Label>
                <Badge variant="outline" className="font-mono text-xs font-medium">
                  <NumberPopIn value={threshold.toFixed(2)} />
                </Badge>
              </div>
              <LiquidSlider
                id="threshold"
                min={0.0}
                max={0.95}
                step={0.05}
                value={threshold}
                onChange={setThreshold}
              />
              <span className="text-[11px] text-muted-foreground">
                Descarta chunks con similitud menor a {threshold.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="topK" className="text-xs font-medium">
                  Top-K Chunks:
                </Label>
                <Badge variant="outline" className="font-mono text-xs font-medium">
                  <NumberPopIn value={topK} />
                </Badge>
              </div>
              <LiquidSlider
                id="topK"
                min={1}
                max={8}
                step={1}
                value={topK}
                onChange={setTopK}
              />
              <span className="text-[11px] text-muted-foreground">Candidatos enviados al contexto</span>
            </div>

            <div className="flex flex-col gap-1 sm:col-span-1">
              <Label className="flex items-center gap-1 text-xs font-medium">
                <RiShieldCheckLine className="h-3.5 w-3.5 text-primary" />
                Usuario RBAC:
              </Label>
              <div className="flex gap-2">
                {(["demo", "admin"] as const).map((u) => (
                  <Button
                    key={u}
                    type="button"
                    variant={user === u ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs font-normal"
                    onClick={() => setUser(u)}
                  >
                    {u === "demo" ? "demo (rh+inv)" : "admin (todo)"}
                  </Button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {user === "demo" ? "Bloquea IT (contraseñas)" : "Acceso total sin restricciones"}
              </span>
            </div>
          </div>
        )}

        {/* MODO EXPLORADOR DE BASE VECTORIAL (doc #25) */}
        {mode === "vectordb" && (
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <RiDatabase2Line className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Laboratorio Vector DB</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {vectorDocs.length} vectores
                </Badge>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={vdbSubTab === "store" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-normal"
                  onClick={() => setVdbSubTab("store")}
                >
                  Documentos & Vectores
                </Button>
                <Button
                  variant={vdbSubTab === "hybrid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-normal"
                  onClick={() => setVdbSubTab("hybrid")}
                >
                  Búsqueda Híbrida
                </Button>
                <Button
                  variant={vdbSubTab === "cache" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs font-normal"
                  onClick={() => setVdbSubTab("cache")}
                >
                  Cache Semántico
                </Button>
              </div>
            </div>

            {/* SubTab 1: Inspección de Chunks y Vectores */}
            {vdbSubTab === "store" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Documentos indexados en memoria</span>
                  <div className="flex items-center gap-2">
                    <span>Dimensión: {vectorDocs[0]?.vectorDim ?? 1536}d</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                      onClick={resetVectorStore}
                      title="Reiniciar vectores"
                    >
                      <RiRefreshLine className="h-3 w-3 mr-1" />
                      Reiniciar
                    </Button>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto flex flex-col gap-2 pr-1">
                  {vectorDocs.length === 0 ? (
                    <p className="p-4 text-center text-xs text-muted-foreground">No hay vectores en store.</p>
                  ) : (
                    vectorDocs.map((doc) => (
                      <div key={doc.id} className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{doc.id}</span>
                            <Badge variant="secondary">owner: {doc.owner}</Badge>
                            <span className="text-[11px] text-muted-foreground">{doc.chars} chars</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteChunk(doc.id)}
                            title="Eliminar chunk"
                          >
                            <RiDeleteBinLine className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{doc.text}</p>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>vector[{doc.vectorDim}]:</span>
                          <span className="truncate bg-muted px-1.5 py-0.5 rounded">
                            [{doc.vectorSample?.map((v) => v.toFixed(3)).join(", ")}...]
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SubTab 2: Búsqueda Híbrida y Reranking */}
            {vdbSubTab === "hybrid" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Compara <span className="font-medium text-foreground">Top-8 crudo (Coseno)</span> vs <span className="font-medium text-foreground">Top-5 Reranked</span> con señal léxica BM25 (solape de tokens). Ideal para códigos, siglas y SKUs.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Consulta para evaluar (ej. 'SKU-4412' o 'vacaciones')..."
                    className="text-xs"
                  />
                  <Button size="sm" onClick={runHybridSearch} disabled={loading} className="font-normal">
                    <RiSearchLine className="h-3.5 w-3.5 mr-1" />
                    Comparar
                  </Button>
                </div>
                {hybridResults && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Top-8 Coseno Crudo</span>
                      {hybridResults.raw.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                          <span className="font-mono">{h.id}</span>
                          <div className="flex gap-1 font-mono text-[11px]">
                            <Badge variant="outline">cos: {h.score}</Badge>
                            <Badge variant="outline">bm25: {h.overlap}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-primary">Top-5 Reranked (Cross-Signal)</span>
                      {hybridResults.reranked.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded border border-primary/40 bg-primary/5 p-2 text-xs">
                          <span className="font-mono font-medium">{h.id}</span>
                          <div className="flex gap-1 font-mono text-[11px]">
                            <Badge variant="default">final: {(h.score + h.overlap).toFixed(3)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SubTab 3: Semantic Cache */}
            {vdbSubTab === "cache" && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Semantic Cache (doc #54)</strong>: Si la similitud semántica con una consulta previa es $\ge$ {cacheThreshold.toFixed(2)}, devuelve la respuesta sin invocar al LLM (0ms, 0 tokens).
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label htmlFor="cacheThreshold">Umbral de Cache (Hit Threshold):</Label>
                    <Badge variant="outline" className="font-mono">
                      <NumberPopIn value={cacheThreshold.toFixed(2)} />
                    </Badge>
                  </div>
                  <LiquidSlider
                    id="cacheThreshold"
                    min={0.70}
                    max={0.98}
                    step={0.02}
                    value={cacheThreshold}
                    onChange={setCacheThreshold}
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Escribí una pregunta parecida..."
                    className="text-xs"
                  />
                  <Button size="sm" onClick={testSemanticCache} disabled={loading}>
                    <RiFlashlightLine className="h-3.5 w-3.5 mr-1" />
                    Probar Cache
                  </Button>
                </div>

                {cacheResult && (
                  <div className={`flex flex-col gap-2 rounded-lg border p-3 text-xs ${cacheResult.isHit ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                    <div className="flex items-center justify-between">
                      <Badge variant={cacheResult.isHit ? "default" : "outline"} className={cacheResult.isHit ? "bg-emerald-600" : ""}>
                        {cacheResult.isHit ? "CACHE HIT (0ms LLM / 0 Tokens)" : "CACHE MISS -> RAG Retrieval"}
                      </Badge>
                      <span className="font-mono text-muted-foreground">
                        Similitud: {cacheResult.bestMatch?.similarity.toFixed(4)}
                      </span>
                    </div>
                    {cacheResult.bestMatch && (
                      <div className="flex flex-col gap-1 pt-1">
                        <p className="text-muted-foreground">Match más cercano: <em>"{cacheResult.bestMatch.query}"</em></p>
                        <p className="font-medium">{cacheResult.bestMatch.answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input de pregunta para RAG / Agente / Multiagente */}
        {mode !== "vectordb" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="question" className="text-xs font-medium">
              Entrada / Pregunta:
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribí tu pregunta o comando..."
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {mode !== "vectordb" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={send} disabled={loading || !question.trim()} className="px-6">
              {loading ? (
                <span className="flex items-center gap-2">
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                  Ejecutando pipeline...
                </span>
              ) : (
                "Ejecutar"
              )}
            </Button>

            {pythonLog && (
              <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-1">
                <Button
                  variant={activeTab === "result" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveTab("result")}
                >
                  Respuesta
                </Button>
                <Button
                  variant={activeTab === "trace" ? "secondary" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1.5 h-7 text-xs"
                  onClick={() => setActiveTab("trace")}
                >
                  <RiTerminalBoxLine className="h-3.5 w-3.5" />
                  Traza Python
                </Button>
                {mode === "rag" && scoredHits.length > 0 && (
                  <Button
                    variant={activeTab === "chunks" ? "secondary" : "ghost"}
                    size="sm"
                    className="flex items-center gap-1.5 h-7 text-xs"
                    onClick={() => setActiveTab("chunks")}
                  >
                    <RiFilter3Line className="h-3.5 w-3.5" />
                    Chunks ({scoredHits.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <AIErrorCard
            error={error}
            onOpenKeysModal={openApiKeysModal}
            onRetry={send}
            className="anim-shake"
          />
        )}

        {/* Panel de resultados y diagnósticos */}
        {answer && mode !== "vectordb" && (
          <div className="flex flex-col gap-3">
            {activeTab === "result" && (
              <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Respuesta del Modelo
                  </span>
                  {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
                </div>
                <div className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                  <SwapText text={answer} />
                </div>

                {/* Agente tool steps timeline */}
                {mode === "agent" && agentSteps.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">Llamadas a Tools (ERP):</span>
                    <div className="flex flex-col gap-1.5">
                      {agentSteps
                        .filter((s) => s.action === "tool_call" || s.action === "tool_result")
                        .map((step, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2 text-xs font-mono"
                          >
                            <Badge variant={step.action === "tool_call" ? "outline" : "secondary"}>
                              {step.action === "tool_call" ? "TOOL CALL" : "TOOL RESULT"}
                            </Badge>
                            <span className="font-medium text-primary">{step.toolName}:</span>
                            <span className="truncate text-muted-foreground">
                              {step.action === "tool_call" ? JSON.stringify(step.toolArgs) : JSON.stringify(step.toolOutput)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Multiagente specialized cards */}
                {mode === "orchestrate" && specializedResults.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-2">
                    {specializedResults.map((r) => (
                      <div key={r.agent} className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium capitalize">{r.agent}</span>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            conf: {r.confidence.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">{r.output}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Consola de traza Python / IA */}
            {activeTab === "trace" && pythonLog && (
              <div className="flex flex-col rounded-xl border border-zinc-800 bg-[#0d1117] text-zinc-100 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                    <span className="font-mono text-xs font-medium text-zinc-300">
                      python_runtime.log — telemetry & diagnostics
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyLogToClipboard}
                    className="h-7 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 font-normal"
                  >
                    <span ref={logSwapRef} className="t-text-swap">
                      {copiedLog ? (
                        <>
                          <RiCheckLine className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <RiFileCopyLine className="mr-1 h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </span>
                  </Button>
                </div>
                <pre className="max-h-[380px] overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap selection:bg-zinc-700">
                  {pythonLog}
                </pre>
              </div>
            )}

            {/* Visualizador de Chunks y Umbrales */}
            {activeTab === "chunks" && scoredHits.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Evaluación de Chunks vs Umbral (<NumberPopIn value={threshold.toFixed(2)} />)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vector: <NumberPopIn value={vectorDims} /> dims
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {scoredHits.map((h) => (
                    <div
                      key={h.id}
                      className={`flex flex-col gap-2 rounded-lg border p-3 text-xs transition-colors ${
                        h.passedThreshold && h.permitted
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : !h.passedThreshold
                          ? "border-border/60 bg-muted/20 opacity-75"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{h.id}</span>
                          <Badge variant="secondary">owner: {h.owner}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={h.passedThreshold ? "default" : "outline"}
                            className="font-mono text-[11px]"
                          >
                            coseno: <NumberPopIn value={h.score.toFixed(4)} />
                          </Badge>
                          <Badge
                            variant={
                              h.passedThreshold && h.permitted
                                ? "default"
                                : h.passedThreshold && !h.permitted
                                ? "destructive"
                                : "outline"
                            }
                            className="text-[11px]"
                          >
                            {h.passedThreshold && h.permitted
                              ? "Supera Umbral & Permitido"
                              : !h.passedThreshold
                              ? `Filtrado (< ${threshold.toFixed(2)})`
                              : "Bloqueado por RBAC"}
                          </Badge>
                        </div>
                      </div>

                      {/* Visual progress bar vs threshold */}
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            h.passedThreshold ? "bg-primary" : "bg-muted-foreground/40"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, h.score * 100))}%` }}
                        />
                        {/* Threshold line marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                          style={{ left: `${threshold * 100}%` }}
                          title={`Umbral: ${threshold.toFixed(2)}`}
                        />
                      </div>

                      <p className="text-muted-foreground">{h.snippet}…</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección de indexación de documentos */}
        {(mode === "rag" || mode === "vectordb") && (
          <>
            <Separator className="my-2" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Indexar documentos a la Base Vectorial</h3>
                <span className="text-xs text-muted-foreground">Store en memoria</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={docOwner}
                  onChange={(e) => setDocOwner(e.target.value)}
                  placeholder="owner (rh / inventario / it / admin / otro)"
                  className="max-w-xs"
                />
              </div>

              {/* Zona de drag & drop */}
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
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                  dragging
                    ? "border-ring bg-ring/10 scale-[1.01]"
                    : "border-input bg-input/20 hover:border-ring/60 hover:bg-input/40"
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
                <RiUploadCloud2Line className={`h-8 w-8 ${dragging ? "text-ring" : "text-muted-foreground"}`} />
                <p className="text-xs font-medium">
                  {dragging ? "Soltá los archivos acá" : "Arrastrá archivos PDF, DOCX, XLSX, TXT, MD acá"}
                </p>
                <p className="text-[11px] text-muted-foreground">o hacé clic para elegir · máx 10 MB c/u</p>
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
                          <p className="truncate text-xs" title={u.file.name}>
                            {u.file.name}
                          </p>
                          <p className="shrink-0 text-[11px] text-muted-foreground">{formatSize(u.file.size)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.state === "uploading" && (
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full w-1/2 animate-pulse rounded-full bg-ring" />
                            </div>
                          )}
                          {u.state === "done" && <p className="text-[11px] text-muted-foreground">{u.msg}</p>}
                          {u.state === "error" && (
                            <p className="truncate text-[11px] text-destructive" title={u.msg}>
                              {u.msg}
                            </p>
                          )}
                        </div>
                      </div>
                      {u.state === "pending" && <span className="text-[11px] text-muted-foreground">En cola</span>}
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

              <Textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="O pegá texto directo para indexar..."
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={indexDoc}>
                  Indexar Texto
                </Button>
                {indexInfo && (
                  <Badge variant="outline" className="anim-pop text-xs">
                    {indexInfo}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default Playground