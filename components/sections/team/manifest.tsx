"use client"

import * as React from "react"

import { revealFrom } from "@/components/sections/reveal"
import { stack } from "@/content/stack"
import { gsap, useGSAP } from "@/lib/motion/gsap"

/**
 * The manifest: the real stack as mono key/value rows (DESIGN.md §5.5).
 * Mist keys, Limestone values, rows separated by spacing only, no rules.
 * Reveals once with a top-down clip-path wipe, 600ms `studio`.
 */
export function Manifest() {
  const scope = React.useRef<HTMLDListElement>(null)

  useGSAP(
    () => {
      const list = scope.current
      if (!list) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { reduce } = ctx.conditions as Record<string, boolean>
          if (reduce) return

          revealFrom(
            list,
            { clipPath: "inset(0 0 100% 0)", clearProps: "clipPath" },
            { trigger: list }
          )
        }
      )
    },
    { scope }
  )

  return (
    <dl
      ref={scope}
      className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-4 type-mono text-sm leading-normal [--wdth:90]"
    >
      {stack.map((row) => (
        <React.Fragment key={row.key}>
          <dt className="text-dune">{row.key}</dt>
          <dd className="text-foreground">{row.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  )
}
