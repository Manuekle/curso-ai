import { useEffect, useMemo, useRef, useState } from "react"
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import {
  RiCloseLine,
  RiGithubFill,
  RiKey2Line,
  RiMenuLine,
  RiMoonLine,
  RiSearchLine,
  RiSunLine,
} from "@remixicon/react"
import { Toaster } from "sileo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { ApiKeysModal } from "@/components/ApiKeysModal"
import { Playground } from "@/pages/Playground"
import { DocsPage } from "@/pages/DocsPage"
import { AgentCreator } from "@/pages/AgentCreator"
import { FundamentosLesson } from "@/pages/lessons/FundamentosLesson"
import { ContextoTemperatureLesson } from "@/pages/lessons/ContextoTemperatureLesson"
import { PromptsStructuredLesson } from "@/pages/lessons/PromptsStructuredLesson"
import { WorkflowsAgentesLesson } from "@/pages/lessons/WorkflowsAgentesLesson"
import { AgentsLesson } from "@/pages/lessons/AgentsLesson"
import { MultiagentesLesson } from "@/pages/lessons/MultiagentesLesson"
import { ChunksLesson } from "@/pages/lessons/ChunksLesson"
import { EmbeddingsLesson } from "@/pages/lessons/EmbeddingsLesson"
import { RetrievalLesson } from "@/pages/lessons/RetrievalLesson"
import { RagLesson } from "@/pages/lessons/RagLesson"
import { AlucinacionesLesson } from "@/pages/lessons/AlucinacionesLesson"
import { SeguridadLesson } from "@/pages/lessons/SeguridadLesson"
import { ApisLesson } from "@/pages/lessons/ApisLesson"
import { ArquitecturaLesson } from "@/pages/lessons/ArquitecturaLesson"
import { ProduccionLesson } from "@/pages/lessons/ProduccionLesson"
import { CostosModelosLesson } from "@/pages/lessons/CostosModelosLesson"
import { EvaluacionLesson } from "@/pages/lessons/EvaluacionLesson"
import { CasosLesson } from "@/pages/lessons/CasosLesson"
import { EjerciciosLesson } from "@/pages/lessons/EjerciciosLesson"
import { TsEsencialLesson } from "@/pages/lessons/TsEsencialLesson"
import { EntrevistaLesson } from "@/pages/lessons/EntrevistaLesson"

interface NavItem {
  to: string
  label: string
  end?: boolean
  pro?: boolean
}

const GROUPS: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "Manual",
    items: [{ to: "/docs", label: "Manual de entrevista" }],
  },
  {
    group: "Práctica",
    items: [
      { to: "/", label: "Playground", end: true },
      { to: "/agents", label: "Mis Agentes" },
    ],
  },
  {
    group: "IA fundamental",
    items: [
      { to: "/aprender/fundamentos", label: "LLM y tokens" },
      { to: "/aprender/contexto-temperature", label: "Contexto y temperatura" },
      { to: "/aprender/prompts-structured", label: "Prompts y salida estructurada" },
    ],
  },
  {
    group: "RAG",
    items: [
      { to: "/aprender/chunks", label: "Chunking" },
      { to: "/aprender/embeddings", label: "Embeddings" },
      { to: "/aprender/retrieval", label: "Búsqueda vectorial" },
      { to: "/aprender/rag", label: "Pipeline RAG" },
      { to: "/aprender/alucinaciones", label: "Alucinaciones" },
    ],
  },
  {
    group: "Agentes",
    items: [
      { to: "/aprender/workflows-agentes", label: "Workflows vs agentes" },
      { to: "/aprender/agentes", label: "Agente con tools" },
      { to: "/aprender/multiagentes", label: "Multiagentes y orquestador", pro: true },
    ],
  },
  {
    group: "Seguridad e integraciones",
    items: [
      { to: "/aprender/seguridad", label: "Auth, autorización y datos" },
      { to: "/aprender/apis", label: "APIs: REST, webhooks, retry" },
      { to: "/aprender/arquitectura", label: "ERP, Workspace y MCP" },
    ],
  },
  {
    group: "Producción y costos",
    items: [
      { to: "/aprender/produccion", label: "Observabilidad y escalabilidad" },
      { to: "/aprender/costos-modelos", label: "Costos y elección de modelos" },
      { to: "/aprender/evaluacion", label: "Evaluación de agentes", pro: true },
    ],
  },
  {
    group: "Simulacro",
    items: [
      { to: "/aprender/casos", label: "Casos de arquitectura" },
      { to: "/aprender/ejercicios", label: "Ejercicios + soluciones" },
      { to: "/aprender/ts-esencial", label: "TypeScript esencial" },
      { to: "/aprender/entrevista", label: "Respuestas y 15 ideas", pro: true },
    ],
  },
]

const ALL_ITEMS = GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.group })))

function linkClass(isActive: boolean) {
  return cn(
    "flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-[13px] transition-colors duration-150",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )
}

function ProBadge() {
  return <span className="docs-pro-pill">Pro</span>
}

function NavLists() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((g) => (
        <div key={g.group} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[11px] tracking-[-0.005em] text-muted-foreground">
            {g.group}
          </p>
          {g.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => linkClass(isActive)}
            >
              <span className="truncate">{item.label}</span>
              {item.pro && <ProBadge />}
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  )
}

function Brand() {
  return (
    <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
      <img src="/logo.png" alt="Logo Curso AI" className="size-8 rounded-[10px] object-cover" />
      <span className="text-sm tracking-[-0.005em]">Curso AI</span>
      <span className="hidden text-xs text-muted-foreground lg:block">agentes + RAG</span>
    </NavLink>
  )
}

function NavPill({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <NavLink
      to={to}
      className={cn(
        "hidden rounded-full px-4 py-2 text-[13px] transition-colors duration-150 md:block",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </NavLink>
  )
}

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ITEMS
    return ALL_ITEMS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      const raf = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(raf)
    }
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const close = () => {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 350)
  }

  const go = (to: string) => {
    navigate(to)
    onClose()
  }

  if (!open) return null

  const shown = !closing

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={cn("t-modal-overlay absolute inset-0 bg-black/60", shown && "is-open", closing && "is-closing")}
        onClick={close}
      />
      <div className="absolute top-[16vh] left-1/2 w-[min(92vw,560px)] -translate-x-1/2">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
          className="t-panel-slide rounded-[22px] border border-border bg-popover p-6"
          data-open={shown && !closing}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Buscar</p>
            <kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="mt-4 flex h-10 items-center gap-2 rounded-full bg-muted px-4">
            <RiSearchLine className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setActiveIdx((i) => Math.min(i + 1, results.length - 1))
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setActiveIdx((i) => Math.max(i - 1, 0))
                } else if (e.key === "Enter" && results[activeIdx]) {
                  go(results[activeIdx].to)
                }
              }}
              placeholder="Buscar lección o sección…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="mt-4 flex max-h-[42vh] flex-col gap-0.5 overflow-y-auto">
            {results.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
            )}
            {results.map((item, i) => (
              <button
                key={`${item.group}-${item.to}`}
                type="button"
                onClick={() => go(item.to)}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[13px] transition-colors duration-150",
                  i === activeIdx
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="truncate">{item.label}</span>
                <span className="w-fit shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {item.group}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeaderProps {
  onMenu: () => void
  onSearch: () => void
}

function Header({ onMenu, onSearch }: HeaderProps) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [stars, setStars] = useState<number | null>(null)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    fetch("https://api.github.com/repos/Manuekle/curso-ai")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const isDark = theme === "dark" || (theme === "system" && systemDark)

  return (
    <header className="bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1560px] items-center gap-4 px-8 md:px-16">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground hover:text-foreground md:hidden"
          onClick={onMenu}
          aria-label="Abrir menú"
        >
          <RiMenuLine className="size-5" />
        </Button>

        <Brand />

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <NavPill
            to="/docs"
            label="Manual"
            active={location.pathname.startsWith("/docs")}
          />
          <NavPill
            to="/aprender/fundamentos"
            label="Documentación"
            active={location.pathname.startsWith("/aprender")}
          />
          <NavPill to="/" label="Playground" active={location.pathname === "/"} />
          <NavPill
            to="/agents"
            label="Mis Agentes"
            active={location.pathname === "/agents"}
          />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-9 w-48 cursor-pointer items-center gap-2 rounded-full bg-muted px-3 text-muted-foreground transition-colors duration-150 hover:bg-secondary sm:flex"
            aria-label="Buscar"
          >
            <RiSearchLine className="size-4 shrink-0" />
            <span className="flex-1 text-left text-[13px]">Buscar</span>
            <kbd className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-muted-foreground transition-colors duration-150 hover:bg-secondary/70 hover:text-foreground"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Cambiar tema"
          >
            <span
              className="t-icon-swap anim-spring"
              data-state={isDark ? "b" : "a"}
              key={isDark ? "dark" : "light"}
            >
              <span className="t-icon" data-icon="a">
                <RiMoonLine className="size-4" />
              </span>
              <span className="t-icon" data-icon="b">
                <RiSunLine className="size-4" />
              </span>
            </span>
          </Button>

          <a
            href="https://github.com/Manuekle/curso-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-muted-foreground transition-colors duration-150 hover:bg-secondary/70 hover:text-foreground"
          >
            <RiGithubFill className="size-5" />
            <span className="hidden text-[13px] font-medium lg:inline">
              {stars !== null ? stars : "Star"}
            </span>
          </a>
        </div>
      </div>
    </header>
  )
}

function AppRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="anim-slide-in">
      <Routes>
        <Route path="/" element={<Playground />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/aprender/fundamentos" element={<FundamentosLesson />} />
        <Route path="/aprender/contexto-temperature" element={<ContextoTemperatureLesson />} />
        <Route path="/aprender/prompts-structured" element={<PromptsStructuredLesson />} />
        <Route path="/aprender/workflows-agentes" element={<WorkflowsAgentesLesson />} />
        <Route path="/aprender/agentes" element={<AgentsLesson />} />
        <Route path="/aprender/multiagentes" element={<MultiagentesLesson />} />
        <Route path="/aprender/chunks" element={<ChunksLesson />} />
        <Route path="/aprender/embeddings" element={<EmbeddingsLesson />} />
        <Route path="/aprender/retrieval" element={<RetrievalLesson />} />
        <Route path="/aprender/rag" element={<RagLesson />} />
        <Route path="/aprender/alucinaciones" element={<AlucinacionesLesson />} />
        <Route path="/aprender/seguridad" element={<SeguridadLesson />} />
        <Route path="/aprender/apis" element={<ApisLesson />} />
        <Route path="/aprender/arquitectura" element={<ArquitecturaLesson />} />
        <Route path="/aprender/produccion" element={<ProduccionLesson />} />
        <Route path="/aprender/costos-modelos" element={<CostosModelosLesson />} />
        <Route path="/aprender/evaluacion" element={<EvaluacionLesson />} />
        <Route path="/aprender/casos" element={<CasosLesson />} />
        <Route path="/aprender/ejercicios" element={<EjerciciosLesson />} />
        <Route path="/aprender/ts-esencial" element={<TsEsencialLesson />} />
        <Route path="/aprender/entrevista" element={<EntrevistaLesson />} />
        <Route path="/agents" element={<AgentCreator />} />
      </Routes>
    </div>
  )
}

function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const lock = drawerOpen || searchOpen || keysOpen
    document.body.style.overflow = lock ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [drawerOpen, searchOpen, keysOpen])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === "Escape") {
        setSearchOpen(false)
        setDrawerOpen(false)
        setKeysOpen(false)
      }
    }
    const handleOpenKeys = () => setKeysOpen(true)
    window.addEventListener("open-api-keys-modal", handleOpenKeys)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("open-api-keys-modal", handleOpenKeys)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header
        onMenu={() => setDrawerOpen(true)}
        onSearch={() => setSearchOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col md:flex-row md:gap-10 md:px-16">
        <aside className="hidden shrink-0 md:block md:sticky md:top-0 md:h-svh md:w-[220px] md:self-start md:overflow-y-auto md:py-14">
          <NavLists />
        </aside>

        <main className="min-w-0 flex-1 px-8 md:px-0">
          <div
            className={cn(
              "mx-auto w-full pt-14 pb-32",
              location.pathname.startsWith("/docs") ? "max-w-[1240px]" : "max-w-[920px]"
            )}
          >
            <AppRoutes />
          </div>
        </main>
      </div>

      <footer>
        <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center justify-between gap-4 px-8 py-10 sm:flex-row md:px-16">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo Curso AI" className="size-7 rounded-[10px] object-cover" />
            <span className="text-[13px] tracking-[-0.005em]">Curso AI</span>
          </NavLink>
          <nav className="flex items-center gap-6 text-[13px]">
            <NavLink to="/docs" className="text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Manual
            </NavLink>
            <NavLink to="/" end className="text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Playground
            </NavLink>
          </nav>
          <p className="text-xs text-muted-foreground">agentes + RAG · v0.1.0</p>
        </div>
      </footer>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="animate-in fade-in absolute inset-0 bg-black/60 duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 flex w-[300px] flex-col gap-5 overflow-y-auto bg-background p-5 duration-200">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
              >
                <RiCloseLine className="size-5" />
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false)
                setSearchOpen(true)
              }}
              className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl bg-muted px-4 text-muted-foreground transition-colors duration-150 hover:bg-secondary"
            >
              <RiSearchLine className="size-5 shrink-0" />
              <span className="flex-1 text-left text-sm">Buscar lección…</span>
              <kbd className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDrawerOpen(false)
                setKeysOpen(true)
              }}
              className="flex h-12 w-full items-center justify-start gap-3 rounded-xl px-4 text-sm"
            >
              <RiKey2Line className="size-5 text-primary shrink-0" />
              <span>Configurar API Keys (.env)</span>
            </Button>
            <NavLists />
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ApiKeysModal open={keysOpen} onClose={() => setKeysOpen(false)} />
    </div>
  )
}

export function App() {
  const { theme } = useTheme()
  const [isSystemDark, setIsSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  )

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const resolvedTheme =
    theme === "system" ? (isSystemDark ? "dark" : "light") : theme

  // Sileo's theme property is inverted by design:
  // "dark" theme in Sileo = light/white background toast
  // "light" theme in Sileo = dark/black background toast
  // Light mode -> White toast ("dark" Sileo theme)
  // Dark mode -> Black toast ("light" Sileo theme)
  const sileoTheme = resolvedTheme === "dark" ? "light" : "dark"

  return (
    <BrowserRouter>
      <AppShell />
      <Toaster position="bottom-right" theme={sileoTheme} />
    </BrowserRouter>
  )
}

export default App