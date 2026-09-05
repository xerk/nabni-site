"use client"

import * as React from "react"
import Lenis from "lenis"

import { gsap, ScrollTrigger } from "@/lib/motion/gsap"
import { prefersReducedMotion } from "@/hooks/use-reduced-motion"

type ScrollTarget = string | number | HTMLElement

type LenisContextValue = {
  /** The live Lenis instance, or null before mount / under reduced motion. */
  getLenis: () => Lenis | null
  scrollTo: (target: ScrollTarget, offset?: number) => void
}

const LenisContext = React.createContext<LenisContextValue>({
  getLenis: () => null,
  scrollTo: () => {},
})

export function useLenis() {
  return React.useContext(LenisContext)
}

function nativeScrollTo(target: ScrollTarget) {
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" })
    return
  }
  const el =
    typeof target === "string" ? document.querySelector(target) : target
  el?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/**
 * Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger pins never
 * jitter. Skipped entirely when the visitor prefers reduced motion; native
 * scrolling still works and ScrollTrigger uses the window scroller.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = React.useRef<Lenis | null>(null)

  React.useEffect(() => {
    if (prefersReducedMotion()) return

    const instance = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      // Touch devices keep native scrolling; syncing touch feels laggy.
      syncTouch: false,
      autoRaf: false,
      anchors: true,
    })

    instance.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    lenisRef.current = instance

    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenisRef.current = null
    }
  }, [])

  /**
   * Hash on load: the browser scrolls to the fragment before ScrollTrigger
   * inserts the hero's pin spacer, which pushes every later section down.
   * Re-scroll to the target on each refresh during the first seconds after
   * mount (idempotent), so a shared #contact link lands on contact.
   */
  React.useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash.length < 2) return
    let target: Element | null = null
    try {
      target = document.querySelector(hash)
    } catch {
      return
    }
    if (!target) return
    const el = target

    const go = () => {
      const top = Math.round(el.getBoundingClientRect().top + window.scrollY)
      if (Math.abs(top - window.scrollY) < 2) return
      const lenis = lenisRef.current
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true })
      else window.scrollTo(0, top)
    }

    const onRefresh = () => requestAnimationFrame(go)
    ScrollTrigger.addEventListener("refresh", onRefresh)
    const first = window.setTimeout(go, 100)
    const stop = window.setTimeout(() => {
      ScrollTrigger.removeEventListener("refresh", onRefresh)
    }, 3000)
    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh)
      clearTimeout(first)
      clearTimeout(stop)
    }
  }, [])

  const value = React.useMemo<LenisContextValue>(
    () => ({
      getLenis: () => lenisRef.current,
      scrollTo: (target, offset = 0) => {
        const lenis = lenisRef.current
        if (lenis) {
          lenis.scrollTo(target, { offset, duration: 1.4 })
        } else {
          nativeScrollTo(target)
        }
      },
    }),
    []
  )

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>
}
