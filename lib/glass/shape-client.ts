"use client"

import { serialise, shapeText, type SerialisedWord } from "./shape"
import { WORD_PATHS } from "./word-paths"

/**
 * Shaping for the browser (DESIGN.md §V3).
 *
 * The site's fixed words are pre-shaped at build time and served from
 * `word-paths.ts`, so the first frame never waits on a shaper. fontkit
 * (~110 KB gzip) and the two OFL fonts are fetched only when a visitor types
 * something of their own, and only once per session.
 */

type FontkitModule = {
  create(buffer: Uint8Array): {
    getVariation(settings: Record<string, number>): unknown
  }
}

const FONTS = {
  arabic: { url: "/fonts/reem-kufi-var.ttf", variation: { wght: 700 } },
  latin: { url: "/fonts/anybody-var.ttf", variation: { wght: 900, wdth: 150 } },
} as const

type Script = keyof typeof FONTS

const fonts = new Map<Script, unknown>()
const runtimeCache = new Map<string, SerialisedWord>()
let fontkitPromise: Promise<FontkitModule> | null = null

function loadFontkit(): Promise<FontkitModule> {
  fontkitPromise ??= import("fontkit").then(
    (m) => ((m as unknown as { default?: FontkitModule }).default ??
      m) as unknown as FontkitModule
  )
  return fontkitPromise
}

async function loadFont(script: Script) {
  const hit = fonts.get(script)
  if (hit) return hit
  const [fontkit, buffer] = await Promise.all([
    loadFontkit(),
    fetch(FONTS[script].url).then((r) => {
      if (!r.ok) throw new Error(`font ${r.status}`)
      return r.arrayBuffer()
    }),
  ])
  const font = fontkit
    .create(new Uint8Array(buffer))
    .getVariation(FONTS[script].variation)
  fonts.set(script, font)
  return font
}

/** Pre-shaped word, or null when the text needs the runtime shaper. */
export function getFixedWord(text: string): SerialisedWord | null {
  return WORD_PATHS[text.trim()] ?? null
}

export type ShapeRuntimeOptions = {
  maxLines?: number
  maxWidth?: number
}

/**
 * Shape arbitrary text. Resolves instantly for the fixed words; otherwise
 * loads the shaper once and caches every result for the session.
 */
export async function shapeWord(
  text: string,
  { maxLines = 3, maxWidth = 6.4 }: ShapeRuntimeOptions = {}
): Promise<SerialisedWord | null> {
  const clean = text.trim().replace(/\s+/g, " ")
  if (!clean) return null

  const fixed = getFixedWord(clean)
  if (fixed) return fixed

  const key = `${clean}|${maxLines}|${maxWidth}`
  const cached = runtimeCache.get(key)
  if (cached) return cached

  const script: Script = /[؀-ۿ]/.test(clean) ? "arabic" : "latin"
  try {
    const font = await loadFont(script)
    const shaped = shapeText(font as Parameters<typeof shapeText>[0], clean, {
      size: 1,
      maxLines,
      maxWidth,
    })
    if (shaped.glyphs.length === 0) return null
    const result = serialise(clean, shaped)
    runtimeCache.set(key, result)
    return result
  } catch (error) {
    // Network or parse failure: the caller keeps the word it already has.
    console.warn("[glass] could not shape text", error)
    return null
  }
}

/** Warm the shaper on first focus so the first cast has no visible wait. */
export function prefetchShaper() {
  void loadFontkit().catch(() => {})
}
