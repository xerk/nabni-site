/**
 * Once-only reveals that survive instant jumps (DESIGN.md §6.4).
 *
 *   revealTrigger  ScrollTrigger vars: fires on enter, on creation when
 *                  already past, and on any refresh that finds it passed.
 *   revealFrom     `gsap.from` on such a trigger (8px rise, wipe, ...).
 *   maskedLines    SplitText masked line reveal with clip room in every mask.
 *   watchLayout    keeps ScrollTrigger positions fresh when the page changes
 *                  height without a resize.
 */
export { REVEAL_START, revealTrigger, type RevealTriggerVars } from "./trigger"
export { REVEAL, revealFrom } from "./tween"
export { maskedLines, type MaskedLinesOptions } from "./masked-lines"
export { watchLayout } from "./layout-refresh"
