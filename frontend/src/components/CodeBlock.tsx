import { useState } from "react"
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
        {copied ? <RiCheckLine className="size-4" /> : <RiFileCopyLine className="size-4" />}
      </Button>
      <pre className="max-h-96 overflow-auto p-6 pt-[60px] font-mono text-sm leading-[1.7] whitespace-pre text-foreground/80 md:p-8 md:pt-[64px]">
        {code}
      </pre>
    </div>
  )
}