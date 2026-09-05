"use client"

import * as React from "react"

import { stele } from "@/components/stele/stele-state"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { gsap } from "@/lib/motion/gsap"

/**
 * The sun. Custom cursor mechanics; the look lives in globals.css `.cursor`.
 *
 * States (data-cursor on any ancestor of the hovered element):
 *   "stone"  over a stele rect: halo; pointer position drives the key light
 *   "link"   links/buttons/rows: 36px ring (applied automatically to <a>, <button>)
 *   "input"  form fields: a thin vertical bar (applied automatically to inputs)
 *   "hide"   hides the custom cursor
 *
 * Mounted only for fine pointers and never under reduced motion.
 */
export function Cursor() {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const finePointer = useMediaQuery("(pointer: fine)")
  const enabled = finePointer && !reduced

  React.useEffect(() => {
    if (!enabled || !ref.current) return
    const el = ref.current
    const root = document.documentElement
    root.classList.add("has-cursor")

    const xTo = gsap.quickTo(el, "x", { duration: 0.14, ease: "power3" })
    const yTo = gsap.quickTo(el, "y", { duration: 0.14, ease: "power3" })

    let shown = false
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY })
        el.dataset.visible = "true"
        shown = true
      }
      xTo(e.clientX)
      yTo(e.clientY)
      stele.setPointer(
        e.clientX / window.innerWidth,
        e.clientY / window.innerHeight
      )
    }
    const onLeave = () => {
      el.dataset.visible = "false"
      shown = false
    }
    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (!target) return
      const explicit = target.closest<HTMLElement>("[data-cursor]")
      let state = explicit?.dataset.cursor ?? ""
      if (!state) {
        if (target.closest("input, textarea, select, [contenteditable='true']"))
          state = "input"
        else if (target.closest("a, button, [role='button'], summary"))
          state = "link"
      }
      el.dataset.state = state
    }
    const onDown = () => {
      el.dataset.pressed = "true"
    }
    const onUp = () => {
      el.dataset.pressed = "false"
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerover", onOver)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("pointerup", onUp)
    root.addEventListener("pointerleave", onLeave)

    return () => {
      root.classList.remove("has-cursor")
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerover", onOver)
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointerleave", onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={ref}
      className="cursor"
      data-visible="false"
      data-state=""
      data-pressed="false"
      aria-hidden="true"
    />
  )
}
