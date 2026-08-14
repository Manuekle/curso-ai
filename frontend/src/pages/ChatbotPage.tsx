import { useEffect, useRef, useState } from "react"
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import * as mammoth from "mammoth"
import * as XLSX from "xlsx"
import {
  RiCheckLine,
  RiCloseLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiFileLine,
  RiKey2Line,
  RiLoader4Line,
  RiRobot2Line,
  RiSendPlaneLine,
  RiUploadCloud2Line,
  RiUserLine,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { NumberPopIn } from "@/components/NumberPopIn"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"
import { AIErrorCard } from "@/components/AIErrorCard"
import { openApiKeysModal, useApiKeys, type Provider } from "@/hooks/useApiKeys"
import {
  chatCompletion,
  clearStore,
  embedTexts,
  getChatModel,
  getEmbeddingModel,
  importFromServer,
  indexText,
  loadStore,
  searchLocal,
  type LocalDoc,
} from "@/lib/localRag"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

type UploadState = "pending" | "processing" | "done" | "error"

type UploadItem = {
  file: File
  state: UploadState
  msg?: string
  phase?: "extract" | "embed"
  progress?: { done: number; total: number }
}

const HISTORY_KEY = "chatbot-history"
const ACCEPT = ".md,.txt,.pdf,.docx,.xlsx,.csv"

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Extrae texto plano según extensión: pdf / docx / xlsx / csv / md / txt.
async function extractText(file: File): Promise<{ text: string; name: string }> {
  const base = file.name.replace(/\.[^.]+$/, "")
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (ext === "pdf") {
    const buf = await file.arrayBuffer()
    const pdf = await getDocument({ data: buf }).promise
    let out = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n"
    }
    return { text: out, name: base }
  }

  if (ext === "docx") {
    const buf = await file.arrayBuffer()
    const res = await mammoth.extractRawText({ arrayBuffer: buf })
    return { text: res.value ?? "", name: base }
  }

  if (ext === "xlsx") {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const parts: string[] = []
    for (const sheet of wb.SheetNames) {
      parts.push(`[hoja: ${sheet}]\n` + XLSX.utils.sheet_to_csv(wb.Sheets[sheet]))
    }
    return { text: parts.join("\n\n"), name: base }
  }

  // md, txt, csv → texto plano directo
  return { text: await file.text(), name: base }
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as ChatMessage[]) : []
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages))
  } catch {
    // ignore
  }
}

// Small talk: saludos, agradecimientos y despedidas NO pasan por RAG (no hay similitud semántica con docs).
const SMALL_TALK: Array<{ pattern: RegExp; reply: string }> = [
  {
    pattern: /^(hola|buenas|buen día|buenos días|buen dia|buenos dias|hey|hi|hello)\b[\s!.,]*$/i,
    reply:
      "¡Hola! Soy tu asistente sobre tus documentos. Preguntame algo sobre lo que indexaste (vacaciones, stock, políticas…).",
  },
  {
    pattern: /^(gracias|muchas gracias|thank you|thanks)\b[\s!.,]*$/i,
    reply: "¡De nada! Preguntame lo que necesites.",
  },
  {
    pattern: /^(chau|adiós|adios|hasta luego|bye|nos vemos)\b[\s!.,]*$/i,
    reply: "¡Chau! Quedo por acá si necesitás algo más.",
  },
  {
    pattern: /^qui[eé]n (eres|sos|sois)\??$/i,
    reply:
      "Soy un chatbot con RAG 100% local: respondo sobre los documentos que subiste o importaste. Vectores y chat viven en tu localStorage, sin servidor.",
  },
]

function detectSmallTalk(q: string): string | null {
  const trimmed = q.trim()
  for (const t of SMALL_TALK) {
    if (t.pattern.test(trimmed)) return t.reply
  }
  return null
}

export function ChatbotPage() {
  const { apiKeys, activeProvider, configuredCount, setActiveProvider } = useApiKeys()
  const [docs, setDocs] = useState<LocalDoc[]>(() => loadStore())
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory())
  const [question, setQuestion] = useState("")
  const [busy, setBusy] = useState<"chat" | "import" | null>(null)
  const [mode, setMode] = useState<"provider" | "local">("local")
  const [lastError, setLastError] = useState("")
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  const vectorDim = docs[0]?.vector.length ?? 0

  async function processUploads(items: UploadItem[]) {
    for (const item of items) {
      setUploads((prev) => prev.map((u) => (u.file === item.file ? { ...u, state: "processing", phase: "extract" } : u)))
      try {
        const { text, name } = await extractText(item.file)
        if (!text.trim()) throw new Error("sin texto extraído")
        const res = await indexText(name, text, apiKeys, activeProvider, (done, total) => {
          setUploads((prev) =>
            prev.map((u) => (u.file === item.file ? { ...u, phase: "embed", progress: { done, total } } : u))
          )
        })
        setMode(res.mode)
        setDocs(loadStore())
        setUploads((prev) =>
          prev.map((u) =>
            u.file === item.file ? { ...u, state: "done", msg: `${res.chunks} chunks` } : u
          )
        )
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) => (u.file === item.file ? { ...u, state: "error", msg: (err as Error).message } : u))
        )
      }
    }
    setDocs(loadStore())
  }

  function addFiles(list: FileList | File[]) {
    const items = Array.from(list).map((file) => ({ file, state: "pending" as const }))
    setUploads((prev) => [...prev, ...items])
    void processUploads(items)
  }

  function removeUpload(file: File) {
    setUploads((prev) => prev.filter((u) => u.file !== file))
  }

  async function handleImportServer() {
    setBusy("import")
    setLastError("")
    try {
      const res = await importFromServer(apiKeys, activeProvider)
      setDocs(loadStore())
      setMode(res.mode)
      sileo.success({
        title: "Base importada",
        description: res.imported > 0 ? `${res.imported} chunks desde el server` : "El server no tiene docs indexados",
      })
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      sileo.error({ title: "Error al importar", description: msg.slice(0, 75) })
    } finally {
      setBusy(null)
    }
  }

  function handleClear() {
    clearStore()
    setDocs([])
    sileo.success({ title: "Store local vaciado", description: "Los vectores en localStorage fueron eliminados" })
  }

  function handleClearChat() {
    setMessages([])
  }

  async function send() {
    const q = question.trim()
    if (!q || busy) return
    setQuestion("")
    setLastError("")
    const updated = [...messages, { role: "user" as const, content: q }]
    setMessages(updated)

    // Small talk se responde directo, sin RAG ni embeddings.
    const smallTalk = detectSmallTalk(q)
    if (smallTalk) {
      setMessages([...updated, { role: "assistant", content: smallTalk }])
      return
    }

    const currentDocs = docs
    if (currentDocs.length === 0) {
      setMessages([...updated, { role: "assistant", content: "La base local está vacía. Subí un archivo (md, txt, pdf, docx, xlsx, csv) o importá la base del server para que pueda responder." }])
      return
    }

    setBusy("chat")
    try {
      const { vectors } = await embedTexts([q], apiKeys, activeProvider)
      const qVec = vectors[0]
      const hits = searchLocal(qVec, currentDocs, 4, 0.2)
      const passed = hits.filter((h) => h.passedThreshold)

      let answer: string
      if (passed.length === 0) {
        answer =
          `No encontré información relacionada en tus documentos (umbral de similitud 0.20). ` +
          `Probá reformular la pregunta con otros términos.`
      } else {
        const context = passed.map((h) => `[fuente: ${h.id}]\n${currentDocs.find((d) => d.id === h.id)?.text ?? ""}`).join("\n\n---\n\n")
        const ragMessages = [
          {
            role: "system" as const,
            content:
              "Respondé SOLO con base en el contexto dado, en español. " +
              "Mencioná la fuente citando [fuente: ...]. " +
              "Si el contexto no responde la pregunta, decí 'No encontré suficiente información para responder con seguridad.' " +
              "No inventes datos.",
          },
          { role: "user" as const, content: `Contexto:\n${context}\n\nPregunta: ${q}` },
        ]
        try {
          answer = await chatCompletion(apiKeys, activeProvider, ragMessages)
        } catch (err) {
          const msg = (err as Error).message
          setLastError(msg)
          sileo.warning({ title: "Modelo de IA no disponible", description: msg.slice(0, 160) })
          const excerpts = passed.map((h) => `[fuente: ${h.id}]\n${(currentDocs.find((d) => d.id === h.id)?.text ?? "").slice(0, 300)}`).join("\n\n---\n\n")
          answer =
            `[Modo local] El modelo de IA no está disponible (${msg}). ` +
            `Estos son los documentos recuperados que responden tu consulta:\n\n${excerpts}\n\n` +
            `Configurá una API key válida para obtener respuestas generadas por el modelo.`
        }
      }
      setMessages([...updated, { role: "assistant", content: answer }])
    } catch (err) {
      const msg = (err as Error).message
      setLastError(msg)
      sileo.error({ title: "Error en la consulta", description: msg.slice(0, 75) })
      setMessages([...updated, { role: "assistant", content: `Error al procesar la consulta: ${msg}` }])
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/80 shadow-sm">
      <CardHeader className="px-6 pb-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl font-medium">Chatbot Local</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs font-medium">
              docs: <NumberPopIn value={docs.length} /> chunks
            </Badge>
            {vectorDim > 0 && (
              <Badge variant="outline" className="font-mono text-xs font-medium">
                {vectorDim} dims
              </Badge>
            )}
            <Badge
              variant={mode === "provider" ? "default" : "secondary"}
              className="font-mono text-xs font-normal"
            >
              {mode === "provider" ? "embeddings API" : "embeddings locales"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 px-6 sm:px-8">
        {/* Proveedor y Gestor de API Keys (.env local) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground ml-0.5">Proveedor:</span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full shadow-xs">
              {(["openrouter", "openai", "gemini", "groq"] as Provider[]).map((p) => {
                const hasKey = Boolean(apiKeys[p]?.trim())
                const isSelected = activeProvider === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveProvider(p)}
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

        <p className="text-[11px] text-muted-foreground">
          Modelos — chat: <span className="font-mono text-foreground/80">{getChatModel(activeProvider)}</span> · embeddings:{" "}
          <span className="font-mono text-foreground/80">{getEmbeddingModel(activeProvider)}</span>
        </p>
      </div>

        {/* Documentos en localStorage */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Indexar documentos (localStorage)</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleImportServer} disabled={busy !== null}>
                {busy === "import" ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiDatabase2Line className="size-3.5" />}
                Importar del server
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} disabled={docs.length === 0 || busy !== null}>
                <RiDeleteBinLine className="size-3.5" />
                Vaciar
              </Button>
            </div>
          </div>

          {/* Zona de drag & drop (estilo Playground) */}
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
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              dragging
                ? "border-ring bg-ring/10 scale-[1.01]"
                : "border-input bg-input/20 hover:border-ring/60 hover:bg-input/40"
            )}
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
            <RiUploadCloud2Line className={cn("h-8 w-8", dragging ? "text-ring" : "text-muted-foreground")} />
            <p className="text-xs font-medium">
              {dragging ? "Soltá los archivos acá" : "Arrastrá archivos PDF, DOCX, XLSX, CSV, MD, TXT acá"}
            </p>
            <p className="text-[11px] text-muted-foreground">o hacé clic para elegir · se guardan en tu navegador (localStorage)</p>
          </div>

          {uploads.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {uploads.map((u) => (
                <li key={u.file.name + u.file.size} className="flex items-center gap-2 rounded-xl border border-input bg-input/30 px-3 py-2">
                  <RiFileLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs" title={u.file.name}>
                        {u.file.name}
                      </p>
                      <p className="shrink-0 text-[11px] text-muted-foreground">{formatSize(u.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.state === "processing" && u.phase !== "embed" && (
                        <>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-1/2 animate-pulse rounded-full bg-ring" />
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">Extrayendo texto…</span>
                        </>
                      )}
                      {u.state === "processing" && u.phase === "embed" && (
                        <>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-ring transition-[width] duration-300"
                              style={{
                                width:
                                  u.progress && u.progress.total > 0
                                    ? `${Math.round((u.progress.done / u.progress.total) * 100)}%`
                                    : "0%",
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {u.progress?.done ?? 0}/{u.progress?.total ?? "…"}
                            {u.progress && u.progress.total > 0
                              ? ` · ${Math.round((u.progress.done / u.progress.total) * 100)}%`
                              : ""}
                          </span>
                        </>
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
                  {u.state === "processing" && <RiLoader4Line className="h-4 w-4 shrink-0 animate-spin text-ring" />}
                  {u.state === "done" && <RiCheckLine className="h-4 w-4 shrink-0 text-emerald-500" />}
                  {u.state === "error" && <RiCloseLine className="h-4 w-4 shrink-0 text-destructive" />}
                  {u.state !== "processing" && (
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

          {docs.length > 0 && (
            <details className="group rounded-xl border border-input bg-input/20 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground select-none hover:text-foreground">
                Ver chunks indexados ({docs.length})
              </summary>
              <ul className="mt-2 flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-1">
                {docs.slice(0, 60).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] hover:bg-muted/60">
                    <span className="min-w-0 truncate font-mono">{d.id}</span>
                    <span className="shrink-0 text-muted-foreground">{d.text.length} chars</span>
                  </li>
                ))}
                {docs.length > 60 && <li className="px-2 py-1 text-[11px] text-muted-foreground">… y {docs.length - 60} chunks más</li>}
              </ul>
            </details>
          )}
        </div>

        <Separator className="my-2" />

        {/* Chat */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Chat</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="text-muted-foreground hover:text-destructive"
            >
              <RiDeleteBinLine className="size-3.5" />
              Borrar historial
            </Button>
          </div>

          <div className="flex min-h-[320px] flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <RiRobot2Line className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Preguntame sobre tus documentos. Ej: "¿qué dice sobre embeddings?"
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "order-last bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {m.role === "user" ? <RiUserLine className="h-4 w-4" /> : <RiRobot2Line className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy === "chat" && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <RiRobot2Line className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                  Buscando y respondiendo…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {lastError && (
            <AIErrorCard error={lastError} onOpenKeysModal={openApiKeysModal} />
          )}

          <div className="flex items-center gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={docs.length === 0 ? "Subí o importá documentos primero…" : "Escribí tu pregunta…"}
              disabled={busy !== null}
              className="flex-1"
            />
            <Button className="rounded-full" size="icon" onClick={send} disabled={busy !== null || !question.trim()} aria-label="Enviar">
              {busy === "chat" ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSendPlaneLine className="size-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ChatbotPage