import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin(useGSAP)

interface Phase {
  label: string
  steps: string[]
}

export function FlowDemo({
  phases,
  loop = false,
}: {
  phases: Phase[]
  loop?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const rail = root.querySelector<HTMLElement>(".fd-rail")
      const line = root.querySelector<HTMLElement>(".fd-line")
      const pulse = root.querySelector<HTMLElement>(".fd-pulse")
      const dots = root.querySelectorAll<HTMLElement>(".fd-dot")
      const labels = root.querySelectorAll<HTMLElement>(".fd-label")
      const headers = root.querySelectorAll<HTMLElement>(".fd-phase")
      if (!rail || !line || !pulse || !dots.length || !labels.length) return

      const step = 0.5
      const hold = loop ? 1.6 : 1.1
      const railH = rail.offsetHeight
      const totalSteps = phases.reduce((n, p) => n + p.steps.length, 0)

      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set([line, pulse, dots, labels, headers], { autoAlpha: 0 })
        gsap.set(line, { scaleY: 0, transformOrigin: "top" })

        const tl = gsap.timeline({ repeat: loop ? -1 : -1 })
        tl.to(line, { scaleY: 1, duration: 0.45, ease: "power2.out" })
          .to(pulse, { autoAlpha: 1, duration: 0.1 }, "<0.25")
          .to(dots, { backgroundColor: "var(--foreground)", scale: 1.15, duration: 0.25 }, 0.9)
          .to(labels, { autoAlpha: 1, y: 0, duration: 0.4, stagger: step }, "<")

        let t = 1.15
        headers.forEach((h) => {
          tl.to(h, { autoAlpha: 1, y: 0, duration: 0.3 }, t)
          t += 0.5
        })
        t += 0.95

        tl.to(
          pulse,
          { y: railH - pulse.offsetHeight, duration: (totalSteps - 1) * step + 0.2, ease: "none" },
          t
        ).to({}, { duration: hold })

        if (loop) {
          tl.to(
            pulse,
            { y: 0, duration: (totalSteps - 1) * step + 0.2, ease: "none" },
            ">"
          ).to({}, { duration: hold })
        }

        tl.to([pulse, dots, labels, headers], {
          autoAlpha: 0,
          y: 8,
          duration: loop ? 0 : 0.45,
          ease: "power2.in",
        })
          .set(dots, { backgroundColor: "", scale: 1, y: 0 }, ">")
          .set(pulse, { y: 0 }, "<")

        return () => {
          tl.kill()
        }
      })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([line, pulse, dots, labels, headers], { autoAlpha: 1 })
        gsap.set(line, { scaleY: 1 })
        gsap.set(labels, { y: 0 })
        gsap.set(headers, { y: 0 })
        gsap.set(dots, { scale: 1 })
      })
    },
    { scope: rootRef }
  )

  return (
    <div
      ref={rootRef}
      className="rounded-lg border border-border bg-card p-5 text-[13px] text-foreground/80"
    >
      <div className="flex gap-4">
        <div className="fd-rail relative w-3 shrink-0">
          <div className="fd-line absolute inset-x-[3px] top-1 bottom-1 w-px bg-border" />
          <div className="fd-pulse absolute top-0 left-[1px] size-2 rounded-full bg-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {phases.map((phase) => (
            <div key={phase.label} className="flex min-w-0 flex-col gap-2.5">
              <p className="fd-phase flex items-center gap-2 font-mono text-[10px] tracking-[-0.005em] text-muted-foreground">
                <span className="h-px w-4 bg-foreground/20" />
                {phase.label}
              </p>
              <ol className="flex min-w-0 flex-col gap-2.5">
                {phase.steps.map((stepText) => (
                  <li key={stepText} className="flex min-w-0 items-baseline gap-2.5">
                    <span className="fd-dot inline-block size-2.5 shrink-0 translate-y-[-1px] rounded-full bg-secondary ring-1 ring-inset ring-foreground/10" />
                    <span className="fd-label min-w-0 leading-snug">{stepText}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FlowDemo