"use client"

import * as React from "react"

import { revealTrigger } from "@/components/sections/reveal"
import { process as steps } from "@/content/process"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion/gsap"
import { cn } from "@/lib/utils"

/** Marker is a 6px cell; the line runs through its centre. */
const MARKER_CENTRE = 3
/** Vertical list: marker sits 6px down to centre on the first 13px text row. */
const MARKER_TOP_VERTICAL = 6

/**
 * The run: five real steps joined by one SVG line (DESIGN.md §5.5, §6.4).
 * Horizontal at ≥1024px, a vertical list below with the line along the
 * start edge. Line drawn with DrawSVG on enter (800ms), then labels rise
 * 8px 80ms apart. Hover/focus/tap shows a step's description (200ms
 * opacity); the first step is shown by default so the area is never empty.
 */
export function Run() {
  const scope = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(steps[0].step)
  const id = React.useId()

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const list = root.querySelector<HTMLOListElement>("[data-run-list]")
      const line = root.querySelector<SVGLineElement>("[data-run-line]")
      if (!list || !line) return

      // One line, pixel endpoints: DrawSVG measures a <line> from its
      // attributes, so percentages are not an option. Reads are batched.
      const measure = () => {
        const style = getComputedStyle(list)
        const horizontal = style.display === "grid"
        const rtl = style.direction === "rtl"
        const width = list.offsetWidth
        const height = list.offsetHeight
        if (horizontal) {
          const x1 = rtl ? width - MARKER_CENTRE : MARKER_CENTRE
          const x2 = rtl ? 0 : width
          line.setAttribute("x1", String(x1))
          line.setAttribute("y1", String(MARKER_CENTRE))
          line.setAttribute("x2", String(x2))
          line.setAttribute("y2", String(MARKER_CENTRE))
        } else {
          const x = rtl ? width - MARKER_CENTRE : MARKER_CENTRE
          line.setAttribute("x1", String(x))
          line.setAttribute("y1", String(MARKER_TOP_VERTICAL + MARKER_CENTRE))
          line.setAttribute("x2", String(x))
          line.setAttribute("y2", String(height))
        }
      }
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(list)

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

          const labels = gsap.utils.toArray<HTMLElement>(
            "[data-run-label]",
            list
          )
          gsap.set(line, { drawSVG: 0 })
          gsap.set(labels, { autoAlpha: 0, y: 8 })

          ScrollTrigger.create(
            revealTrigger({
              trigger: list,
              // Built on reveal so DrawSVG measures the line as it is now.
              onReveal: () =>
                ctx.add(() => {
                  gsap
                    .timeline({ defaults: { ease: "studio" } })
                    .to(line, {
                      drawSVG: "100%",
                      duration: 0.8,
                      onComplete: () =>
                        gsap.set(line, {
                          clearProps: "strokeDasharray,strokeDashoffset",
                        }),
                    })
                    .to(
                      labels,
                      {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.6,
                        stagger: 0.08,
                        clearProps: "opacity,visibility,transform",
                      },
                      "-=0.25"
                    )
                }),
            })
          )
        }
      )

      return () => observer.disconnect()
    },
    { scope }
  )

  return (
    <div ref={scope} className="flex flex-col gap-6">
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <line
            data-run-line
            className="stroke-(--line)"
            strokeWidth="1"
            shapeRendering="crispEdges"
          />
        </svg>

        <ol
          data-run-list
          role="list"
          className="flex flex-col gap-5 lg:grid lg:grid-cols-5 lg:gap-x-3"
        >
          {steps.map((step) => {
            const expanded = step.step === active
            const descriptionId = `${id}-step-${step.step}`
            return (
              <li key={step.step}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={descriptionId}
                  className="flex w-full items-start gap-4 text-start lg:flex-col lg:gap-3"
                  onPointerEnter={() => setActive(step.step)}
                  onFocus={() => setActive(step.step)}
                  onClick={() => setActive(step.step)}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-cell border border-border transition-colors duration-200 ease-(--ease-studio) lg:mt-0",
                      expanded && "border-foreground bg-foreground"
                    )}
                  />
                  <span
                    data-run-label
                    className="flex min-w-0 flex-col gap-0.5"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="type-small text-dune">{step.step}</span>
                      <span
                        className={cn(
                          "type-small transition-colors duration-200 ease-(--ease-studio)",
                          expanded ? "text-foreground" : "text-dune"
                        )}
                      >
                        {step.title}
                      </span>
                    </span>
                    <span className="type-small text-dune">
                      {step.duration}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {/* All five stacked in one grid cell: the area reserves the tallest
          description, so switching never shifts the statement below. */}
      <div className="grid">
        {steps.map((step) => {
          const expanded = step.step === active
          return (
            <p
              key={step.step}
              id={`${id}-step-${step.step}`}
              aria-hidden={!expanded}
              data-active={expanded}
              className="col-start-1 row-start-1 type-body opacity-0 transition-opacity duration-200 ease-(--ease-studio) data-[active=true]:opacity-100"
            >
              {step.description}
            </p>
          )
        })}
      </div>
    </div>
  )
}
