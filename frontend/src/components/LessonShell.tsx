import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/CodeBlock"
import { SlidingTabs, type SlidingTab } from "@/components/SlidingTabs"
import { Accordion } from "@/components/Accordion"
import { cn } from "@/lib/utils"

interface Props {
  title: string
  tag: string
  intro: ReactNode
  code?: { label: string; code: string }
  interview: string
  solution?: string
  prev?: { to: string; label: string }
  next?: { to: string; label: string }
  children?: ReactNode
}

function CircleNav({
  to,
  label,
  dir,
}: {
  to?: string
  label?: string
  dir: "prev" | "next"
}) {
  const cls =
    "flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors duration-150 hover:bg-secondary/70 hover:text-foreground"
  const spanCls = "pointer-events-none opacity-40"

  if (!to) {
    return (
      <span className={cn(cls, spanCls)} aria-hidden>
        {dir === "prev" ? <RiArrowLeftLine className="size-4" /> : <RiArrowRightLine className="size-4" />}
      </span>
    )
  }

  return (
    <Link
      to={to}
      className={cls}
      aria-label={`${dir === "prev" ? "Anterior" : "Siguiente"}: ${label}`}
      title={label}
    >
      {dir === "prev" ? <RiArrowLeftLine className="size-4" /> : <RiArrowRightLine className="size-4" />}
    </Link>
  )
}

function RevealHeader({ title, tag }: { title: string; tag: string }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setRevealed(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div className={cn("t-stagger pr-24 md:pr-28", revealed && "is-shown")}>
      <h1 className="t-stagger-line detail-title">{title}</h1>
      <div className="t-stagger-line t-stagger-line--2 mt-6 flex items-center gap-4">
        <Badge variant="secondary" className="shrink-0 rounded-full text-[11px]">
          {tag}
        </Badge>
      </div>
    </div>
  )
}

export function LessonShell({
  title,
  tag,
  intro,
  code,
  interview,
  solution,
  prev,
  next,
  children,
}: Props) {
  const tabs: SlidingTab[] = [
    { key: "preview", label: "Preview" },
    ...(code ? [{ key: "code", label: "Código" }] : []),
    { key: "interview", label: "Entrevista" },
  ]
  const [activeIdx, setActiveIdx] = useState(0)
  const activeKey = tabs[activeIdx]?.key ?? "preview"

  return (
    <article className="relative mx-auto w-full">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <CircleNav dir="prev" to={prev?.to} label={prev?.label} />
        <CircleNav dir="next" to={next?.to} label={next?.label} />
      </div>

      <RevealHeader title={title} tag={tag} />

      <div className="mt-10">
        <SlidingTabs tabs={tabs} active={activeIdx} onChange={setActiveIdx} />
      </div>

      {activeKey === "preview" && (
        <div className="anim-tab mt-6">
          <Card className="rounded-[22px]">
            <CardContent className="flex flex-col gap-4 px-5 md:px-10">
              <div className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground [&_strong]:font-normal [&_strong]:text-foreground">
                {intro}
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
      )}

      {activeKey === "code" && code && (
        <div className="anim-tab mt-6">
          <CodeBlock label={code.label} code={code.code} />
        </div>
      )}

      {activeKey === "interview" && (
        <div className="anim-tab mt-6">
          <Card className="rounded-[22px]">
            <CardContent className="flex flex-col gap-3 px-5 md:px-10">
              <p className="font-mono text-xs text-muted-foreground">Pregunta de entrevista</p>
              <p className="text-[15.5px] leading-relaxed">{interview}</p>
              {solution && (
                <Accordion title="Ver respuesta de entrevista modelo" className="mt-2">
                  <div className="text-[14px] leading-relaxed text-foreground/90 pt-2 pb-1">
                    {solution}
                  </div>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-12 flex items-center justify-between gap-4 text-[13px]">
        <span className="min-w-0">
          {prev && (
            <Link
              to={prev.to}
              className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <RiArrowLeftLine className="size-4 shrink-0" />
              <span className="truncate">{prev.label}</span>
            </Link>
          )}
        </span>
        <span className="min-w-0">
          {next && (
            <Link
              to={next.to}
              className="flex items-center gap-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <span className="truncate">{next.label}</span>
              <RiArrowRightLine className="size-4 shrink-0" />
            </Link>
          )}
        </span>
      </div>
    </article>
  )
}