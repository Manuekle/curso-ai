import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiCloseLine,
  RiListUnordered,
  RiSearchLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import { CodeBlock } from "@/components/CodeBlock"
import docSource from "../content/doc.md?raw"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

function computeHeadingIds(source: string): string[] {
  const lines = source.split("\n")
  const counts = new Map<string, number>()
  return lines.map((line) => {
    const m = line.match(/^#{1,6} (.+)$/)
    if (!m) return ""
    const base = slugify(m[1].replace(/\*\*/g, "").trim())
    const n = counts.get(base) ?? 0
    counts.set(base, n + 1)
    return n === 0 ? base : `${base}-${n + 1}`
  })
}

const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"

function resolveColorVar(name: string): string {
  const probe = document.createElement("span")
  probe.style.color = `var(${name})`
  document.body.appendChild(probe)
  const raw = getComputedStyle(probe).color
  document.body.removeChild(probe)
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return raw
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const isDark = useIsDark()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const mod = await import(/* @vite-ignore */ MERMAID_URL)
        const mermaid = mod.default
        const colors = {
          card: resolveColorVar("--card"),
          foreground: resolveColorVar("--foreground"),
          border: resolveColorVar("--border"),
          muted: resolveColorVar("--muted"),
          mutedForeground: resolveColorVar("--muted-foreground"),
        }
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "strict",
          fontFamily: "'Inter Variable', 'Inter', sans-serif",
          themeVariables: {
            fontFamily: "'Inter Variable', 'Inter', sans-serif",
            fontSize: "14px",
            background: colors.card,
            mainBkg: colors.card,
            primaryColor: colors.card,
            primaryTextColor: colors.foreground,
            primaryBorderColor: colors.border,
            secondaryColor: colors.muted,
            secondaryTextColor: colors.foreground,
            secondaryBorderColor: colors.border,
            tertiaryColor: colors.muted,
            tertiaryTextColor: colors.foreground,
            tertiaryBorderColor: colors.border,
            lineColor: colors.mutedForeground,
            textColor: colors.foreground,
            nodeTextColor: colors.foreground,
            nodeBorder: colors.border,
            clusterBkg: colors.muted,
            clusterBorder: colors.border,
            titleColor: colors.foreground,
            edgeLabelBackground: colors.card,
            labelBackground: colors.card,
          },
          themeCSS: `
            .node rect, .node polygon, .node circle { rx: 10px; ry: 10px; stroke-width: 1px; }
            .edgePath .path { stroke-width: 1.5px; }
            .cluster rect { rx: 10px; ry: 10px; }
          `,
        })
        const id = `mmd-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, code)
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, isDark])

  if (error) {
    return (
      <div className="my-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
        {error}
      </div>
    )
  }
  return <div ref={ref} className="my-6 overflow-x-auto rounded-xl border border-border bg-card p-4 [&_svg]:mx-auto" />
}

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    let tick = false

    function update() {
      const scrollY = window.scrollY
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight
      if (totalScrollable > 0) {
        const pct = Math.min(100, Math.max(0, (scrollY / totalScrollable) * 100))
        setProgress(Math.round(pct))
      } else {
        setProgress(0)
      }

      const targetY = scrollY + 120
      let currentActive: string | null = null

      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && el.offsetTop <= targetY) {
          currentActive = ids[i]
          break
        }
      }

      if (!currentActive && ids.length > 0) {
        currentActive = ids[0]
      }

      setActiveId(currentActive)
      tick = false
    }

    function handleScroll() {
      if (!tick) {
        window.requestAnimationFrame(update)
        tick = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    const timer = setTimeout(update, 100)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(timer)
    }
  }, [ids])

  return { activeId, progress }
}

function inline(text: string, keyBase: number): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={`${keyBase}-${i}`} className="font-normal text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={`${keyBase}-${i}`} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
              {part.slice(1, -1)}
            </code>
          )
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (link) {
          return (
            <a
              key={`${keyBase}-${i}`}
              href={link[2]}
              className="text-foreground underline decoration-border underline-offset-3 transition-colors duration-150 hover:text-primary"
            >
              {link[1]}
            </a>
          )
        }
        return <span key={`${keyBase}-${i}`}>{part}</span>
      })}
    </>
  )
}

function parseDoc(source: string, headingIds: string[]): ReactNode[] {
  const lines = source.split("\n")
  const nodes: ReactNode[] = []
  let key = 0
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i])
        i++
      }
      i++
      if (lang === "mermaid") {
        nodes.push(<MermaidBlock key={key++} code={buf.join("\n")} />)
      } else {
        nodes.push(
          <div key={key++} className="my-6">
            <CodeBlock label={lang || "text"} code={buf.join("\n")} />
          </div>
        )
      }
      continue
    }

    if (line.trim().startsWith("|")) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim())
        if (!cells.every((c) => /^[-:\s]+$/.test(c))) {
          rows.push(cells)
        }
        i++
      }
      if (rows.length > 0) {
        nodes.push(
          <div key={key++} className="my-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  {rows[0].map((c, j) => (
                    <th key={j} className="border-b border-border pb-2 pr-4 font-normal text-muted-foreground">
                      {inline(c, j)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k} className="border-b border-border/60 py-2 pr-4 text-foreground/80">
                        {inline(c, k)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    if (line.startsWith(">")) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      nodes.push(
        <blockquote
          key={key++}
          className="my-6 border-l-2 border-border pl-4 text-[15px] leading-relaxed text-muted-foreground"
        >
          {buf.map((l, j) => (
            <p key={j} className="py-0.5">
              {inline(l, j)}
            </p>
          ))}
        </blockquote>
      )
      continue
    }

    if (/^#{1,6} /.test(line)) {
      const level = line.match(/^#+/)![0].length
      const text = line.replace(/^#+\s*/, "")
      const id = headingIds[i]
      if (level === 1 && nodes.length === 0) {
        nodes.push(
          <h1 key={key++} className="detail-title scroll-mt-24" id={id}>
            {inline(text, key)}
          </h1>
        )
      } else if (level === 1 || level === 2) {
        nodes.push(
          <h2 key={key++} className="mt-12 mb-4 scroll-mt-24 font-heading text-[24px] font-normal tracking-[-0.005em]" id={id}>
            {inline(text, key)}
          </h2>
        )
      } else if (level === 3) {
        nodes.push(
          <h3 key={key++} className="mt-8 mb-3 scroll-mt-24 font-heading text-[19px] font-normal tracking-[-0.005em]" id={id}>
            {inline(text, key)}
          </h3>
        )
      } else {
        nodes.push(
          <h4 key={key++} className="mt-6 mb-2 scroll-mt-24 text-[15px] font-normal tracking-[-0.005em] text-foreground" id={id}>
            {inline(text, key)}
          </h4>
        )
      }
      i++
      continue
    }

    if (/^-{3,}\s*$/.test(line.trim())) {
      nodes.push(<hr key={key++} className="my-10 border-border" />)
      i++
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      nodes.push(
        <ul key={key++} className="my-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          {buf.map((l, j) => (
            <li key={j}>{inline(l, j)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*\d+\.\s+/, ""))
        i++
      }
      nodes.push(
        <ol key={key++} className="my-2 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          {buf.map((l, j) => (
            <li key={j}>{inline(l, j)}</li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === "") {
      i++
      continue
    }

    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6} |```|>|\||-{3,}\s*$|[-*]\s+|\d+\.\s+)/.test(lines[i])
    ) {
      buf.push(lines[i].trim())
      i++
    }
    nodes.push(
      <p key={key++} className="my-4 text-[15px] leading-relaxed text-muted-foreground">
        {buf.map((l, j) => (
          <span key={j} className="block">
            {inline(l, j)}
          </span>
        ))}
      </p>
    )
  }

  return nodes
}

interface TocItem {
  id: string
  text: string
  level: number
  isPart: boolean
}

export function DocsPage() {
  const headingIds = useMemo(() => computeHeadingIds(docSource), [])
  const content = useMemo(() => parseDoc(docSource, headingIds), [headingIds])

  const toc = useMemo(() => {
    const items: TocItem[] = []
    const lines = docSource.split("\n")
    lines.forEach((line, i) => {
      const m = line.match(/^(#{1,3}) (.+)$/)
      if (!m) return
      const level = m[1].length
      const text = m[2].replace(/\*\*/g, "").trim()
      if (text === "Índice" || text.startsWith("Manual de")) return
      const isPart = text.startsWith("PARTE ") || level === 1
      items.push({ id: headingIds[i], text, level, isPart })
    })
    return items
  }, [headingIds])

  const { activeId, progress } = useScrollSpy(toc.map((t) => t.id))

  const [search, setSearch] = useState("")
  const [filterPartsOnly, setFilterPartsOnly] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const navRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!activeId || !navRef.current) return
    const container = navRef.current
    const activeEl = container.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(activeId)}"]`)
    if (activeEl) {
      const elTop = activeEl.offsetTop
      const elHeight = activeEl.offsetHeight
      const containerTop = container.scrollTop
      const containerHeight = container.clientHeight

      if (elTop < containerTop) {
        container.scrollTo({ top: Math.max(0, elTop - 12), behavior: "smooth" })
      } else if (elTop + elHeight > containerTop + containerHeight) {
        container.scrollTo({ top: elTop + elHeight - containerHeight + 12, behavior: "smooth" })
      }
    }
  }, [activeId])

  const filteredToc = useMemo(() => {
    return toc.filter((item) => {
      if (filterPartsOnly && !item.isPart) return false
      if (search.trim()) {
        return item.text.toLowerCase().includes(search.toLowerCase())
      }
      return true
    })
  }, [toc, filterPartsOnly, search])

  const partsCount = useMemo(() => toc.filter((t) => t.isPart).length, [toc])

  const handleNavigate = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -80
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
    setMobileDrawerOpen(false)
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setMobileDrawerOpen(false)
  }

  return (
    <div className="relative flex w-full items-start gap-10">
      {/* Main Document Area */}
      <article className="min-w-0 flex-1">
        {/* Top Collapsible Index for Mobile/Tablet (lg:hidden) */}
        <details className="group mb-8 rounded-2xl border border-border bg-card/60 p-4 transition-all lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-medium text-sm text-foreground select-none">
            <span className="flex items-center gap-2">
              <RiListUnordered className="size-4 text-primary" />
              Índice del Manual ({partsCount} Partes)
            </span>
            <RiArrowDownSLine className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pt-3 border-t border-border/50 max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {toc.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigate(t.id)
                }}
                className={cn(
                  "block truncate rounded-md px-2 py-1.5 text-xs transition-colors",
                  t.isPart
                    ? "font-semibold text-foreground mt-1 bg-muted/30"
                    : "text-muted-foreground hover:text-foreground pl-4"
                )}
              >
                {t.text}
              </a>
            ))}
          </div>
        </details>

        {content}

        <div className="mt-14 flex items-center justify-end text-[13px]">
          <Link
            to="/aprender/fundamentos"
            className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Empezar lecciones
            <RiArrowRightLine className="size-4" />
          </Link>
        </div>
      </article>

      {/* Desktop Right Sidebar (Notion / Stripe / Vercel style) */}
      <aside className="sticky top-24 shrink-0 hidden lg:block w-64 self-start py-1">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-3 text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
          <span>En esta página</span>
          <span className="font-mono text-primary font-semibold">{progress}%</span>
        </div>

        {/* Reading progress line */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60 mb-4">
          <div
            className="h-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Search / Filter bar */}
        <div className="relative mb-3">
          <RiSearchLine className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar secciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-muted/30 pl-8 pr-7 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RiCloseLine className="size-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter toggle */}
        <div className="flex items-center justify-between mb-3 text-[11px]">
          <button
            onClick={() => setFilterPartsOnly(!filterPartsOnly)}
            className={cn(
              "px-2 py-0.5 rounded-full transition-colors font-medium cursor-pointer",
              filterPartsOnly
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {filterPartsOnly ? "Solo Partes" : `Todas (${toc.length})`}
          </button>
          <button
            onClick={handleScrollToTop}
            className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RiArrowUpSLine className="size-3.5" />
            Top
          </button>
        </div>

        {/* Heading Tree with Pill Guide Rail Track */}
        <div className="relative pl-3.5">
          {/* Rounded vertical pill track line on the left */}
          <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-border/40" />

          <nav ref={navRef} className="max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 space-y-1 text-[12.5px] leading-snug custom-scrollbar">
            {filteredToc.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filteredToc.map((t) => {
                const isActive = activeId === t.id
                return (
                  <a
                    key={t.id}
                    data-toc-id={t.id}
                    href={`#${t.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigate(t.id)
                    }}
                    className={cn(
                      "group relative flex items-center rounded-lg px-2.5 py-1 transition-all duration-200 select-none",
                      t.isPart
                        ? "font-semibold text-foreground text-[12.5px] mt-2 first:mt-0"
                        : t.level === 2
                          ? "pl-3 text-[12px]"
                          : "pl-5 text-[11.5px]",
                      isActive
                        ? "bg-primary/10 text-primary font-medium shadow-2xs before:absolute before:-left-[15.5px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4.5 before:rounded-full before:bg-primary before:shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="truncate">{t.text}</span>
                  </a>
                )
              })
            )}
          </nav>
        </div>
      </aside>

      {/* Floating Bottom Button for Mobile / Tablet */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-card active:scale-95 cursor-pointer"
        >
          <RiListUnordered className="size-4 text-primary" />
          <span>Índice</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
            {progress}%
          </span>
        </button>
      </div>

      {/* Bottom Sheet Drawer for Mobile */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-auto max-h-[82vh] w-full flex-col rounded-t-3xl border-t border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom duration-250">
            {/* Drag Handle & Header */}
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <RiListUnordered className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">
                  Índice de Secciones
                </span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <RiCloseLine className="size-5" />
              </button>
            </div>

            {/* Reading progress bar */}
            <div className="mt-3 mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span className="font-mono text-primary font-semibold">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mb-3">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar sección..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
                >
                  <RiCloseLine className="size-4" />
                </button>
              )}
            </div>

            {/* Sections List */}
            <nav className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {filteredToc.map((t) => {
                const isActive = activeId === t.id
                return (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      handleNavigate(t.id)
                    }}
                    className={cn(
                      "block truncate rounded-lg px-3 py-2 text-xs transition-colors",
                      t.isPart
                        ? "font-semibold text-foreground bg-muted/40 mt-1"
                        : "text-muted-foreground hover:text-foreground pl-6",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {t.text}
                  </a>
                )
              })}
            </nav>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{toc.length} secciones</span>
              <button
                onClick={handleScrollToTop}
                className="flex items-center gap-1 text-primary font-medium cursor-pointer"
              >
                <RiArrowUpSLine className="size-4" />
                Ir arriba
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocsPage