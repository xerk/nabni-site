"use client"

import * as React from "react"

import { Eyebrow, Section } from "@/components/sections/primitives"
import { watchLayout } from "@/components/sections/reveal"
import { mountWorkMotion } from "@/components/sections/work/work-motion"
import { WorkRow } from "@/components/sections/work/work-row"
import { Accordion } from "@/components/ui/accordion"
import { projects } from "@/content/projects"
import { useGSAP } from "@/lib/motion/gsap"

const EYEBROW = "Project types. No client names."
const HEADING = "What we've built"

/**
 * WORK — What we've built. First Limestone inversion (DESIGN.md §5.4).
 * A ruled list: the accordion edges are the only rules on the page, run
 * full-bleed with the row tint while the type stays on the gutter line.
 */
export function Work() {
  const ref = React.useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current) return
      mountWorkMotion(ref.current)
      return watchLayout()
    },
    { scope: ref }
  )

  return (
    <Section
      ref={ref}
      id="work"
      ground="sand"
      className="gutter section-pad"
    >
      <div className="flex flex-col gap-4">
        <Eyebrow
          data-work-eyebrow
          style={{ "--wdth": 90 } as React.CSSProperties}
        >
          {EYEBROW}
        </Eyebrow>
        <h2
          data-work-heading
          className="type-display wdth-axis"
          style={{ "--wdth": 100 } as React.CSSProperties}
        >
          {HEADING}
        </h2>
      </div>

      <Accordion
        multiple
        data-work-list
        className="-mx-(--gutter) mt-12 w-auto border-t border-(--line) md:mt-16"
      >
        {projects.map((project) => (
          <WorkRow key={project.slug} project={project} />
        ))}
      </Accordion>
    </Section>
  )
}
