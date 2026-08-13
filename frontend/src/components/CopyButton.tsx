import { useRef, useState, type ReactNode } from "react"
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"
import { sileo } from "sileo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CopyButtonProps {
  textToCopy: string
  label?: string
  copiedLabel?: string
  className?: string
  variant?: "ghost" | "outline" | "secondary" | "default"
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm"
  showToast?: boolean
  children?: ReactNode
}

export function CopyButton({
  textToCopy,
  label,
  copiedLabel = "Copiado",
  className = "",
  variant = "ghost",
  size = "icon-sm",
  showToast = false,
  children,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const swapRef = useRef<HTMLSpanElement>(null)
  const busy = useRef(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (busy.current) return
    busy.current = true

    try {
      await navigator.clipboard.writeText(textToCopy)
      if (showToast) {
        sileo.success({
          title: "Copiado al portapapeles",
          description: textToCopy.slice(0, 60) + (textToCopy.length > 60 ? "…" : ""),
          duration: 2000,
        })
      }

      // Trigger three-phase text swap animation
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

      // Revert after 1800ms with reverse swap
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
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label || "Copiar"}
      className={cn("transition-colors", className)}
    >
      <span ref={swapRef} className="t-text-swap">
        {copied ? (
          <>
            <RiCheckLine className="size-4 text-primary" />
            {copiedLabel && size !== "icon-sm" && size !== "icon" && (
              <span className="text-xs font-medium text-primary">{copiedLabel}</span>
            )}
          </>
        ) : (
          <>
            {children || <RiFileCopyLine className="size-4 text-muted-foreground" />}
            {label && size !== "icon-sm" && size !== "icon" && (
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            )}
          </>
        )}
      </span>
    </Button>
  )
}

export default CopyButton
