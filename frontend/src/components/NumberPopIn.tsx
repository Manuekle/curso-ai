import { useEffect, useRef, useState } from "react"

export interface NumberPopInProps {
  value: number | string
  prefix?: string
  suffix?: string
  className?: string
  animateOnMount?: boolean
}

export function NumberPopIn({
  value,
  prefix = "",
  suffix = "",
  className = "",
  animateOnMount = false,
}: NumberPopInProps) {
  const strVal = String(value)
  const [animating, setAnimating] = useState(animateOnMount)
  const prevVal = useRef(strVal)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (animateOnMount) {
        const timer = setTimeout(() => setAnimating(false), 700)
        return () => clearTimeout(timer)
      }
      return
    }

    if (prevVal.current !== strVal) {
      prevVal.current = strVal
      setAnimating(false)
      const raf = requestAnimationFrame(() => {
        // Re-enable animation in the next frame to trigger CSS keyframes
        setAnimating(true)
      })
      const timer = setTimeout(() => {
        setAnimating(false)
      }, 700)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(timer)
      }
    }
  }, [strVal, animateOnMount])

  const chars = strVal.split("")

  return (
    <span className={`t-digit-group ${animating ? "is-animating" : ""} ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {chars.map((char, i) => (
        <span
          key={i}
          className="t-digit"
          data-stagger={i > 0 ? Math.min(16, i) : undefined}
        >
          {char}
        </span>
      ))}
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  )
}

export default NumberPopIn
