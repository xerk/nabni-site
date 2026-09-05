"use client"

import * as React from "react"

import { gsap, useGSAP } from "@/lib/motion/gsap"

/**
 * Ground wipe (DESIGN.md §V2): instead of a hard edge between a Night section
 * and a Sand section, a Night-coloured veil covers the top of the Sand section
 * and retracts upward, scrubbed, as the section enters. Sits behind the
 * section's content (z -1 inside the section's isolated stacking context).
 * Reduced motion: no veil.
 */
export function GroundWipe() {
  const ref = React.useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0 0 0% 0)" },
          {
            clipPath: "inset(0 0 100% 0)",
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top 95%",
              end: "top 35%",
              scrub: 0.4,
            },
          }
        )
      })
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { clipPath: "inset(0 0 100% 0)" })
      })
    },
    { scope: ref }
  )

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36vh] bg-night"
      style={{ clipPath: "inset(0 0 100% 0)" }}
    />
  )
}
