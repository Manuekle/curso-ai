import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { RiArrowRightLine } from "@remixicon/react"
import { CodeBlock } from "@/components/CodeBlock"
import docSource from "../content/doc.md?raw"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

// Repeated headings (e.g. "Preguntas", "Ejemplo") would otherwise collide on
// the same slug, breaking anchor navigation and React keys. Assign one
// deduped id per heading line, in document order, shared by the TOC and the
// rendered content so both agree on the same ids.
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

// Mermaid's "base" theme runs its own color math (lighten/darken via khroma)
// on themeVariables, so it can't take raw `var(--foo)` strings, and it can't
// parse `oklch(...)` either (our light-mode palette uses oklch). Resolve each
// CSS custom property through a canvas 2D context, which always normalizes
// whatever color syntax it's given down to a plain "rgba(...)" string.
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
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])
  return active
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
            <code key={`${keyBase}-${i}`} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">
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

export function DocsPage() {
  const headingIds = useMemo(() => computeHeadingIds(docSource), [])
  const content = useMemo(() => parseDoc(docSource, headingIds), [headingIds])
  const toc = useMemo(() => {
    const items: { id: string; text: string; level: number }[] = []
    const lines = docSource.split("\n")
    lines.forEach((line, i) => {
      const m = line.match(/^(#{1,3}) (.+)$/)
      if (!m) return
      const level = m[1].length
      const text = m[2].replace(/\*\*/g, "").trim()
      if (text === "Índice" || text.startsWith("Manual de")) return
      items.push({ id: headingIds[i], text, level })
    })
    return items
  }, [headingIds])
  const active = useScrollSpy(toc.map((t) => t.id))

  return (
    <article className="mx-auto w-full">
      {content}
      <aside className="fixed top-1/2 right-5 z-40 hidden max-h-[70vh] w-56 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card/80 p-3 backdrop-blur 2xl:flex">
        <p className="px-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">En esta página</p>
        <nav className="flex flex-col gap-0.5">
          {toc.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`truncate rounded-md px-2 py-1 text-[12.5px] transition-colors duration-150 ${
                active === t.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              style={{ paddingLeft: `${8 + (t.level - 1) * 12}px` }}
            >
              {t.text}
            </a>
          ))}
        </nav>
      </aside>
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
  )
}

export default DocsPage