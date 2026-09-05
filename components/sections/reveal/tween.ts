"use client"

import { gsap } from "@/lib/motion/gsap"

import { revealTrigger, type RevealTriggerVars } from "./trigger"

/** Reveal timing shared by every section: 600ms `studio` (DESIGN.md §6.4). */
export const REVEAL = { duration: 0.6, ease: "studio" } as const

/**
 * `gsap.from` driven by a jump-safe reveal trigger. The start state renders
 * immediately (so nothing flashes at rest before the trigger exists) and the
 * tween plays once, the first time the trigger's start line is reached.
 */
export function revealFrom(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
  trigger: Omit<RevealTriggerVars, "onReveal">
) {
  return gsap.from(targets, {
    ...REVEAL,
    ...vars,
    scrollTrigger: revealTrigger(trigger),
  })
}
