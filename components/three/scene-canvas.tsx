"use client"

import * as React from "react"
import { Canvas, type CanvasProps } from "@react-three/fiber"

import { cn } from "@/lib/utils"

type SceneCanvasProps = Omit<CanvasProps, "children"> & {
  children: React.ReactNode
  /** Wrapper class. The canvas fills this element. */
  className?: string
  /** Pause the render loop when the canvas leaves the viewport. Default true. */
  pauseOffscreen?: boolean
  /** Max device pixel ratio. 1.5 keeps mid-range laptops at 60fps. */
  maxDpr?: number
}

/**
 * Shared R3F canvas wrapper.
 * - Caps DPR for performance.
 * - Pauses the frameloop when scrolled out of view or the tab is hidden;
 *   otherwise honours the `frameloop` you pass ("always" | "demand").
 * - Must be imported with `next/dynamic` + `ssr: false` from a client
 *   component; WebGL cannot render on the server.
 */
export function SceneCanvas({
  children,
  className,
  pauseOffscreen = true,
  maxDpr = 1.5,
  frameloop,
  gl,
  ...props
}: SceneCanvasProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(true)
  const [tabVisible, setTabVisible] = React.useState(true)

  React.useEffect(() => {
    if (!pauseOffscreen || !wrapperRef.current) return
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "20% 0px" }
    )
    io.observe(wrapperRef.current)
    return () => io.disconnect()
  }, [pauseOffscreen])

  React.useEffect(() => {
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  const running = visible && tabVisible

  return (
    <div ref={wrapperRef} className={cn("relative size-full", className)}>
      <Canvas
        dpr={[1, maxDpr]}
        frameloop={running ? (frameloop ?? "always") : "never"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          ...(typeof gl === "object" ? gl : {}),
        }}
        {...props}
      >
        {children}
      </Canvas>
    </div>
  )
}
