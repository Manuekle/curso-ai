import { useRef } from "react"
import { SliderThumb } from "./SliderThumb"

export interface LiquidSliderProps {
  id?: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (val: number) => void
  className?: string
}

export function LiquidSlider({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
  className = "",
}: LiquidSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Compute percentage clamped between 0 and 100
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))

  return (
    <div
      ref={containerRef}
      className={`relative flex h-7 w-full items-center select-none ${className}`}
    >
      {/* Background Track */}
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Liquid Gooey Thumb */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
          style={{ left: `calc(${pct}% - 8px)` }}
        >
          <SliderThumb x={0} />
        </div>
      </div>

      {/* Interactive Range Input */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
      />
    </div>
  )
}

export default LiquidSlider
