"use client"

/**
 * HERO — The Stele. DESIGN.md §5.2.
 *
 * One monumental sentence, one carved stone, one question that makes the
 * claim testable, and the engineering visible before the fold.
 *
 * One DOM for both layouts. Desktop (≥1024) is a 12-column grid: H1 in
 * cols 1–7 row 1, copy in cols 1–7 row 2, the stone in cols 8–12 spanning
 * both rows. Below that, and on coarse pointers, the same nodes stack in
 * DOM order: H1, stone block, readout, sub, question, input, Cast it, tool
 * line, CTA. No text ever overlaps the anchor box.
 */

import * as React from "react"

import { useLenis } from "@/components/providers/smooth-scroll"
import { Section } from "@/components/sections/primitives"
import { SteleAnchor, SteleReadout } from "@/components/stele/stele"
import { Button } from "@/components/ui/button"
import { heroToolLine } from "@/content/stack"

import { HeroInput } from "./hero/hero-input"
import { useHeroMotion } from "./hero/use-hero-motion"

const copy = {
  h1: "Bring us the hard one.",
  sub: "In-house engineers in Riyadh who ship web, mobile, desktop and AI systems for founders, enterprises and government programs.",
  stone:
    "A carved stone reading 'we build' in Arabic; it re-carves to whatever you type above.",
  cta: "Book a build call",
} as const

export function Hero() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const { scrollTo } = useLenis()
  useHeroMotion(sectionRef)

  return (
    <Section
      ref={sectionRef}
      id="hero"
      ground="night"
      className="flex min-h-svh flex-col gap-y-6 gutter pt-[calc(var(--nav-h)+14vh)] pb-(--section-pad) lg:grid-12 lg:grid-rows-[auto_auto] lg:content-start lg:pb-0"
    >
      {/*
        The H1 is sized to its own column (cqi) so "Bring us / the hard / one."
        is always three lines that fill cols 1–7, and capped by viewport height
        so the pinned hero fits the fold. Each line lives in its own clipped,
        contained wrapper (SplitText mask). Anybody's ink overflows a 0.9
        line box by ~0.07em top and bottom, so each mask is an inline-block
        (margins never collapse) with 0.1em block padding cancelled by a
        negative margin: clip room without changing the line pitch. Width
        changes never reflow anything below. The last term of the size cap
        is the fold budget on short viewports: nav + 14vh above, ~300px of
        fixed chrome (sub, question, input row, tool line, CTA) below three
        0.9-line-height H1 lines, so the pinned hero fits 1280×720 too.
      */}
      <div className="@container lg:col-span-7 lg:row-start-1">
        <h1
          data-hero-h1
          className="type-display-xl [font-size:max(2.75rem,min(16.5cqi,10.5rem,14.5vh,32vh_-_134px))] text-wrap [--wdth:105] wdth-axis motion-safe:opacity-0 lg:will-change-transform lg:[--wdth:118] [&_.hero-line]:whitespace-nowrap [&_.hero-line]:will-change-transform [&_.hero-line]:wdth-axis [&_.hero-line-mask]:-my-[0.1em] [&_.hero-line-mask]:inline-block! [&_.hero-line-mask]:w-full [&_.hero-line-mask]:py-[0.1em] [&_.hero-line-mask]:align-top [&_.hero-line-mask]:contain-layout [&_.hero-line-mask]:contain-paint"
        >
          {copy.h1}
        </h1>
      </div>

      {/* The stone: an empty anchor the slab is placed onto, plus its readout. */}
      <div
        data-hero-stone
        className="flex w-full flex-col lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:ms-auto lg:w-[calc(62vh*2/3)] lg:self-start"
      >
        <SteleAnchor name="hero" className="h-[42svh] w-full lg:h-[62vh]" />
        <p className="sr-only">{copy.stone}</p>
        {/*
          One line, end-aligned to the stone on desktop: the box is 62vh × 2/3
          wide, and on short viewports (1280×720) the line is wider than the
          box, so it grows towards the empty gutter side, never past the
          viewport edge and never over the copy in cols 1–7. The pin moves
          this wrapper with the slab (use-hero-motion).
        */}
        <div data-hero-readout className="lg:w-max lg:self-end">
          <SteleReadout className="mt-3 lg:text-[0.75rem]" />
        </div>
      </div>

      <div className="flex flex-col lg:col-span-7 lg:row-start-2">
        <p data-hero-fade className="measure type-body motion-safe:opacity-0">
          {copy.sub}
        </p>

        <HeroInput className="mt-6" />

        <p
          data-hero-fade
          className="mt-3 type-mono text-dune motion-safe:opacity-0"
        >
          {heroToolLine}
        </p>

        <div data-hero-fade className="mt-6 motion-safe:opacity-0">
          <Button variant="sun" onClick={() => scrollTo("#contact")}>
            {copy.cta}
          </Button>
        </div>
      </div>
    </Section>
  )
}
