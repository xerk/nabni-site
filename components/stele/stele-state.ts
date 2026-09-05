"use client"

/**
 * THE STELE — shared state and command API.
 *
 * This module is the contract between the page sections and the WebGL
 * stone. Sections never touch three.js; they call `stele.*` commands and
 * render anchor <div>s. The canvas (`stele-canvas.tsx`) registers a driver
 * that executes the commands and writes back `raised`, `total`, `az`, `el`.
 *
 * Nothing here is React state on the hot path: `steleState` is a mutable
 * object read by the render loop. React consumers use `useSteleSnapshot()`,
 * which re-renders at most ~10 times per second while the stone animates.
 */

import { useSyncExternalStore } from "react"

export type SteleTier = "A" | "B"
export type SteleAnchorName = "hero" | "capabilities" | "contact"
export type LightMode = "pointer" | "scroll" | "fixed"
export type Script = "latin" | "arabic"

export type Rect = { x: number; y: number; width: number; height: number }

export type CarveOptions = {
  /** Seconds. Default 1.1 (hero), 0.6 (capabilities). */
  duration?: number
  /** Ripple direction. "auto" = LTR for Latin, RTL for Arabic. */
  direction?: "ltr" | "rtl" | "auto"
  /** Skip the tween (reduced motion). */
  instant?: boolean
}

export interface SteleState {
  /** Render loop and wrapper visibility. False between capabilities and contact. */
  active: boolean
  /** Canvas mounted and first frame drawn (SVG placeholder can hide). */
  ready: boolean
  tier: SteleTier
  /** Which DOM anchor the slab is placed on (fine pointers). */
  anchor: SteleAnchorName
  /** Explicit viewport rect override; used while the hero pin moves the slab. */
  anchorOverride: Rect | null
  /** Word currently carved (or being carved into). */
  word: string
  script: Script
  /** The visitor's typed brief, if any. Mirrored to sessionStorage. */
  brief: string | null
  /** Light angles in degrees. `az` 0 = from the camera, +right. `el` 90 = noon. */
  az: number
  el: number
  targetAz: number
  targetEl: number
  lightMode: LightMode
  /** Relief depth in world units. 0.035 at rest, 0.012 at noon. */
  depth: number
  /** Slab yaw in radians (hero opens at 18°, settles at 0). */
  yaw: number
  /** Wrapper opacity 0..1. */
  opacity: number
  /** Carve progress 0..1 (driver-owned). */
  mix: number
  /** Readout numbers (driver-owned). */
  raised: number
  total: number
  /** Normalised pointer position 0..1 (fine pointers). */
  pointer: { x: number; y: number }
}

export const STELE_DEFAULT_WORD = "نبني"
export const STELE_BRIEF_KEY = "stele:brief"
export const STELE_WORDS = {
  scroll: "WE BUILD",
  capabilities: {
    web: "WEB",
    mobile: "MOBILE",
    desktop: "DESKTOP",
    api: "API",
    ai: "AI",
  },
} as const

export const STELE_LIGHT = {
  /** Hero at rest, before the pointer moves. */
  heroStart: { az: -35, el: 22 },
  /** Contact section, fixed first light. */
  contact: { az: -35, el: 22 },
  /** End of capabilities. */
  noon: { el: 82 },
  /** Coarse pointer scroll binding across the hero block. */
  coarse: { from: { az: -70, el: 12 }, to: { az: 0, el: 40 } },
} as const

export const STELE_DEPTH = { rest: 0.035, noon: 0.012 } as const

export const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/

export function detectScript(text: string): Script {
  return ARABIC_RE.test(text) ? "arabic" : "latin"
}

function defaults(): SteleState {
  return {
    active: true,
    ready: false,
    tier: "A",
    anchor: "hero",
    anchorOverride: null,
    word: STELE_DEFAULT_WORD,
    script: "arabic",
    brief: null,
    az: STELE_LIGHT.heroStart.az,
    el: STELE_LIGHT.heroStart.el,
    targetAz: STELE_LIGHT.heroStart.az,
    targetEl: STELE_LIGHT.heroStart.el,
    lightMode: "pointer",
    depth: STELE_DEPTH.rest,
    yaw: (18 * Math.PI) / 180,
    opacity: 1,
    mix: 0,
    raised: 0,
    total: 0,
    pointer: { x: 0.5, y: 0.5 },
  }
}

export const steleState: SteleState = defaults()

export interface SteleDriver {
  carve(text: string, opts: CarveOptions): void
  /** Jump any in-progress carve (including the load ripple) to its end. */
  finishCarve(): void
  /** Request a frame (demand frameloop). */
  invalidate(): void
}

type Listener = () => void
const listeners = new Set<Listener>()
let version = 0
let driver: SteleDriver | null = null
let pendingCarve: { text: string; opts: CarveOptions } | null = null

function bump() {
  version++
  for (const l of listeners) l()
}

export const stele = {
  state: steleState,

  /** Subscribe to coarse-grained changes (readout, React consumers). */
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /**
   * Called by the driver (throttled, ~10Hz during tweens) and by commands
   * that React consumers should see (word, active, tier, ready).
   */
  notify() {
    bump()
  },

  /** The canvas registers itself here. Replays a carve requested before mount. */
  registerDriver(next: SteleDriver | null) {
    driver = next
    if (next && pendingCarve) {
      const { text, opts } = pendingCarve
      pendingCarve = null
      next.carve(text, opts)
    }
  },

  /** Carve a word or brief into the stone. Safe to call before the canvas mounts. */
  carve(text: string, opts: CarveOptions = {}) {
    const clean = text.trim()
    if (!clean) return
    steleState.word = clean
    steleState.script = detectScript(clean)
    if (driver) driver.carve(clean, opts)
    else pendingCarve = { text: clean, opts }
    bump()
  },

  /** Early-scroll rule: nothing is ever half-carved. */
  finishCarve() {
    driver?.finishCarve()
  },

  /** Remember the visitor's brief for the contact form. Pass null to clear. */
  setBrief(text: string | null) {
    const clean = text?.trim() || null
    steleState.brief = clean
    try {
      if (clean) sessionStorage.setItem(STELE_BRIEF_KEY, clean)
      else sessionStorage.removeItem(STELE_BRIEF_KEY)
    } catch {
      // Storage may be unavailable (private mode); the state still holds it.
    }
    bump()
  },

  /** Read the brief back (contact form prefill). */
  getBrief(): string | null {
    if (steleState.brief) return steleState.brief
    try {
      return sessionStorage.getItem(STELE_BRIEF_KEY)
    } catch {
      return null
    }
  },

  /** Choose which anchor element the slab sits on (fine pointers). */
  setAnchor(name: SteleAnchorName) {
    if (steleState.anchor === name && !steleState.anchorOverride) return
    steleState.anchor = name
    steleState.anchorOverride = null
    driver?.invalidate()
    bump()
  },

  /** Explicit viewport rect (px) while a timeline moves the slab; null to release. */
  setAnchorOverride(rect: Rect | null) {
    steleState.anchorOverride = rect
    driver?.invalidate()
  },

  setLight(light: {
    az?: number
    el?: number
    mode?: LightMode
    immediate?: boolean
  }) {
    if (light.mode) steleState.lightMode = light.mode
    if (typeof light.az === "number") steleState.targetAz = light.az
    if (typeof light.el === "number") steleState.targetEl = light.el
    if (light.immediate) {
      steleState.az = steleState.targetAz
      steleState.el = steleState.targetEl
    }
    driver?.invalidate()
  },

  /** Normalised pointer position; the cursor component writes this. */
  setPointer(x: number, y: number) {
    steleState.pointer.x = x
    steleState.pointer.y = y
    if (steleState.lightMode === "pointer") {
      steleState.targetAz = (x - 0.5) * 140
      steleState.targetEl = 12 + (1 - y) * 30
      driver?.invalidate()
    }
  },

  setActive(active: boolean) {
    if (steleState.active === active) return
    steleState.active = active
    driver?.invalidate()
    bump()
  },

  /** Tweenable scalars. GSAP can also tween `stele.state` directly and call `stele.invalidate()` onUpdate. */
  set(partial: Partial<Pick<SteleState, "depth" | "yaw" | "opacity">>) {
    Object.assign(steleState, partial)
    driver?.invalidate()
  },

  setTier(tier: SteleTier) {
    if (steleState.tier === tier) return
    steleState.tier = tier
    bump()
  },

  setReady(ready: boolean) {
    steleState.ready = ready
    bump()
  },

  invalidate() {
    driver?.invalidate()
  },
}

/** React hook: re-renders on `stele.notify()`. Returns the live (mutable) state. */
export function useSteleSnapshot(): SteleState {
  useSyncExternalStore(
    stele.subscribe,
    () => version,
    () => 0
  )
  return steleState
}

/** Format the readout line: `{word} · {raised}/{total} cells · light {az}° {el}°` */
export function formatReadout(state: SteleState, locale = "en-US"): string {
  const nf = new Intl.NumberFormat(locale)
  if (!state.ready || state.total === 0) return state.word
  return `${state.word} · ${nf.format(state.raised)} glyphs · ${nf.format(state.total)} tris · light ${Math.round(state.az)}° ${Math.round(state.el)}°`
}
