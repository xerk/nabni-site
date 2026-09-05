/**
 * Text → shaped glyph outlines, for the glass word (DESIGN.md §V3).
 *
 * Runs in Node (build-time pre-shaping) and in the browser (a visitor's own
 * brief). The only dependency is a fontkit `Font` instance, which the caller
 * supplies, so this module stays free of any loading strategy.
 *
 * fontkit does real OpenType layout, so Arabic joins correctly (نبني comes
 * back as connected forms, right to left) and variable instances are honoured.
 * Outlines are emitted in SVG convention (y down) because three's SVGLoader
 * consumes them; the renderer flips the finished geometry.
 */

/** Minimal structural types: fontkit ships its own, but they differ per build. */
export type FontkitGlyph = {
  path: {
    toSVG(): string
    scale(x: number, y: number): FontkitGlyph["path"]
    translate(x: number, y: number): FontkitGlyph["path"]
    bbox: { minX: number; minY: number; maxX: number; maxY: number }
  }
  id: number
}

export type FontkitFont = {
  unitsPerEm: number
  ascent: number
  descent: number
  layout(text: string): {
    glyphs: FontkitGlyph[]
    positions: Array<{
      xAdvance: number
      yAdvance: number
      xOffset: number
      yOffset: number
    }>
    direction?: string
  }
}

export type ShapedGlyph = {
  /** SVG path data, already positioned within the block, y down. */
  d: string
  /** Centre of this glyph's box, in the same space as `d`. Used to animate. */
  cx: number
  cy: number
  /** Reading order index (0 = first letter read), for staggered animation. */
  order: number
  line: number
}

export type ShapedWord = {
  glyphs: ShapedGlyph[]
  /** Bounding box of the whole block, y down, origin at top-left. */
  width: number
  height: number
  lines: number
  script: "latin" | "arabic"
}

export type ShapeOptions = {
  /** Cap height target in layout units. Everything scales from this. */
  size?: number
  /** Maximum lines; the text wraps on spaces to fit. */
  maxLines?: number
  /** Maximum line width in layout units before wrapping. */
  maxWidth?: number
  /** Extra leading as a multiple of size. */
  lineHeight?: number
}

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/

export function detectScript(text: string): "latin" | "arabic" {
  return ARABIC_RE.test(text) ? "arabic" : "latin"
}

/** Measure one run without building paths. */
function measure(font: FontkitFont, text: string, scale: number): number {
  if (!text) return 0
  const run = font.layout(text)
  let w = 0
  for (const pos of run.positions) w += pos.xAdvance
  return w * scale
}

/**
 * Greedy word wrap. Arabic and Latin both break on spaces; we never split a
 * word, and we never split inside a word for Arabic (that would break joining).
 */
function wrap(
  font: FontkitFont,
  text: string,
  scale: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current && measure(font, candidate, scale) > maxWidth) {
      lines.push(current)
      current = word
      if (lines.length === maxLines) return lines
    } else {
      current = candidate
    }
  }
  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

/**
 * Shape `text` into positioned glyph outlines.
 *
 * The block is laid out with its top-left at the origin and then centred, so
 * the caller can extrude each glyph independently and still have the word read
 * as one object. Font size is chosen to fit `maxWidth`, shrinking if needed.
 */
export function shapeText(
  font: FontkitFont,
  text: string,
  options: ShapeOptions = {}
): ShapedWord {
  const {
    size = 1,
    maxLines = 3,
    maxWidth = 6,
    lineHeight = 1.24,
  } = options

  const script = detectScript(text)
  const trimmed = text.trim().replace(/\s+/g, " ")
  if (!trimmed) {
    return { glyphs: [], width: 0, height: 0, lines: 0, script }
  }

  // Start at the requested size and shrink until the longest line fits.
  let scale = size / font.unitsPerEm
  let lines = wrap(font, trimmed, scale, maxWidth, maxLines)
  for (let guard = 0; guard < 24; guard++) {
    const widest = Math.max(...lines.map((l) => measure(font, l, scale)), 0)
    const dropped = lines.join(" ").length < trimmed.length
    if (widest <= maxWidth && !dropped) break
    scale *= 0.92
    lines = wrap(font, trimmed, scale, maxWidth, maxLines)
  }
  if (lines.length === 0) lines = [trimmed]

  const lineStep = size * lineHeight
  const lineWidths = lines.map((l) => measure(font, l, scale))
  const blockWidth = Math.max(...lineWidths, 0)
  const blockHeight = lineStep * lines.length

  const glyphs: ShapedGlyph[] = []
  let order = 0

  lines.forEach((line, lineIndex) => {
    const run = font.layout(line)
    // Centre each line horizontally within the block.
    let x = (blockWidth - lineWidths[lineIndex]) / 2
    // Baseline of this line, y down from the block's top edge.
    const baseline = lineStep * lineIndex + size

    run.glyphs.forEach((glyph, i) => {
      const pos = run.positions[i]
      const gx = x + pos.xOffset * scale
      const gy = baseline - pos.yOffset * scale
      // scale(s, -s) flips fontkit's y-up outline into SVG's y-down space.
      const path = glyph.path.scale(scale, -scale).translate(gx, gy)
      const d = path.toSVG()
      x += pos.xAdvance * scale

      // Whitespace and marks with no outline contribute nothing to render.
      if (!d || d.trim().length === 0) return

      const bbox = path.bbox
      glyphs.push({
        d,
        cx: (bbox.minX + bbox.maxX) / 2,
        cy: (bbox.minY + bbox.maxY) / 2,
        order: order++,
        line: lineIndex,
      })
    })
  })

  return {
    glyphs,
    width: blockWidth,
    height: blockHeight,
    lines: lines.length,
    script,
  }
}

/** Serialise for the committed word table; keeps files small and diffable. */
export type SerialisedWord = {
  text: string
  width: number
  height: number
  lines: number
  script: "latin" | "arabic"
  glyphs: Array<{ d: string; cx: number; cy: number }>
}

export function serialise(text: string, word: ShapedWord): SerialisedWord {
  const round = (n: number) => Math.round(n * 1000) / 1000
  return {
    text,
    width: round(word.width),
    height: round(word.height),
    lines: word.lines,
    script: word.script,
    glyphs: word.glyphs.map((g) => ({
      d: g.d,
      cx: round(g.cx),
      cy: round(g.cy),
    })),
  }
}
