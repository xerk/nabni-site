"use client"

import * as THREE from "three"

/**
 * Single source of colour (DESIGN.md §2.4 / v2 addendum): CSS defines every
 * hex; WebGL reads the computed custom properties once at mount. Nothing can
 * drift.
 */
export type Palette = {
  /** Page ground: warm obsidian. */
  night: THREE.Color
  /** Foreground on night; ground of the inverted sections. */
  sand: THREE.Color
  /** Secondary text on night. */
  dune: THREE.Color
  /** 3D slab material. */
  basalt: THREE.Color
  /** 3D hemisphere ground and SVG side faces. */
  pitch: THREE.Color
  /** The sun: key light, cursor, focus ring, CTA hover. */
  amber: THREE.Color
}

const NAMES: Array<keyof Palette> = [
  "night",
  "sand",
  "dune",
  "basalt",
  "pitch",
  "amber",
]

/** Fallbacks mirror globals.css so a missing variable never yields black. */
const FALLBACK: Record<keyof Palette, string> = {
  night: "#0f0d0b",
  sand: "#efe7d9",
  dune: "#a89d8b",
  basalt: "#26211c",
  pitch: "#070605",
  amber: "#f0a43a",
}

export function readPalette(): Palette {
  const style =
    typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null
  const out = {} as Palette
  for (const name of NAMES) {
    const raw = style?.getPropertyValue(`--color-${name}`).trim()
    const value = raw && raw.startsWith("#") ? raw : FALLBACK[name]
    // three's Color is linear-workflow aware: setStyle converts from sRGB.
    out[name] = new THREE.Color().setStyle(value)
  }
  return out
}
