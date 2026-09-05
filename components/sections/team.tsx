"use client"

import * as React from "react"

import { Eyebrow, Section } from "@/components/sections/primitives"
import { maskedLines, watchLayout } from "@/components/sections/reveal"
import { team } from "@/content/team"
import { gsap, useGSAP } from "@/lib/motion/gsap"

import { Manifest } from "./team/manifest"
import { Run } from "./team/run"

const DISPLAY = "ONE TEAM FROM SCOPE TO SHIP"
const BODY =
  "In-house engineers in Riyadh. The people who scope your build are the people who ship it, and they stay on for the run."
const STATEMENT = "You own the code, the infra and the docs from day one."

/** Roles only; `count` and `teamFacts.founded` are never rendered (DESIGN.md §0.7). */
const ROLES = team.map((member) => member.role).join(" · ")

/**
 * The bench (DESIGN.md §5.5): who builds this, without inventing people.
 * Cols 1–6: display line, body, roles, the run, the ownership statement.
 * Cols 7–12: the manifest. Stacked below 768px.
 */
export function Team() {
  const scope = React.useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const heading = scope.current?.querySelector<HTMLElement>(
        "[data-team-display]"
      )
      if (!heading) return

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

          maskedLines(heading, { trigger: heading })
        }
      )

      return watchLayout()
    },
    { scope }
  )

  return (
    <Section ref={scope} id="team" ground="night" className="gutter section-pad">
      <div className="flex flex-col gap-16 md:grid-12">
        <div className="flex flex-col gap-14 md:col-span-6">
          <div className="flex flex-col gap-8">
            <h2 data-team-display className="type-display contain-layout">
              {DISPLAY}
            </h2>
            <div className="flex flex-col gap-4">
              <p className="measure type-body">{BODY}</p>
              <p className="type-mono text-dune [--wdth:90]">{ROLES}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Eyebrow className="[--wdth:90]">The run</Eyebrow>
            <Run />
          </div>

          <p className="measure type-h3">{STATEMENT}</p>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <Manifest />
        </div>
      </div>
    </Section>
  )
}
