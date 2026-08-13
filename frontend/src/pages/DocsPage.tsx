import { useMemo, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { RiArrowRightLine } from "@remixicon/react"
import { CodeBlock } from "@/components/CodeBlock"
import docSource from "../content/doc.md?raw"

function inline(text: string, keyBase: number): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
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
        return <span key={`${keyBase}-${i}`}>{part}</span>
      })}
    </>
  )
}

function parseDoc(source: string): ReactNode[] {
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
      nodes.push(
        <div key={key++} className="my-6">
          <CodeBlock label={lang || "text"} code={buf.join("\n")} />
        </div>
      )
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
      if (level === 1 && nodes.length === 0) {
        nodes.push(
          <h1 key={key++} className="detail-title">
            {inline(text, key)}
          </h1>
        )
      } else if (level === 1 || level === 2) {
        nodes.push(
          <h2 key={key++} className="mt-12 mb-4 font-heading text-[24px] font-normal tracking-[-0.005em]">
            {inline(text, key)}
          </h2>
        )
      } else if (level === 3) {
        nodes.push(
          <h3 key={key++} className="mt-8 mb-3 font-heading text-[19px] font-normal tracking-[-0.005em]">
            {inline(text, key)}
          </h3>
        )
      } else {
        nodes.push(
          <h4 key={key++} className="mt-6 mb-2 text-[15px] font-normal tracking-[-0.005em] text-foreground">
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
  const content = useMemo(() => parseDoc(docSource), [])

  return (
    <article className="mx-auto w-full">
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
  )
}

export default DocsPage