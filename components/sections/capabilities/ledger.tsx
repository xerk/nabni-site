"use client"

import * as React from "react"

import { WeaveMark } from "@/components/sections/primitives"
import {
  capabilities,
  capabilityIds,
  type Capability,
} from "@/content/capabilities"
import { cn } from "@/lib/utils"

/**
 * The ledger — tool names in mono over one sentence. DESIGN.md §5.3.
 * No numbers, no icons, no cards, no rules: two lines of type.
 */
export function LedgerText({
  capability,
  className,
}: {
  capability: Capability
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="type-mono text-dune">{capability.ledger}</p>
      <p className="type-h3">{capability.line}</p>
    </div>
  )
}

const HIDDEN_LAYER: React.CSSProperties = { opacity: 0, visibility: "hidden" }

/**
 * Column mode: all five ledgers stacked in one grid cell so the block never
 * changes height. The lens crossfades between layers with GSAP (autoAlpha)
 * and toggles aria-hidden. Props stay constant across renders so React
 * never overwrites what the lens wrote.
 */
export function LedgerStack({ className }: { className?: string }) {
  return (
    <div className={cn("grid", className)}>
      {capabilities.map((c, i) => (
        <div
          key={c.id}
          data-ledger-layer={c.id}
          className="col-start-1 row-start-1"
          style={i === 0 ? undefined : HIDDEN_LAYER}
          aria-hidden={i !== 0}
        >
          <LedgerText capability={c} />
        </div>
      ))}
    </div>
  )
}

/**
 * Stacked mode (coarse pointer / <768px / reduced motion): the ledger sits
 * directly under its word. Collapsed rows take no height; the open state is
 * driven by `data-open`, which the lens writes to the DOM.
 */
export function LedgerSlot({
  capability,
  open,
}: {
  capability: Capability
  open: boolean
}) {
  return (
    <div
      data-ledger-slot={capability.id}
      data-open={open ? "true" : "false"}
      className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-[250ms] ease-(--ease-studio) data-[open=false]:invisible data-[open=true]:grid-rows-[1fr] data-[open=true]:opacity-100"
    >
      <div className="min-h-0 overflow-hidden">
        <LedgerText capability={capability} className="pt-3 pb-1" />
      </div>
    </div>
  )
}

/**
 * The weave-mark legend: five cells in the fixed order, then the five words
 * in mono. Introduced here, reused in `work`.
 */
export function Legend({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <WeaveMark
        used={capabilityIds}
        label="Weave-mark legend: one cell per capability, in this order"
      />
      <span className="flex flex-wrap gap-x-3 type-mono text-dune [--wdth:75]">
        {capabilities.map((c) => (
          <span key={c.id}>{c.word}</span>
        ))}
      </span>
    </p>
  )
}
