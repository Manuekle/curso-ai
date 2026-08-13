import { useRef, useState } from "react"
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"
import { sileo } from "sileo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const swapRef = useRef<HTMLSpanElement>(null)
  const busy = useRef(false)

  async function copy() {
    if (busy.current) return
    busy.current = true

    try {
      await navigator.clipboard.writeText(code)
      sileo.success({
        title: "Código copiado al portapapeles",
        description: label ? `Bloque: ${label}` : undefined,
        duration: 2000,
      })

      const el = swapRef.current
      if (el) {
        el.classList.add("is-exit")
        window.setTimeout(() => {
          setCopied(true)
          el.classList.remove("is-exit")
          el.classList.add("is-enter-start")
          void el.offsetWidth // force reflow
          el.classList.remove("is-enter-start")
        }, 150)
      } else {
        setCopied(true)
      }

      setTimeout(() => {
        const revertEl = swapRef.current
        if (revertEl) {
          revertEl.classList.add("is-exit")
          window.setTimeout(() => {
            setCopied(false)
            revertEl.classList.remove("is-exit")
            revertEl.classList.add("is-enter-start")
            void revertEl.offsetWidth // force reflow
            revertEl.classList.remove("is-enter-start")
            busy.current = false
          }, 150)
        } else {
          setCopied(false)
          busy.current = false
        }
      }, 1800)
    } catch {
      busy.current = false
    }
  }

  return (
    <div className="relative rounded-[22px] bg-card ring-1 ring-foreground/10">
      <p className="absolute top-[18px] left-8 font-mono text-xs text-muted-foreground">{label}</p>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        aria-label={copied ? "Copiado" : "Copiar código"}
        className={cn(
          "absolute top-[14px] right-[14px] h-[34px] w-[34px] rounded-[9px] bg-secondary text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground",
          copied && "text-primary"
        )}
      >
        <span ref={swapRef} className="t-text-swap">
          {copied ? <RiCheckLine className="size-4 text-primary" /> : <RiFileCopyLine className="size-4" />}
        </span>
      </Button>
      <pre className="max-h-96 overflow-auto p-6 pt-[60px] font-mono text-sm leading-[1.7] whitespace-pre text-foreground/80 md:p-8 md:pt-[64px]">
        {code}
      </pre>
    </div>
  )
}

export default CodeBlock