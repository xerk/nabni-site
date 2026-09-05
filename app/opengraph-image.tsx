import { ImageResponse } from "next/og"

import { site } from "@/lib/site.config"

/**
 * Open Graph image — the bilingual wordmark, the hero sentence and a
 * stylised stone under an amber key light.
 *
 * Statically generated at build time. Anybody 900 (wdth 150) and Martian
 * Mono 400 (wdth 90) are fetched from Google Fonts as static TTF instances,
 * subset to the exact strings rendered; every fetch is wrapped so a missing
 * network degrades to the bundled default face and never fails the build.
 *
 * The wordmark is Latin-only here. Satori paints text one grapheme at a
 * time, so Arabic gets no contextual shaping and no bidi reordering: نبني
 * came out as four isolated forms read left to right. Arabic on this site is
 * only ever font-shaped (DESIGN.md §1), so the Arabic is omitted rather than
 * hand-assembled from presentation forms; the headline carries the image.
 *
 * Colours are the hex values from app/globals.css (DESIGN.md §V2 palette):
 * ImageResponse cannot read CSS custom properties. Keep them in sync with
 * the token block. Amber appears once, as the key light on the slab's left
 * edge — the sun, never a text or UI colour here.
 */
export const alt = `${site.name} — Bring us the hard one. Engineering studio in ${site.location.city}.`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const NIGHT = "#0f0d0b"
const SAND = "#efe7d9"
const DUNE = "#a89d8b"
const BASALT = "#26211c"
const PITCH = "#070605"
/** Amber #f0a43a as rgb triplet so the key light can fade to transparent. */
const AMBER_RGB = "240, 164, 58"

const HEADLINE = ["Bring us", "the hard", "one."] as const
const META = `${site.name} · ${site.location.city}`

/**
 * The lattice: an abstract square-Kufic-like meander (strokes one cell
 * wide, gaps one cell wide, a few isolated points). Not a word — Arabic on
 * this site is only ever shaped by a font (DESIGN.md §1, §4.5).
 * 9 columns × 13 rows, row-major, top row first. "#" = raised cell.
 */
const LATTICE = [
  ".........",
  ".#.#.###.",
  ".#.#...#.",
  ".###.#.#.",
  ".....#...",
  ".###.###.",
  ".#.#.#...",
  ".#.#.###.",
  ".......#.",
  ".#####.#.",
  ".....#...",
  ".###.###.",
  ".........",
] as const

const COLS = LATTICE[0].length
const ROWS = LATTICE.length
const MARGIN = 72
/** The slab spans margin to margin vertically: 13 rows + half a row of inset. */
const CELL_PITCH = 36
const CELL = 28
const SIDE = 6 // side-face offset: the key light rakes in from the upper left
const STONE_W = COLS * CELL_PITCH
const STONE_H = ROWS * CELL_PITCH + CELL_PITCH / 2
const STONE_INSET_Y = CELL_PITCH / 4
/** The slab's lit edge face and the glow it throws on the ground. */
const EDGE_W = 4
const SPILL_W = 180

const WORDMARK_SIZE = 34
const HEADLINE_SIZE = 94
const HEADLINE_LEADING = 0.9
/** Headline block sits between the wordmark row and the meta line. */
const HEADLINE_TOP = 196

/** Google Fonts serves static TTF instances to user agents it does not recognise. */
const FONT_UA = `Mozilla/5.0 (compatible; ${site.name.toLowerCase()}-og/1.0)`
/** Bounded so a slow font host can only delay the build, never hang it. */
const FONT_TIMEOUT_MS = 15_000

/**
 * Resolve a css2 stylesheet for one family at one axis instance, subset to
 * `text`, and return the first face as a buffer. Null on any failure.
 */
async function loadGoogleFont(family: string, axes: string, text: string) {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${family}:${axes}&text=${encodeURIComponent(text)}`
    const css = await fetch(url, {
      headers: { "User-Agent": FONT_UA },
      cache: "force-cache",
      signal: AbortSignal.timeout(FONT_TIMEOUT_MS),
    })
    if (!css.ok) return null
    const match =
      /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/.exec(
        await css.text()
      )
    if (!match) return null
    const font = await fetch(match[1], {
      cache: "force-cache",
      signal: AbortSignal.timeout(FONT_TIMEOUT_MS),
    })
    if (!font.ok) return null
    const data = await font.arrayBuffer()
    return isFontBuffer(data) ? data : null
  } catch {
    return null
  }
}

/**
 * Satori parses fonts outside any try/catch, so a 200 carrying an HTML
 * error page must never reach it. Accept only TrueType, OpenType or WOFF
 * signatures (the three formats ImageResponse supports).
 */
function isFontBuffer(data: ArrayBuffer) {
  if (data.byteLength < 4) return false
  const tag = String.fromCharCode(...new Uint8Array(data, 0, 4))
  return (
    tag === "\0\u0001\0\0" || tag === "OTTO" || tag === "true" || tag === "wOFF"
  )
}

export default async function Image() {
  const [anybody, martian] = await Promise.all([
    loadGoogleFont(
      "Anybody",
      "wdth,wght@150,900",
      `${site.name} ${HEADLINE.join(" ")}`
    ),
    loadGoogleFont("Martian+Mono", "wdth,wght@90,400", META),
  ])

  const fonts = [
    anybody && {
      name: "Anybody",
      data: anybody,
      weight: 900 as const,
      style: "normal" as const,
    },
    martian && {
      name: "Martian Mono",
      data: martian,
      weight: 400 as const,
      style: "normal" as const,
    },
  ].filter((f) => f !== null)

  const displayFamily = anybody ? "Anybody" : "sans-serif"
  const monoFamily = martian
    ? "Martian Mono"
    : anybody
      ? "Anybody"
      : "monospace"

  const cells: React.ReactNode[] = []
  LATTICE.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== "#") continue
      const x = c * CELL_PITCH + (CELL_PITCH - CELL) / 2
      const y = STONE_INSET_Y + r * CELL_PITCH + (CELL_PITCH - CELL) / 2
      cells.push(
        <div
          key={`s${r}-${c}`}
          style={{
            position: "absolute",
            left: x + SIDE,
            top: y + SIDE,
            width: CELL,
            height: CELL,
            borderRadius: 2,
            background: PITCH,
          }}
        />
      )
      cells.push(
        <div
          key={`t${r}-${c}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: CELL,
            height: CELL,
            borderRadius: 2,
            background: SAND,
          }}
        />
      )
    }
  })

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: NIGHT,
        color: SAND,
      }}
    >
      {/* Wordmark (Latin only — see the header comment). */}
      <div
        style={{
          position: "absolute",
          left: MARGIN,
          top: MARGIN,
          display: "flex",
          fontFamily: displayFamily,
          fontWeight: 900,
          fontSize: WORDMARK_SIZE,
          lineHeight: 1,
          letterSpacing: "-0.01em",
        }}
      >
        {site.name}
      </div>

      <div
        style={{
          position: "absolute",
          left: MARGIN,
          top: HEADLINE_TOP,
          display: "flex",
          flexDirection: "column",
          fontFamily: displayFamily,
          fontWeight: 900,
          fontSize: HEADLINE_SIZE,
          lineHeight: HEADLINE_LEADING,
          letterSpacing: "-0.02em",
        }}
      >
        {HEADLINE.map((line) => (
          <div key={line} style={{ display: "flex" }}>
            {line}
          </div>
        ))}
      </div>

      {/* Light spill: the sun's glow on the ground just before the slab. */}
      <div
        style={{
          position: "absolute",
          right: MARGIN + STONE_W,
          top: MARGIN,
          width: SPILL_W,
          height: STONE_H,
          display: "flex",
          background: `radial-gradient(ellipse at 100% 24%, rgba(${AMBER_RGB}, 0.2) 0%, rgba(${AMBER_RGB}, 0) 62%)`,
        }}
      />

      {/* The stone: a basalt slab, lit from the upper left by the amber sun. */}
      <div
        style={{
          position: "absolute",
          right: MARGIN,
          top: MARGIN,
          width: STONE_W,
          height: STONE_H,
          display: "flex",
          background: BASALT,
        }}
      >
        {/* Key light across the face: strongest at the top-left, gone by mid-slab. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: STONE_W,
            height: STONE_H,
            display: "flex",
            background: `radial-gradient(ellipse at 0% 20%, rgba(${AMBER_RGB}, 0.42) 0%, rgba(${AMBER_RGB}, 0.14) 32%, rgba(${AMBER_RGB}, 0) 58%)`,
          }}
        />
        {/* The slab's lit edge face. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: EDGE_W,
            height: STONE_H,
            display: "flex",
            background: `linear-gradient(180deg, rgba(${AMBER_RGB}, 0.95) 0%, rgba(${AMBER_RGB}, 0.6) 55%, rgba(${AMBER_RGB}, 0.3) 100%)`,
          }}
        />
        {cells}
      </div>

      <div
        style={{
          position: "absolute",
          left: MARGIN,
          bottom: MARGIN,
          display: "flex",
          fontFamily: monoFamily,
          fontWeight: 400,
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: "0.02em",
          color: DUNE,
        }}
      >
        {META}
      </div>
    </div>,
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  )
}
