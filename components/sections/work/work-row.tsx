"use client"

import * as React from "react"

import { WeaveMark } from "@/components/sections/primitives"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { Project } from "@/content/projects"
import { cn } from "@/lib/utils"

const JOIN = " · "

/** tw-animate delays for the three detail lines, 60ms apart. */
const DETAIL_DELAY = ["delay-0", "delay-[60ms]", "delay-[120ms]"] as const

/**
 * One row of the work list — DESIGN.md §5.4.
 *
 * Trigger, ≥768px:  title | sector | weave-mark | + / −   (one line, baselines aligned)
 * Trigger, <768px:  title
 *                   sector  weave-mark               + / −
 * Panel: three labelled lines (Hard part · Stack · Shipped as).
 *
 * Motion hooks: `data-work-row`, `data-work-title` (--wdth lean),
 * `data-work-mark` (cell sweep), `data-work-meta` (reveal). See work-motion.ts.
 */
export function WorkRow({ project }: { project: Project }) {
  const id = React.useId()
  const titleId = `${id}-title`
  const sectorId = `${id}-sector`
  const markId = `${id}-mark`

  const details = [
    { label: "Hard part", value: project.hardPart, mono: false },
    { label: "Stack", value: project.stack.join(JOIN), mono: true },
    { label: "Shipped as", value: project.shippedAs.join(JOIN), mono: false },
  ]

  return (
    <AccordionItem
      value={project.slug}
      data-work-row
      className="border-b border-(--line) px-(--gutter) transition-colors duration-200 ease-studio hover:bg-row-tint has-focus-visible:bg-row-tint"
    >
      <AccordionTrigger
        aria-labelledby={titleId}
        aria-describedby={`${sectorId} ${markId}`}
        className={cn(
          "grid grid-cols-[auto_minmax(0,1fr)_1.5rem] items-baseline gap-x-4 gap-y-3 py-5",
          "md:grid-cols-[minmax(0,1fr)_5rem_auto_1.5rem] md:py-6",
          "lg:grid-cols-[minmax(0,1fr)_9rem_auto_2rem] lg:gap-x-8",
          // The row is the wrapper of the width-animated title.
          "contain-layout contain-paint",
          // ui/accordion.tsx sets outline-none; keyboard focus is never removed.
          "focus-visible:outline-solid"
        )}
        // A render element's children replace the primitive's, which drops the
        // chevrons ui/accordion.tsx appends. The indicator is typographic.
        render={
          <button>
            <span
              id={titleId}
              data-work-title
              className="col-span-3 row-start-1 block type-h2 wdth-axis md:col-span-1 md:col-start-1 md:whitespace-nowrap"
              style={{ "--wdth": 100 } as React.CSSProperties}
            >
              {project.title}
            </span>
            <span
              id={sectorId}
              data-work-meta
              className="col-start-1 row-start-2 type-small text-muted-foreground md:col-start-2 md:row-start-1"
            >
              {project.sector}
            </span>
            <span
              id={markId}
              data-work-meta
              data-work-mark
              className="col-start-2 row-start-2 self-center justify-self-start md:col-start-3 md:row-start-1"
            >
              <WeaveMark used={project.capabilities} />
            </span>
            <span
              aria-hidden="true"
              data-work-meta
              className="col-start-3 row-start-2 justify-self-end type-h2 md:col-start-4 md:row-start-1"
            >
              <span className="group-aria-expanded/accordion-trigger:hidden">
                +
              </span>
              <span className="hidden group-aria-expanded/accordion-trigger:inline">
                −
              </span>
            </span>
          </button>
        }
      />
      <AccordionContent
        // `ease-studio-in-out` here only makes Tailwind emit the token the
        // panel's inline --tw-ease reads; the panel itself takes no className.
        className="pb-6 ease-studio-in-out md:pb-8"
        // Reaches the Base UI panel: expand/collapse 320ms studioInOut.
        style={
          {
            "--tw-animation-duration": "320ms",
            "--tw-ease": "var(--ease-studio-in-out)",
          } as React.CSSProperties
        }
      >
        <dl className="grid gap-y-4 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-x-4 md:gap-y-2 lg:grid-cols-[9rem_minmax(0,1fr)] lg:gap-x-8">
          {details.map((detail, i) => (
            <div
              key={detail.label}
              className={cn(
                "grid gap-y-1 md:col-span-2 md:grid-cols-subgrid",
                "animate-in duration-[240ms] ease-studio fill-mode-both fade-in slide-in-from-bottom-1 motion-reduce:delay-0",
                DETAIL_DELAY[i]
              )}
            >
              <dt className="type-small text-muted-foreground">
                {detail.label}
              </dt>
              <dd
                className={cn(
                  "max-w-(--measure)",
                  detail.mono ? "type-mono" : "type-body"
                )}
                style={
                  detail.mono
                    ? ({ "--wdth": 90 } as React.CSSProperties)
                    : undefined
                }
              >
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </AccordionContent>
    </AccordionItem>
  )
}
