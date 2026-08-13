import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RiDeleteBinLine, RiPlayLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SlidingTabs } from "@/components/SlidingTabs"
import { Textarea } from "@/components/ui/textarea"

type Provider = "openai" | "gemini" | "groq" | "openrouter"
type Tab = "create" | "saved"

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
    label: "Crear",
    description:
      "Definí rol, objetivo, contexto y restricciones. El agente se guarda en el navegador y podés probarlo en el Playground.",
  },
  saved: {
    label: "Guardados",
    description: "Tus agentes personalizados. Enviá uno al Playground para probarlo o eliminalo de la lista.",
  },
}

const TAB_KEYS: Tab[] = ["create", "saved"]

const EMPTY_FORM = {
  name: "",
  role: "",
  objective: "",
  context: "",
  restrictions: "",
  data: "",
  outputFormat: "",
  examples: "",
  model: "gpt-4o",
  provider: "openai" as Provider,
}

export function agentToInstructions(agent: Pick<Agent, "name" | "role" | "objective" | "context" | "restrictions" | "data" | "outputFormat" | "examples">): string {
  const parts = [
    agent.name && `Nombre: ${agent.name}`,
    agent.role && `Rol: ${agent.role}`,
    agent.objective && `Objetivo: ${agent.objective}`,
    agent.context && `Contexto: ${agent.context}`,
    agent.restrictions && `Restricciones: ${agent.restrictions}`,
    agent.data && `Datos: ${agent.data}`,
    agent.outputFormat && `Formato de salida: ${agent.outputFormat}`,
    agent.examples && `Ejemplos:\n${agent.examples}`,
  ].filter(Boolean)
  return parts.join("\n\n")
}

export function AgentCreator() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("create")
  const [agents, setAgents] = useState<Agent[]>([])
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("my-agents") || "[]") as Agent[]
    const normalized = raw.map((agent) => ({
      ...agent,
      instructions: agent.instructions ?? agentToInstructions(agent),
    }))
    setAgents(normalized)
  }, [])

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => setForm(EMPTY_FORM)

  const saveAgent = () => {
    if (!form.name.trim()) return
    const instructions = agentToInstructions(form)
    const newAgent: Agent = {
      id: Date.now().toString(),
      ...form,
      instructions,
    }
    const updatedAgents = [...agents, newAgent]
    setAgents(updatedAgents)
    localStorage.setItem("my-agents", JSON.stringify(updatedAgents))
    resetForm()
    setTab("saved")
  }

  const deleteAgent = (id: string) => {
    const updatedAgents = agents.filter((a) => a.id !== id)
    setAgents(updatedAgents)
    localStorage.setItem("my-agents", JSON.stringify(updatedAgents))
  }

  const tryAgent = (agent: Agent) => {
    localStorage.setItem("active-agent", JSON.stringify(agent))
    localStorage.setItem("active-provider", agent.provider)
    navigate("/")
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="px-8">
        <CardTitle>Mis agentes</CardTitle>
        <CardDescription>Armá prompts de sistema y probalos en el Playground.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-8">
        <div className="flex flex-col gap-4">
          <SlidingTabs
            fill
            tabs={TAB_KEYS.map((key) => ({ key, label: TABS[key].label }))}
            active={TAB_KEYS.indexOf(tab)}
            onChange={(i) => setTab(TAB_KEYS[i])}
          />
          <div className="anim-tab">
            <p className="text-sm text-muted-foreground">{TABS[tab].description}</p>
          </div>
        </div>

        {tab === "create" && (
          <>
            <Input
              placeholder="Nombre del agente"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />

            <div className="flex flex-col gap-3">
              <h3 className="text-sm">Identidad</h3>
              <Input placeholder="Rol" value={form.role} onChange={(e) => updateForm("role", e.target.value)} />
              <Input
                placeholder="Objetivo"
                value={form.objective}
                onChange={(e) => updateForm("objective", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm">Contexto y límites</h3>
              <Textarea
                placeholder="Contexto"
                value={form.context}
                onChange={(e) => updateForm("context", e.target.value)}
                rows={2}
              />
              <Textarea
                placeholder="Restricciones"
                value={form.restrictions}
                onChange={(e) => updateForm("restrictions", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm">Salida</h3>
              <Textarea
                placeholder="Datos disponibles"
                value={form.data}
                onChange={(e) => updateForm("data", e.target.value)}
                rows={2}
              />
              <Input
                placeholder="Formato de salida"
                value={form.outputFormat}
                onChange={(e) => updateForm("outputFormat", e.target.value)}
              />
              <Textarea
                placeholder="Ejemplos"
                value={form.examples}
                onChange={(e) => updateForm("examples", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Select value={form.provider} onValueChange={(v) => updateForm("provider", v as Provider)}>
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
                placeholder="Modelo"
                value={form.model}
                onChange={(e) => updateForm("model", e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveAgent} disabled={!form.name.trim()}>
                Guardar agente
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Limpiar
              </Button>
            </div>
          </>
        )}

        {tab === "saved" && (
          <>
            {agents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-input bg-input/30 px-4 py-8 text-center text-sm text-muted-foreground">
                Todavía no tenés agentes guardados. Creá uno en la pestaña anterior.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {agents.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center gap-2 rounded-xl border border-input bg-input/30 px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium" title={agent.name}>
                          {agent.name}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {agent.provider}
                        </Badge>
                        {agent.model && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {agent.model}
                          </Badge>
                        )}
                      </div>
                      {agent.role && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.role}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="secondary" size="sm" onClick={() => tryAgent(agent)}>
                        <RiPlayLine className="size-3.5" />
                        Probar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar ${agent.name}`}
                        onClick={() => deleteAgent(agent.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <RiDeleteBinLine className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {agents.length > 0 && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  {agents.length} agente{agents.length === 1 ? "" : "s"} guardado{agents.length === 1 ? "" : "s"} en
                  localStorage
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
