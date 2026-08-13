import { useCallback, useEffect, useRef } from "react"

export interface SlidingTab {
  key: string
  label: string
}

export function SlidingTabs({
  tabs,
  active,
  onChange,
  fill = false,
}: {
  tabs: SlidingTab[]
  active: number
  onChange: (index: number) => void
  fill?: boolean
}) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const clickAnimatedRef = useRef(false)

  const moveTo = useCallback((idx: number, animate: boolean) => {
    const tab = tabRefs.current[idx]
    const pill = pillRef.current
    if (!tab || !pill) return
    const left = tab.offsetLeft
    const width = tab.offsetWidth
    if (!animate) {
      const prev = pill.style.transition
      pill.style.transition = "none"
      pill.style.transform = `translateX(${left}px)`
      pill.style.width = `${width}px`
      void pill.offsetWidth
      pill.style.transition = prev
    } else {
      pill.style.transform = `translateX(${left}px)`
      pill.style.width = `${width}px`
    }
  }, [])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      if (clickAnimatedRef.current) {
        clickAnimatedRef.current = false
        return
      }
      moveTo(active, false)
    })
    const onResize = () => moveTo(active, false)
    window.addEventListener("resize", onResize)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener("resize", onResize)
    }
  }, [active, moveTo])

  return (
    <div className={`t-tabs${fill ? " t-tabs--fill" : ""}`} role="tablist">
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {tabs.map((tab, i) => (
        <button
          key={tab.key}
          ref={(el) => {
            tabRefs.current[i] = el
          }}
          type="button"
          className="t-tab"
          role="tab"
          aria-selected={i === active}
          onClick={() => {
            clickAnimatedRef.current = true
            onChange(i)
            moveTo(i, true)
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default SlidingTabs