import * as React from "react"

import { GroundWipe } from "@/components/motion/ground-wipe"
import { capabilities, type CapabilityId } from "@/content/capabilities"
import { site } from "@/lib/site.config"
import { cn } from "@/lib/utils"

export type Ground = "night" | "sand"

type SectionProps = React.ComponentProps<"section"> & {
  id: string
  ground: Ground
  /** Sand sections get a scrubbed Night veil that retracts on entry. */
  wipe?: boolean
}

/**
 * Every section root: `id` for nav anchors and ScrollTriggers,
 * `data-ground` so shadcn tokens remap per ground (globals.css). The root is
 * an isolated stacking context so the ground wipe can sit behind its content.
 */
export function Section({
  id,
  ground,
  wipe = ground === "sand",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      data-ground={ground}
      className={cn("relative isolate bg-background text-foreground", className)}
      {...props}
    >
      {wipe ? <GroundWipe /> : null}
      {children}
    </section>
  )
}

/** Small mono uppercase label above a section. */
export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("type-eyebrow text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

/**
 * Weave-mark: five cells in the fixed order WEB MOBILE DESKTOP API AI.
 * Filled cells encode which capabilities a project used. Data, not decoration.
 */
export function WeaveMark({
  used,
  className,
  label,
}: {
  used: readonly CapabilityId[]
  className?: string
  /** Accessible label; defaults to the used capability names. */
  label?: string
}) {
  const names = capabilities
    .filter((c) => used.includes(c.id))
    .map((c) => c.title)
  return (
    <span
      className={cn("weave", className)}
      role="img"
      aria-label={label ?? `Built with: ${names.join(", ")}`}
    >
      {capabilities.map((c) => (
        <span
          key={c.id}
          className="weave-cell"
          data-on={used.includes(c.id) ? "true" : "false"}
          data-capability={c.id}
        />
      ))}
    </span>
  )
}

/**
 * The brand as plain text in both scripts: "Nabni" in the display face and
 * نبني in Reem Kufi, sharing a baseline. Nothing is built on its letterforms.
 */
export function Wordmark({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-baseline gap-2", className)}
      {...props}
    >
      <span className="font-display text-[1.125rem] font-bold [--wdth:110] wdth-axis">
        {site.name}
      </span>
      <span
        className="ar text-[0.95rem] font-semibold text-muted-foreground"
        lang="ar"
        dir="rtl"
        aria-hidden="true"
      >
        {site.nameAr}
      </span>
    </span>
  )
}
