import { useEffect, useRef, useState } from "react"
import {
  RiDeleteBinLine,
  RiDatabase2Line,
  RiFileTextLine,
  RiLoader4Line,
  RiRobot2Line,
  RiSendPlaneLine,
  RiUploadCloud2Line,
  RiUserLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AIErrorCard } from "@/components/AIErrorCard"
import { openApiKeysModal, useApiKeys } from "@/hooks/useApiKeys"
import {
  chatCompletion,
  clearStore,
  embedTexts,
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

const HISTORY_KEY = "chatbot-history"
const MAX_CHUNKS = 400

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

export function ChatbotPage() {
  const { apiKeys, activeProvider, hasActiveKey } = useApiKeys()
  const [docs, setDocs] = useState<LocalDoc[]>(() => loadStore())
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory())
  const [question, setQuestion] = useState("")
  const [busy, setBusy] = useState<"embed" | "chat" | "import" | null>(null)
  const [mode, setMode] = useState<"provider" | "local">("local")
  const [lastError, setLastError] = useState("")
  const [status, setStatus] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, busy])

  const vectorDim = docs[0]?.vector.length ?? 0

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy("embed")
    setLastError("")
    setStatus("")
    let added = 0
    let lastMode: "provider" | "local" = "local"
    for (const file of Array.from(files)) {
      if (!/\.(md|txt)$/i.test(file.name)) {
        setStatus(`Saltado (no md/txt): ${file.name}`)
        continue
      }
      const text = await file.text()
      if (!text.trim()) continue
      const name = file.name.replace(/\.[^.]+$/, "")
      const res = await indexText(name, text, apiKeys, activeProvider)
      added += res.chunks
      lastMode = res.mode
      if (docs.length + added > MAX_CHUNKS) {
        setStatus(`Límite de ${MAX_CHUNKS} chunks alcanzado. Borrá docs o importá menos.`)
        break
      }
    }
    setDocs(loadStore())
    setMode(lastMode)
    setStatus(added > 0 ? `${added} chunks indexados` : status || "")
    setBusy(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleImportServer() {
    setBusy("import")
    setLastError("")
    setStatus("")
    try {
      const res = await importFromServer(apiKeys, activeProvider)
      setDocs(loadStore())
      setMode(res.mode)
      setStatus(res.imported > 0 ? `${res.imported} chunks importados de la base del server` : "El server no tiene docs indexados")
    } catch (err: any) {
      setLastError(err?.message ?? String(err))
    } finally {
      setBusy(null)
    }
  }

  function handleClear() {
    clearStore()
    setDocs([])
    setStatus("Store local vaciado")
  }

  function handleClearChat() {
    setMessages([])
    setStatus("Historial de chat borrado")
  }

  async function send() {
    const q = question.trim()
    if (!q || busy) return
    setQuestion("")
    setLastError("")
    setStatus("")
    const updated = [...messages, { role: "user" as const, content: q }]
    setMessages(updated)

    const currentDocs = docs
    if (currentDocs.length === 0) {
      setMessages([...updated, { role: "assistant", content: "La base local está vacía. Subí un archivo md/txt o importá la base del server para que pueda responder." }])
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
        const top = hits.slice(0, 3).map((h) => `${h.id} (similitud ${h.score})`).join(", ")
        answer =
          `Ningún documento alcanzó el umbral de similitud (0.20). ` +
          `Los más cercanos fueron: ${top}. Probá bajar el umbral o reformular la pregunta.`
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
        } catch (err: any) {
          setLastError(err?.message ?? String(err))
          const excerpts = passed.map((h) => `[fuente: ${h.id}]\n${(currentDocs.find((d) => d.id === h.id)?.text ?? "").slice(0, 300)}`).join("\n\n---\n\n")
          answer =
            `[Modo local] El modelo de IA no está disponible (${err?.message ?? "LLM_ERROR"}). ` +
            `Estos son los documentos recuperados que responden tu consulta:\n\n${excerpts}\n\n` +
            `Configurá una API key válida para obtener respuestas generadas por el modelo.`
        }
      }
      setMessages([...updated, { role: "assistant", content: answer }])
    } catch (err: any) {
      setLastError(err?.message ?? String(err))
      setMessages([...updated, { role: "assistant", content: `Error al procesar la consulta: ${err?.message ?? err}` }])
    } finally {
      setBusy(null)
    }
  }

  const canChat = docs.length > 0 && !busy
  const providerLabel = activeProvider.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">Chatbot Local</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            RAG 100% en el navegador: vectores y chat en localStorage. Sin servidor para el pipeline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{docs.length} chunks</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{vectorDim ? `${vectorDim} dims` : "sin vectores"}</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1",
              mode === "provider" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            )}
          >
            {mode === "provider" ? "embeddings proveedor" : "embeddings locales"}
          </span>
          <span className={cn("rounded-full px-2.5 py-1", hasActiveKey ? "bg-muted" : "bg-red-500/10 text-red-600")}>
            {providerLabel} {hasActiveKey ? "key ok" : "sin key"}
          </span>
        </div>
      </div>

      {!hasActiveKey && (
        <Button variant="outline" size="sm" className="w-fit rounded-full" onClick={openApiKeysModal}>
          Configurar API Keys para embeddings y respuestas reales
        </Button>
      )}

      {/* ── Datos ── */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Documentos (localStorage)</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleImportServer} disabled={busy !== null}>
              {busy === "import" ? <RiLoader4Line className="size-4 animate-spin" /> : <RiDatabase2Line className="size-4" />}
              Importar del server
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleClear} disabled={docs.length === 0 || busy !== null}>
              <RiDeleteBinLine className="size-4" />
              Vaciar
            </Button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted/70"
        >
          <RiUploadCloud2Line className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arrastrá o tocá para subir archivos <span className="font-medium text-foreground">.md / .txt</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {docs.length > 0 && (
          <ul className="mt-4 flex max-h-48 flex-col gap-1 overflow-y-auto pr-1">
            {docs.slice(0, 50).map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <RiFileTextLine className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono">{d.id}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{d.text.length} chars</span>
              </li>
            ))}
            {docs.length > 50 && (
              <li className="px-3 py-1 text-xs text-muted-foreground">… y {docs.length - 50} chunks más</li>
            )}
          </ul>
        )}

        {status && <p className="mt-3 text-xs text-muted-foreground">{status}</p>}
      </section>

      {/* ── Chat ── */}
      <section className="flex min-h-[420px] flex-col rounded-2xl border border-border bg-card">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <RiRobot2Line className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                Preguntame sobre tus documentos. Ej: "¿qué dice sobre embeddings?"
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user" ? "order-last bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {m.role === "user" ? <RiUserLine className="size-4" /> : <RiRobot2Line className="size-4" />}
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
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <RiRobot2Line className="size-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <RiLoader4Line className="size-4 animate-spin" />
                Buscando y respondiendo…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {lastError && (
          <div className="px-5 pb-3">
            <AIErrorCard error={lastError} onOpenKeysModal={openApiKeysModal} />
          </div>
        )}

        <div className="flex items-end gap-2 border-t border-border p-4">
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={docs.length === 0 ? "Subí o importá documentos primero…" : "Escribí tu pregunta…"}
            disabled={busy !== null}
            className="min-w-0 flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:bg-background disabled:opacity-50"
          />
          <Button className="rounded-full" size="icon-sm" onClick={send} disabled={!canChat} aria-label="Enviar">
            {busy === "chat" ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSendPlaneLine className="size-4" />}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={handleClearChat} disabled={messages.length === 0} title="Borrar historial">
            <RiDeleteBinLine className="size-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}

export default ChatbotPage