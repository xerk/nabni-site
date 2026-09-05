"use client"

import * as React from "react"

import { Section } from "@/components/sections/primitives"
import {
  maskedLines,
  revealTrigger,
  watchLayout,
} from "@/components/sections/reveal"
import { kingdom } from "@/content/kingdom"
import { gsap, useGSAP } from "@/lib/motion/gsap"

/** Anybody width axis on RIYADH: a spire at rest, a slab once the line has entered. */
const WDTH = { rest: 50, full: 150 } as const
/** Reem Kufi weight on الرياض, moved in sync with the width. Never scaled horizontally. */
const WGHT = { rest: 400, full: 700 } as const

/**
 * KINGDOM — Built here, for here. DESIGN.md §5.6, §6.5.
 *
 * One bilingual line (RIYADH / الرياض facing each other), the prose, and a
 * need → ship mapping. No numerals set large, no tiles, no icons, no map.
 */
export function Kingdom() {
  const root = React.useRef<HTMLElement>(null)
  const lineRef = React.useRef<HTMLHeadingElement>(null)
  const latinRef = React.useRef<HTMLSpanElement>(null)
  const arabicRef = React.useRef<HTMLSpanElement>(null)
  const tableRef = React.useRef<HTMLTableElement>(null)

  useGSAP(
    () => {
      const line = lineRef.current
      const latin = latinRef.current
      const arabic = arabicRef.current
      const table = tableRef.current
      if (!line || !latin || !arabic || !table) return

      const mm = gsap.matchMedia()
      mm.add(
        {
          fine: "(pointer: fine)",
          coarse: "(pointer: coarse)",
          reduce: "(prefers-reduced-motion: reduce)",
          // Always matches, so a device with neither pointer type still runs this.
          any: "all",
        },
        (ctx) => {
          const { fine, reduce } = ctx.conditions as Record<string, boolean>

          if (reduce) {
            // Static at full width and weight; the mapping is visible as rendered.
            gsap.set(latin, { "--wdth": WDTH.full })
            gsap.set(arabic, { fontWeight: WGHT.full })
            return
          }

          // Bilingual line: scrubbed over 60vh as it enters on fine pointers,
          // one time-based beat on enter everywhere else. Width and weight move together.
          const grow = gsap.timeline({
            defaults: fine
              ? { ease: "none" }
              : { duration: 1.1, ease: "studio" },
            scrollTrigger: fine
              ? {
                  trigger: line,
                  start: "top bottom",
                  end: "top 40%",
                  scrub: true,
                }
              : revealTrigger({ trigger: line }),
          })
          grow
            .fromTo(latin, { "--wdth": WDTH.rest }, { "--wdth": WDTH.full }, 0)
            .fromTo(
              arabic,
              { fontWeight: WGHT.rest },
              { fontWeight: WGHT.full },
              0
            )

          // Mapping rows reveal once with masked lines; one split across every
          // cell so the 40ms stagger runs down the rows in reading order.
          // Lines keep their text nodes, so no aria-label/aria-hidden rewrite
          // is needed (it would leave a nameless div as the cell's only content).
          const cells = gsap.utils.toArray<HTMLElement>("[data-split]", table)
          maskedLines(cells, { trigger: table, aria: "none" })
        }
      )

      return watchLayout()
    },
    { scope: root }
  )

  return (
    <Section
      id="kingdom"
      ground="night"
      className="gutter section-pad"
      ref={root}
    >
      {/* Bilingual line: Latin at the start edge, Arabic at the end edge, facing each other. */}
      <h2
        ref={lineRef}
        className="flex flex-col items-start gap-y-2 contain-layout [--riyadh:15vw] md:flex-row md:items-baseline md:justify-between md:gap-x-8 md:[--riyadh:10vw]"
      >
        <span
          ref={latinRef}
          className="shrink-0 font-display text-(length:--riyadh) leading-[0.9] font-bold tracking-[-0.02em] whitespace-nowrap [--wdth:50] wdth-axis motion-reduce:[--wdth:150]"
        >
          {kingdom.latin}
        </span>
        <span
          ref={arabicRef}
          className="ar shrink-0 self-end text-[length:calc(var(--riyadh)*0.85)] leading-[1.15] font-normal tracking-normal whitespace-nowrap motion-reduce:font-bold md:self-auto"
          dir="rtl"
          lang="ar"
        >
          {kingdom.arabic}
        </span>
      </h2>

      <div className="mt-12 grid-12 md:mt-16">
        <p className="col-span-12 measure type-body md:col-span-6">
          {kingdom.prose}
        </p>
      </div>

      {/*
        Need → ship mapping. Two named columns with per-cell header association is
        tabular data, so a <table>. Rows are laid out with grid (pairs stack below
        768px), which strips the implicit table roles, hence the explicit ones.
        Cells stay plain blocks (no subgrid): Chromium drops the baseline shim
        from row sizing when a subgridded item is baseline-aligned, which clips
        multi-line cells. The need → ship arrow rides the end edge of the need
        cell as a short 1px rule in the current colour: "→" is outside Martian
        Mono's latin subset and would fall back to the system mono face.
      */}
      <table
        ref={tableRef}
        role="table"
        className="mt-16 block w-full md:mt-24"
      >
        <thead role="rowgroup" className="block">
          <tr
            role="row"
            className="grid grid-cols-1 gap-y-1 contain-layout md:grid-12 md:items-baseline"
          >
            <th
              role="columnheader"
              scope="col"
              className="text-start type-eyebrow text-muted-foreground md:col-span-6 md:flex md:items-baseline md:justify-between md:gap-x-8"
            >
              <span>{kingdom.needsHeading}</span>
              <span
                aria-hidden="true"
                className="hidden w-5 shrink-0 self-center border-t border-current md:block"
              />
            </th>
            <th
              role="columnheader"
              scope="col"
              className="text-start type-eyebrow text-muted-foreground md:col-span-6"
            >
              {kingdom.shipsHeading}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="mt-6 grid gap-y-8 md:gap-y-6">
          {kingdom.mapping.map((row) => (
            <tr
              key={row.need}
              role="row"
              className="grid grid-cols-1 gap-y-1 contain-layout contain-paint md:grid-12 md:items-baseline"
            >
              <td
                role="cell"
                className="md:col-span-6 md:flex md:items-baseline md:justify-between md:gap-x-8"
              >
                <div data-split className="type-body text-foreground">
                  {row.need}
                </div>
                <span
                  aria-hidden="true"
                  className="hidden w-5 shrink-0 self-center border-t border-current text-dune md:block"
                />
              </td>
              <td role="cell" className="md:col-span-6">
                <div data-split className="type-mono text-dune">
                  {row.ship}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}
