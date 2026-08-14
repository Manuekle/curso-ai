import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFlashlightLine,
  RiKey2Line,
  RiPlayLine,
  RiRobot2Line,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberPopIn } from "@/components/NumberPopIn"
import { SlidingTabs } from "@/components/SlidingTabs"
import { Textarea } from "@/components/ui/textarea"
import { CodeBlock } from "@/components/CodeBlock"
import { Accordion } from "@/components/Accordion"
import { CopyButton } from "@/components/CopyButton"
import { useApiKeys, openApiKeysModal, type Provider } from "@/hooks/useApiKeys"
import { cn } from "@/lib/utils"
type Tab = "create" | "templates" | "saved"

export type Agent = {
  id: string
  name: string
  role: string
  objective: string
  context: string
  restrictions: string
  data: string
  outputFormat: string
  examples: string
  model: string
  provider: Provider
  instructions: string
}

const TABS: Record<Tab, { label: string; description: string }> = {
  create: {
    label: "Crear Agente",
    description:
      "Definí identidad, objetivo, restricciones de seguridad y formato. Se compila en un system prompt listo para el Playground.",
  },
  templates: {
    label: "Plantillas",
    description: "Plantillas recomendadas basadas en los patrones del manual de arquitectura empresarial.",
  },
  saved: {
    label: "Mis Agentes",
    description: "Agentes guardados en el navegador. Probalos en tiempo real en el Playground interactivo.",
  },
}

const TAB_KEYS: Tab[] = ["create", "templates", "saved"]

const EMPTY_FORM = {
  name: "",
  role: "",
  objective: "",
  context: "",
  restrictions: "",
  data: "",
  outputFormat: "",
  examples: "",
  model: "google/gemini-2.5-flash",
  provider: "openrouter" as Provider,
}

const TEMPLATES: Array<Omit<Agent, "id" | "instructions">> = [
  {
    name: "Asistente de Inventario ERP",
    role: "Asistente de consulta y gestión de stock ERP",
    objective: "Gestionar consultas de disponibilidad, registrar pedidos y validar umbrales mínimos.",
    context: "Operás en el sistema centralizado de ERP. Sólo tenés permisos de lectura y pedido con validación.",
    restrictions:
      "Máximo 4 iteraciones. No inventar datos. Si no hay evidencia suficiente, responder: 'No encontré suficiente información para responder con seguridad.'",
    data: "Disponibles mediante tools: consultarInventario(productId) y registrarPedido(productId, qty).",
    outputFormat: "JSON estructurado para tool calls o texto directo citando identificadores de producto.",
    examples:
      'Usuario: "¿Stock del producto LAP-001?"\nAgente: Tool call → consultarInventario({ productId: "LAP-001" })',
    model: "google/gemini-2.5-flash",
    provider: "openrouter",
  },
  {
    name: "Analista Financiero RAG",
    role: "Auditor y analista de extractos contables",
    objective: "Analizar balances, extraer métricas clave y detectar anomalías en reportes.",
    context: "Recibís documentos confidenciales procesados por el pipeline RAG.",
    restrictions:
      "Temperature 0. No asumir cifras que no figuren en las fuentes. Citar siempre la fuente [fuente: ...].",
    data: "Documentos recuperados mediante vector-db indexado con embeddings.",
    outputFormat:
      'JSON con formato: { "ingresos": number, "costos": number, "riesgos": string[], "resumen": string }',
    examples:
      'Usuario: "Analizá el balance Q3"\nAgente: {"ingresos": 1500000, "costos": 920000, "riesgos": ["Aumento en fletes"], "resumen": "Margen operativo favorable."}',
    model: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
  },
  {
    name: "Triage & Seguridad RBAC",
    role: "Clasificador de incidentes y filtro de acceso",
    objective: "Clasificar criticidad de tickets, verificar nivel de autorización y derivar al equipo correcto.",
    context: "Primer punto de contacto de seguridad interna.",
    restrictions:
      "No ejecutar acciones destructivas directamente. Solicitar siempre confirmación humana (HITL) para transferencias o borrado.",
    data: "Políticas de seguridad corporativa y roles de usuarios.",
    outputFormat: 'JSON con { "severidad": "baja"|"media"|"alta", "requiereHITL": boolean, "motivo": string }',
    examples:
      'Usuario: "Pedir reseteo de firewall para IP desconocida"\nAgente: {"severidad": "alta", "requiereHITL": true, "motivo": "IP fuera de whitelist"}',
    model: "openai/gpt-4o-mini",
    provider: "openrouter",
  },
]

export function agentToInstructions(
  agent: Pick<
    Agent,
    "name" | "role" | "objective" | "context" | "restrictions" | "data" | "outputFormat" | "examples"
  >
): string {
  const parts = [
    agent.name && `Nombre: ${agent.name}`,
    agent.role && `Rol: ${agent.role}`,
    agent.objective && `Objetivo: ${agent.objective}`,
    agent.context && `Contexto: ${agent.context}`,
    agent.restrictions && `Restricciones & Guardrails:\n${agent.restrictions}`,
    agent.data && `Datos y Herramientas:\n${agent.data}`,
    agent.outputFormat && `Formato de salida:\n${agent.outputFormat}`,
    agent.examples && `Ejemplos:\n${agent.examples}`,
  ].filter(Boolean)
  return parts.join("\n\n")
}

export function AgentCreator() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("create")
  const [agents, setAgents] = useState<Agent[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { apiKeys, configuredCount } = useApiKeys()

  useEffect(() => {
    const rawAgents = JSON.parse(localStorage.getItem("my-agents") || "[]") as Agent[]
    const normalized = rawAgents.map((agent) => ({
      ...agent,
      instructions: agent.instructions ?? agentToInstructions(agent),
    }))
    setAgents(normalized)
  }, [])

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const saveAgent = () => {
    if (!form.name.trim()) return
    const instructions = agentToInstructions(form)

    if (editingId) {
      const updated = agents.map((a) =>
        a.id === editingId ? { ...form, id: editingId, instructions } : a
      )
      setAgents(updated)
      localStorage.setItem("my-agents", JSON.stringify(updated))
      setEditingId(null)
    } else {
      const newAgent: Agent = {
        id: Date.now().toString(),
        ...form,
        instructions,
      }
      const updated = [...agents, newAgent]
      setAgents(updated)
      localStorage.setItem("my-agents", JSON.stringify(updated))
    }

    resetForm()
    setTab("saved")
  }

  const editAgent = (agent: Agent) => {
    setForm({
      name: agent.name,
      role: agent.role,
      objective: agent.objective,
      context: agent.context,
      restrictions: agent.restrictions,
      data: agent.data,
      outputFormat: agent.outputFormat,
      examples: agent.examples,
      model: agent.model,
      provider: agent.provider,
    })
    setEditingId(agent.id)
    setTab("create")
  }

  const deleteAgent = (id: string) => {
    const updated = agents.filter((a) => a.id !== id)
    setAgents(updated)
    localStorage.setItem("my-agents", JSON.stringify(updated))
  }

  const tryAgent = (agent: Agent) => {
    localStorage.setItem("active-agent", JSON.stringify(agent))
    localStorage.setItem("active-provider", agent.provider)
    if (agent.model) {
      localStorage.setItem("active-model", agent.model)
    }
    navigate("/")
  }

  const loadTemplate = (tmpl: Omit<Agent, "id" | "instructions">) => {
    setForm({ ...tmpl })
    setEditingId(null)
    setTab("create")
  }

  const compiledPrompt = useMemo(() => {
    return agentToInstructions(form) || "// Completá los campos para generar el System Prompt"
  }, [form])

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/80 shadow-sm rounded-[22px]">
      <CardHeader className="px-6 pb-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <div>
              <CardTitle className="text-xl font-medium">Mis Agentes & Prompts</CardTitle>
              <CardDescription className="text-xs">
                Definí identidades, restricciones y tools de agente para probar en el Playground.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              agentes: <NumberPopIn value={agents.length} />
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs text-muted-foreground">
              v1.0 · RAG & Tools
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 px-6 sm:px-8">
        {/* Proveedor y Gestor de API Keys (.env local) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground ml-0.5">Proveedor:</span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full shadow-xs">
              {(["openrouter", "openai", "gemini", "groq"] as Provider[]).map((p) => {
                const hasKey = Boolean(apiKeys[p]?.trim())
                const isSelected = form.provider === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      updateForm("provider", p)
                      localStorage.setItem("active-provider", p)
                    }}
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

        {/* Sliding Tabs */}
        <div className="flex flex-col gap-3">
          <SlidingTabs
            fill
            tabs={TAB_KEYS.map((key) => ({ key, label: TABS[key].label }))}
            active={TAB_KEYS.indexOf(tab)}
            onChange={(i) => setTab(TAB_KEYS[i])}
          />
          <div className="anim-tab">
            <p className="text-xs text-muted-foreground">{TABS[tab].description}</p>
          </div>
        </div>

        {/* TAB: CREAR / EDITAR */}
        {tab === "create" && (
          <div className="anim-tab flex flex-col gap-5">
            {editingId && (
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs text-primary">
                <span className="font-medium">Editando agente existente</span>
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-6 text-xs font-normal">
                  Cancelar edición
                </Button>
              </div>
            )}

            {/* SECCIÓN 1: IDENTIDAD */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>1. Identidad & Modelo</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="agent-name" className="text-xs font-normal">Nombre del agente *</Label>
                  <Input
                    id="agent-name"
                    placeholder="Ej. Asistente de Inventario ERP"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-role" className="text-xs font-normal">Rol</Label>
                  <Input
                    id="agent-role"
                    placeholder="Ej. Asistente de consultas de stock"
                    value={form.role}
                    onChange={(e) => updateForm("role", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-model" className="text-xs font-normal">Modelo sugerido</Label>
                  <Input
                    id="agent-model"
                    placeholder="Ej. google/gemini-2.5-flash"
                    value={form.model}
                    onChange={(e) => updateForm("model", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="agent-objective" className="text-xs font-normal">Objetivo principal</Label>
                  <Input
                    id="agent-objective"
                    placeholder="Ej. Gestionar consultas de stock y registrar pedidos sin inventar datos"
                    value={form.objective}
                    onChange={(e) => updateForm("objective", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CONTEXTO Y LÍMITES */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>2. Contexto & Guardrails (#13, #19, #66)</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-context" className="text-xs font-normal">Contexto operativo</Label>
                  <Textarea
                    id="agent-context"
                    placeholder="Ej. Operás en un sistema ERP centralizado con permisos de solo lectura..."
                    value={form.context}
                    onChange={(e) => updateForm("context", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-restrictions" className="text-xs font-normal">Restricciones & Fallback</Label>
                  <Textarea
                    id="agent-restrictions"
                    placeholder="Ej. Máximo 4 iteraciones. No inventar datos. Si no hay evidencia, responder: 'No encontré suficiente información.'"
                    value={form.restrictions}
                    onChange={(e) => updateForm("restrictions", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: SALIDA Y TOOLS */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">               
                <span>3. Tools, Datos & Formato (#4, #6)</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-data" className="text-xs font-normal">Tools y fuentes disponibles</Label>
                  <Textarea
                    id="agent-data"
                    placeholder="Ej. consultarInventario(productId), registrarPedido(productId, qty)"
                    value={form.data}
                    onChange={(e) => updateForm("data", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-output" className="text-xs font-normal">Formato de salida esperado</Label>
                  <Input
                    id="agent-output"
                    placeholder="Ej. JSON estructurado para tool calls o texto directo con fuentes"
                    value={form.outputFormat}
                    onChange={(e) => updateForm("outputFormat", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="agent-examples" className="text-xs font-normal">Ejemplos (Few-Shot)</Label>
                  <Textarea
                    id="agent-examples"
                    placeholder='Ej. Usuario: "¿Stock de LAP-001?" → Tool: consultarInventario({ productId: "LAP-001" })'
                    value={form.examples}
                    onChange={(e) => updateForm("examples", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Vista previa del System Prompt generado
              </span>
              <CodeBlock label="compiled-system-prompt.txt" code={compiledPrompt} />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button onClick={saveAgent} disabled={!form.name.trim()} className="gap-2 font-normal">
                <RiAddLine className="size-4" />
                {editingId ? "Actualizar Agente" : "Guardar Agente"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="font-normal">
                Limpiar formulario
              </Button>
            </div>
          </div>
        )}

        {/* TAB: PLANTILLAS */}
        {tab === "templates" && (
          <div className="anim-tab flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-1">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.name}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{tmpl.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {tmpl.provider}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {tmpl.model}
                      </Badge>
                    </div>
                    <Button size="sm" onClick={() => loadTemplate(tmpl)} className="gap-1.5 h-8 text-xs font-normal">
                      <RiFlashlightLine className="size-3.5" />
                      Usar plantilla
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{tmpl.objective}</p>
                  <Accordion title="Ver estructura y restricciones" className="mt-1">
                    <div className="space-y-2 pt-2 text-xs text-muted-foreground">
                      <p>
                        <span className="text-foreground font-medium">Rol:</span> {tmpl.role}
                      </p>
                      <p>
                        <span className="text-foreground font-medium">Contexto:</span> {tmpl.context}
                      </p>
                      <p>
                        <span className="text-foreground font-medium">Restricciones:</span> {tmpl.restrictions}
                      </p>
                      <p>
                        <span className="text-foreground font-medium">Salida:</span> {tmpl.outputFormat}
                      </p>
                    </div>
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AGENTES GUARDADOS */}
        {tab === "saved" && (
          <div className="anim-tab flex flex-col gap-4">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <RiRobot2Line className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Todavía no tenés agentes guardados</p>
                  <p className="text-xs text-muted-foreground">
                    Creá uno con tus reglas o cargá una plantilla recomendada de arquitectura.
                  </p>
                </div>
                <Button size="sm" onClick={() => setTab("templates")} className="mt-1 gap-1.5 text-xs font-normal">
                  <RiFlashlightLine className="size-3.5" />
                  Ver plantillas
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-border sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{agent.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {agent.provider}
                        </Badge>
                        {agent.model && (
                          <Badge variant="secondary" className="text-[10px]">
                            {agent.model}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => tryAgent(agent)}
                          className="gap-1.5 h-8 text-xs font-normal bg-primary text-primary-foreground"
                        >
                          <RiPlayLine className="size-3.5" />
                          Probar en Playground
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Editar agente"
                          onClick={() => editAgent(agent)}
                          className="size-8"
                        >
                          <RiEditLine className="size-3.5 text-muted-foreground" />
                        </Button>
                        <CopyButton
                          textToCopy={agent.instructions}
                          variant="outline"
                          size="icon-sm"
                          showToast
                          className="size-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Eliminar ${agent.name}`}
                          onClick={() => deleteAgent(agent.id)}
                          className="size-8 text-muted-foreground hover:text-destructive"
                        >
                          <RiDeleteBinLine className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {agent.role && <p className="text-xs text-muted-foreground">{agent.role}</p>}
                    {agent.objective && (
                      <p className="text-xs text-muted-foreground/80 line-clamp-2">
                        <span className="text-foreground font-medium">Objetivo:</span> {agent.objective}
                      </p>
                    )}

                    <Accordion title="Ver System Prompt completo" className="mt-1">
                      <div className="pt-2">
                        <CodeBlock label={`${agent.name.toLowerCase().replace(/\s+/g, "-")}.txt`} code={agent.instructions} />
                      </div>
                    </Accordion>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground text-center">
                  <NumberPopIn value={agents.length} /> agente{agents.length === 1 ? "" : "s"} guardado{agents.length === 1 ? "" : "s"} sincronizados con el Playground
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AgentCreator
