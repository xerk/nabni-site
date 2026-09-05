"use client"

/**
 * THE STELE — canvas mounts (DESIGN.md §4.2, §4.6, §4.7).
 *
 * `SteleStageCanvas`: fine pointers. One fixed, full-viewport, transparent
 * canvas above the section grounds and below the nav; its slab is placed on
 * the current anchor's rect, measured inside the Lenis scroll callback.
 *
 * `SteleInflowCanvas`: coarse pointers. An in-flow canvas clipped by the hero
 * or contact stone block; the light is bound to scroll across the block and
 * to a horizontal touch drag. Both mounts share the engine; only the GL
 * context is per mount.
 *
 * Both are imported with `next/dynamic({ ssr: false })` from ./stele.tsx.
 */

import * as React from "react"
import { invalidate } from "@react-three/fiber"

import { useLenis } from "@/components/providers/smooth-scroll"
import { SceneCanvas } from "@/components/three/scene-canvas"
import { prefersReducedMotion } from "@/hooks/use-reduced-motion"
import { gsap, ScrollTrigger } from "@/lib/motion/gsap"
import { CAMERA } from "@/lib/stele/grid"

import {
  RIPPLE_AT_MS,
  steleEngine,
  type GlassMount as SteleMount,
} from "../glass/glass-engine"
import {
  defaultHeroRect,
  KEY_LIGHT_INTENSITY,
  MountController,
  rectToWorld,
} from "./stele-placement"
import { GlassScene } from "../glass/glass-scene"
import {
  stele,
  steleState,
  STELE_DEFAULT_WORD,
  STELE_LIGHT,
  type Rect,
  type SteleTier,
} from "./stele-state"
import { deriveZone, navHeightPx, ZoneDirector } from "./stele-zones"

/**
 * The slab never comes closer than ≈4 units, so a 0.5 near plane keeps the
 * depth buffer's precision on the relief (cells 0.001–0.015 apart) even on
 * 16-bit depth.
 */
const CAMERA_PROPS = {
  fov: CAMERA.fov,
  position: [0, 0, CAMERA.z] as [number, number, number],
  near: 0.5,
  far: 30,
}
const GL_PROPS = { antialias: true }
/** R3F's own wrapper forces pointer-events: auto; the fixed stage must never take events. */
const STAGE_STYLE = { pointerEvents: "none" } as const
/** Crossfade over the SVG once the first frame is drawn (§4.7). */
const CROSSFADE_MS = 200
/**
 * Load light rise (§6.1): el −10° → 22°, intensity 0 → 2.2 over 1100ms,
 * timed from mount. A first frame that arrives late joins the rise at the
 * matching progress (or skips it once it is over) instead of restarting it.
 */
const RISE = { duration: 1.1, ease: "power2.out" } as const
/** Coarse hero drag: ±40° across a third of the block, decaying over 800ms. */
const DRAG = { gain: 120, max: 40, decay: 0.8 } as const

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    if (!gl) return false
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

function useTier(): SteleTier {
  return React.useSyncExternalStore(
    stele.subscribe,
    () => steleState.tier,
    () => "A"
  )
}

function useActive(): boolean {
  return React.useSyncExternalStore(
    stele.subscribe,
    () => steleState.active,
    () => true
  )
}

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v

/** Keep the SVG on a lost context; the engine re-renders it from the runtime mask. */
function watchContextLoss(canvas: HTMLCanvasElement, onLost: () => void) {
  const handler = (e: Event) => {
    e.preventDefault()
    onLost()
  }
  canvas.addEventListener("webglcontextlost", handler)
}

function crossfadeIn(el: HTMLElement, opacity: number) {
  el.style.transition = `opacity ${CROSSFADE_MS}ms var(--ease-studio)`
  el.style.opacity = String(opacity)
  window.setTimeout(() => {
    el.style.transition = ""
  }, CROSSFADE_MS + 60)
}

// --------------------------------------------------------------------- stage

export function SteleStageCanvas() {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const tier = useTier()
  const active = useActive()
  const { getLenis } = useLenis()
  const controller = React.useMemo(() => new MountController("stage"), [])
  const [webgl] = React.useState(() => hasWebGL())
  const [lost, setLost] = React.useState(false)
  const reduced = React.useMemo(() => prefersReducedMotion(), [])
  const usable = webgl && !lost

  // Attach to the engine (registers the driver; replays a pending carve).
  React.useEffect(() => {
    if (!usable) {
      steleEngine.enableSvgFallback()
      const mount: SteleMount = { invalidate: () => {} }
      steleEngine.attach(mount, "A")
      return () => steleEngine.detach(mount)
    }
    const mount: SteleMount = { invalidate: () => invalidate() }
    steleEngine.attach(mount, "A")
    return () => steleEngine.detach(mount)
  }, [usable])

  // Lifecycle and placement. Inside the Lenis scroll callback (and the window
  // scroll event, which also covers hash and scrollTo jumps and the
  // reduced-motion path without Lenis), on resize, on ScrollTrigger refresh
  // (pin spacers move layout without a scroll event) and when the anchor
  // changes: derive the zone from DOM geometry (the stage is the authority,
  // see stele-zones.ts), then read the current anchor's rect.
  React.useEffect(() => {
    if (!usable) return
    const director = new ZoneDirector(reduced)
    const rect: Rect = { x: 0, y: 0, width: 0, height: 0 }
    const measure = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      director.apply(deriveZone(vh))
      controller.setZone(director.zone ?? "none")
      if (!steleState.active) {
        // No frame will run while the loop is off: hide the wrapper directly.
        controller.applyOpacity(0)
        return
      }
      const anchor = steleState.anchor
      const el = document.getElementById(`stele-anchor-${anchor}`)
      if (el) {
        const r = el.getBoundingClientRect()
        rect.x = r.left
        rect.y = r.top
        rect.width = r.width
        rect.height = r.height
        // The capabilities column is sticky at nav + 8vh: hold the slab
        // there until the sticky engages (§4.6), so it never sits below the
        // fold after the hero unpins and never travels back up. Before the
        // sticky engages the live anchor top is BELOW the stuck top, so the
        // clamp must take the smaller value; once the column unsticks at the
        // section's end the live top is smaller and wins, so the slab rides
        // out with the column.
        if (anchor === "capabilities")
          rect.y = Math.min(rect.y, navHeightPx() + 0.08 * vh)
      } else {
        defaultHeroRect(vw, vh, rect)
      }
      if (rect.width > 0 && rect.height > 0)
        rectToWorld(rect, vw, vh, controller.target)
      invalidate()
    }
    measure()

    let lenis: ReturnType<typeof getLenis> = null
    let raf = 0
    let tries = 0
    const tryLenis = () => {
      const instance = getLenis()
      if (instance) {
        lenis = instance
        // Registered after the provider's ScrollTrigger.update listener, so
        // section callbacks have already run when the zone is re-derived.
        instance.on("scroll", measure)
      } else if (tries++ < 120) {
        raf = requestAnimationFrame(tryLenis)
      }
    }
    tryLenis()
    window.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure)
    ScrollTrigger.addEventListener("refresh", measure)
    let lastAnchor = steleState.anchor
    const unsubscribe = stele.subscribe(() => {
      director.reassert()
      if (steleState.anchor !== lastAnchor) {
        lastAnchor = steleState.anchor
        measure()
      }
    })
    return () => {
      cancelAnimationFrame(raf)
      lenis?.off("scroll", measure)
      window.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
      ScrollTrigger.removeEventListener("refresh", measure)
      unsubscribe()
      director.dispose()
    }
  }, [usable, controller, getLenis, reduced])

  // Re-activation switches the frameloop back to "demand"; request the frame after commit.
  React.useLayoutEffect(() => {
    if (active) invalidate()
  }, [active])

  const onFirstFrame = React.useCallback(() => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      controller.setWrapper(wrapper, steleState.opacity)
      crossfadeIn(wrapper, steleState.opacity)
    }
    stele.setReady(true)
    // §6.1 is clocked from mount; a late first frame joins in progress.
    const elapsed = (performance.now() - controller.mountedAt) / 1000
    if (!reduced && elapsed < RISE.duration) {
      controller.beginRise()
      gsap
        .to(controller.rise, {
          el: STELE_LIGHT.heroStart.el,
          intensity: KEY_LIGHT_INTENSITY,
          duration: RISE.duration,
          ease: RISE.ease,
          onUpdate: () => invalidate(),
          onComplete: () => {
            controller.endRise(
              STELE_LIGHT.heroStart.az,
              STELE_LIGHT.heroStart.el
            )
            invalidate()
          },
        })
        .progress(elapsed / RISE.duration)
    }
    steleEngine.scheduleRipple(controller.mountedAt + RIPPLE_AT_MS)
    invalidate()
  }, [controller, reduced])

  const onLost = React.useCallback(() => {
    setLost(true)
    stele.setReady(false)
    steleEngine.enableSvgFallback()
  }, [])

  if (!usable) return null

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed inset-0 z-10 opacity-0"
      style={{ visibility: active ? "visible" : "hidden" }}
      aria-hidden="true"
    >
      <SceneCanvas
        frameloop={active ? "demand" : "never"}
        pauseOffscreen={false}
        maxDpr={tier === "A" ? 1.5 : 1}
        shadows={tier === "A" ? "percentage" : false}
        flat
        gl={GL_PROPS}
        camera={CAMERA_PROPS}
        style={STAGE_STYLE}
        onCreated={({ gl }) => watchContextLoss(gl.domElement, onLost)}
      >
        <GlassScene
          controller={controller}
          reduced={reduced}
          onFirstFrame={onFirstFrame}
        />
      </SceneCanvas>
    </div>
  )
}

// -------------------------------------------------------------------- in-flow

export type SteleInflowCanvasProps = {
  anchor: "hero" | "contact"
  /** Called after this mount's first frame (the anchor hides its SVG). */
  onReady?: () => void
}

export function SteleInflowCanvas({ anchor, onReady }: SteleInflowCanvasProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const controller = React.useMemo(() => new MountController(anchor), [anchor])
  const [webgl] = React.useState(() => hasWebGL())
  const [lost, setLost] = React.useState(false)
  const reduced = React.useMemo(() => prefersReducedMotion(), [])
  const usable = webgl && !lost

  React.useEffect(() => {
    if (!usable) {
      steleEngine.enableSvgFallback()
      const mount: SteleMount = { invalidate: () => {} }
      steleEngine.attach(mount, "B")
      return () => steleEngine.detach(mount)
    }
    const mount: SteleMount = { invalidate: () => invalidate() }
    steleEngine.attach(mount, "B")
    return () => steleEngine.detach(mount)
  }, [usable])

  // Box size → slab framing (landscape blocks show the carved band; portrait blocks fit the width).
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!usable || !el) return
    const fit = () => {
      controller.setInflowBox(el.clientWidth, el.clientHeight)
      invalidate()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [usable, controller])

  // Visibility: the visible mount writes the readout angles; request a frame
  // on entry. The contact block shows the brief (or نبني) whenever it comes
  // into view, never the hero's scroll word (§4.6 "Contact").
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!usable || !el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        controller.setPrimary(entry.isIntersecting)
        if (entry.isIntersecting) {
          if (anchor === "contact") {
            const word = stele.getBrief() ?? STELE_DEFAULT_WORD
            if (steleState.word !== word) stele.carve(word, { instant: true })
          }
          steleEngine.notify(true)
          invalidate()
        }
      },
      { rootMargin: "20% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [usable, controller, anchor])

  // Hero: light bound to scroll across the block (az −70 → 0, el 12 → 40) plus a horizontal touch drag.
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!usable || !el || anchor !== "hero") return
    const { from, to } = STELE_LIGHT.coarse
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1)
      controller.setTargets(
        from.az + (to.az - from.az) * p,
        from.el + (to.el - from.el) * p
      )
      invalidate()
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    let dragging = false
    let startX = 0
    let width = 1
    let decay: gsap.core.Tween | null = null
    const onDown = (e: PointerEvent) => {
      if (reduced || e.pointerType !== "touch") return
      dragging = true
      startX = e.clientX
      width = el.clientWidth || 1
      decay?.kill()
      decay = null
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      controller.setNudge(
        clamp(((e.clientX - startX) / width) * DRAG.gain, -DRAG.max, DRAG.max)
      )
      invalidate()
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      decay = gsap.to(controller, {
        nudge: 0,
        duration: DRAG.decay,
        ease: "power2.out",
        onUpdate: () => invalidate(),
      })
    }
    el.addEventListener("pointerdown", onDown, { passive: true })
    el.addEventListener("pointermove", onMove, { passive: true })
    el.addEventListener("pointerup", onUp)
    el.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      el.removeEventListener("pointerdown", onDown)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerup", onUp)
      el.removeEventListener("pointercancel", onUp)
      decay?.kill()
      controller.setNudge(0)
    }
  }, [usable, anchor, controller, reduced])

  const onFirstFrame = React.useCallback(() => {
    const wrapper = wrapperRef.current
    if (wrapper) crossfadeIn(wrapper, 1)
    stele.setReady(true)
    onReady?.()
    steleEngine.scheduleRipple(controller.mountedAt + RIPPLE_AT_MS)
    invalidate()
  }, [onReady, controller])

  const onLost = React.useCallback(() => {
    setLost(true)
    stele.setReady(false)
    steleEngine.enableSvgFallback()
  }, [])

  if (!usable) return null

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-auto absolute inset-0 touch-pan-y opacity-0"
      aria-hidden="true"
    >
      <SceneCanvas
        frameloop="demand"
        pauseOffscreen
        maxDpr={1}
        shadows={false}
        flat
        gl={GL_PROPS}
        camera={CAMERA_PROPS}
        onCreated={({ gl }) => watchContextLoss(gl.domElement, onLost)}
      >
        <GlassScene
          controller={controller}
          reduced={reduced}
          onFirstFrame={onFirstFrame}
        />
      </SceneCanvas>
    </div>
  )
}
