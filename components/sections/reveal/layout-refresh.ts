"use client"

import { ScrollTrigger } from "@/lib/motion/gsap"

/** Long enough to coalesce a burst of layout writes, short enough that a jump straight after still lands on fresh positions. */
const DEBOUNCE_MS = 120

let users = 0
let observer: ResizeObserver | null = null
let timer = 0
let refreshing = false
/** Document height at the end of the last ScrollTrigger refresh. */
let measured = 0

const scrollHeight = () => document.documentElement.scrollHeight

const onRefreshInit = () => {
  refreshing = true
}
const onRefresh = () => {
  refreshing = false
  measured = scrollHeight()
}

const check = () => {
  timer = 0
  // A refresh reverts and re-applies pin spacers, which resizes the body on
  // its own; only a height that differs from the last refreshed one counts.
  if (refreshing || scrollHeight() === measured) return
  ScrollTrigger.refresh()
}

const schedule = () => {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(check, DEBOUNCE_MS)
}

/**
 * Keeps ScrollTrigger positions fresh when the page changes height without
 * a viewport resize: an accordion opening, a SplitText re-split after a font
 * swap, a reveal that restores its markup. ScrollTrigger only refreshes on
 * its own for resize/load and (lib/motion/gsap.ts) once when fonts are ready;
 * any later height change would leave every start below it stale, and a
 * once-only reveal reached by an instant jump would then never fire.
 *
 * One observer shared by every caller; returns a release function.
 */
export function watchLayout(): () => void {
  if (users++ === 0) {
    measured = scrollHeight()
    ScrollTrigger.addEventListener("refreshInit", onRefreshInit)
    ScrollTrigger.addEventListener("refresh", onRefresh)
    observer = new ResizeObserver(schedule)
    observer.observe(document.body)
  }
  return () => {
    if (--users > 0) return
    if (timer) window.clearTimeout(timer)
    timer = 0
    ScrollTrigger.removeEventListener("refreshInit", onRefreshInit)
    ScrollTrigger.removeEventListener("refresh", onRefresh)
    observer?.disconnect()
    observer = null
  }
}
