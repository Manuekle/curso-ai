import { Liquid } from "liquid-gooey"

export function SliderThumb({ x }: { x: number }) {
  return (
    <Liquid blur={6} contrast={18} fill="var(--foreground)">
      <Liquid.Item effect="move" move={{ springiness: 0.5, trail: 0.35 }}>
        <div className="thumb" style={{ transform: `translateX(${x}px)` }} />
      </Liquid.Item>
    </Liquid>
  )
}

export default SliderThumb