"use client"

/**
 * Placement (DESIGN.md §4.6): DOM rects → the z = 0 plane of a fixed
 * PerspectiveCamera (fov 28 at z 4.85). Pure math on reusable objects; no
 * allocation on the hot path.
 */

import { SLAB, VISIBLE_HEIGHT } from "@/lib/stele/grid"

/** Key light at full strength; see `LIGHT_SCALE` in stele-scene.tsx. */
export const KEY_LIGHT_INTENSITY = 2.2 * Math.PI

import { STELE_LIGHT, type Rect } from "./stele-state"
import type { SteleZone } from "./stele-zones"

export type PlacementTarget = { x: number; y: number; scale: number }

/**
 * Fit the portrait 1.0 × 1.5 slab inside a viewport rect (px). Origin at the
 * viewport centre, y up; `worldPerPx = visibleHeight / innerHeight`.
 */
export function rectToWorld(
  rect: Rect,
  vw: number,
  vh: number,
  out: PlacementTarget
): PlacementTarget {
  const worldPerPx = VISIBLE_HEIGHT / vh
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  out.x = (cx - vw / 2) * worldPerPx
  out.y = (vh / 2 - cy) * worldPerPx
  const pxPerUnit = vh / VISIBLE_HEIGHT
  out.scale = Math.min(
    rect.height / (SLAB.height * pxPerUnit),
    rect.width / (SLAB.width * pxPerUnit)
  )
  return out
}

/** Fallback when no anchor element exists yet: 62vh tall, 2:3, in the right column. */
export function defaultHeroRect(vw: number, vh: number, out: Rect): Rect {
  const height = Math.min(vh * 0.62, vw * 0.5)
  const width = height * (SLAB.width / SLAB.height)
  out.width = width
  out.height = height
  out.x = vw * 0.78 - width / 2
  out.y = (vh - height) / 2
  return out
}

/**
 * Coarse-pointer in-flow framing (§4.6 "Coarse pointer hero"): the slab is
 * scaled to the block's height × 1.35, centred horizontally and vertically,
 * and the block clips the rest. Every mask (the committed words and any
 * rasterised brief) centres its block on the face, so the carved band sits
 * inside the block with even margins: at 1.35× the block shows the middle
 * 74% of the face, and the words span 31–69% (نبني) / 40–60% (WE BUILD).
 * The SVG placeholder in stele.tsx uses the same framing
 * (`h-[135%] w-[92%]`, centred, `xMidYMid meet`).
 */
export const INFLOW_SCALE_FACTOR = 1.35

/** Horizontal margin kept when a portrait block would otherwise clip the slab's sides. */
export const INFLOW_MAX_WIDTH = 0.92

export function inflowPlacement(
  out: PlacementTarget,
  aspect = 16 / 9
): PlacementTarget {
  const bandScale = (INFLOW_SCALE_FACTOR * VISIBLE_HEIGHT) / SLAB.height
  const visibleWidth = VISIBLE_HEIGHT * aspect
  const fitScale = (visibleWidth * INFLOW_MAX_WIDTH) / SLAB.width
  out.x = 0
  out.y = 0
  out.scale = Math.min(bandScale, fitScale)
  return out
}

export type MountKind = "stage" | "hero" | "contact"

/**
 * Everything a scene mount reads in `useFrame` that the DOM side writes:
 * the placement target, the light rig and the load-rise state. One instance
 * per canvas; the fixed stage mirrors the shared `stele.state` light.
 */
export class MountController {
  readonly kind: MountKind
  readonly target: PlacementTarget = { x: 0, y: 0, scale: 1 }
  /**
   * `performance.now()` at construction: the load sequence (§6.1 light rise,
   * ripple) is timed from mount, not from the first frame, so a slow GPU
   * does not push it seconds late.
   */
  readonly mountedAt: number = performance.now()
  /** Current and target light angles (degrees). */
  az: number = STELE_LIGHT.heroStart.az
  el: number = STELE_LIGHT.heroStart.el
  targetAz: number = STELE_LIGHT.heroStart.az
  targetEl: number = STELE_LIGHT.heroStart.el
  intensity: number = KEY_LIGHT_INTENSITY
  /** Load sequence light rise (§6.1); tweened by the stage wrapper. */
  rise: { active: boolean; el: number; intensity: number } = {
    active: false,
    el: -10,
    intensity: 0,
  }
  /** Coarse hero: touch-drag nudge on azimuth, decays over 800ms. */
  nudge: number = 0
  /** Writes az/el into `stele.state` for the readout while true. */
  primary = true
  /**
   * Stage only: the zone derived by the DOM side (stele-zones.ts). The frame
   * step enforces the zone's invariants (contact light, rest depth, no yaw,
   * no hero override) against section writes that land after the scroll
   * callback.
   */
  zone: SteleZone = "hero"
  firstFrameDone = false
  /** Stage wrapper element; its opacity follows `stele.state.opacity` per frame. */
  wrapper: HTMLElement | null = null
  /** Last opacity written to the wrapper (shared by the frame step and the DOM side). */
  wrapperOpacity = -1

  /** Load rise (§6.1) starts below the left horizon, unlit. */
  beginRise() {
    this.rise.active = true
    this.rise.el = -10
    this.rise.intensity = 0
  }

  endRise(az: number, el: number) {
    this.rise.active = false
    this.az = az
    this.el = el
  }

  /** Attach the wrapper; `opacity` is the value its crossfade is heading to. */
  setWrapper(el: HTMLElement | null, opacity: number) {
    this.wrapper = el
    this.wrapperOpacity = opacity
  }

  /** Write the wrapper opacity once per distinct value; safe with no frame running. */
  applyOpacity(opacity: number) {
    if (!this.wrapper || opacity === this.wrapperOpacity) return
    this.wrapperOpacity = opacity
    this.wrapper.style.opacity = String(opacity)
  }

  setPrimary(primary: boolean) {
    this.primary = primary
  }

  setZone(zone: SteleZone) {
    this.zone = zone
  }

  setNudge(nudge: number) {
    this.nudge = nudge
  }

  setTargets(az: number, el: number) {
    this.targetAz = az
    this.targetEl = el
  }

  /** In-flow mounts: refit the slab to the block's aspect on resize. */
  setInflowBox(width: number, height: number) {
    if (width > 0 && height > 0) inflowPlacement(this.target, width / height)
  }

  constructor(kind: MountKind) {
    this.kind = kind
    if (kind !== "stage") {
      inflowPlacement(this.target)
      if (kind === "hero") {
        this.az = STELE_LIGHT.coarse.from.az
        this.el = STELE_LIGHT.coarse.from.el
        this.targetAz = this.az
        this.targetEl = this.el
      } else {
        this.az = STELE_LIGHT.contact.az
        this.el = STELE_LIGHT.contact.el
        this.targetAz = this.az
        this.targetEl = this.el
      }
    }
  }
}
