import { ImageResponse } from "next/og"

/**
 * Apple touch icon — the favicon mark at 180px: a Night square, a 3×3
 * lattice of Sand cells, the top-left cell in Amber (the sun). iOS applies
 * its own corner mask, so the square stays square here and the lattice is
 * inset far enough that no cell is clipped by the rounding.
 *
 * Colours are the hex values from app/globals.css: ImageResponse cannot read
 * CSS custom properties. Keep them in sync with the token block.
 */
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const NIGHT = "#0f0d0b"
const SAND = "#efe7d9"
const AMBER = "#f0a43a"

const CELL = 34
const GAP = 14
const PITCH = CELL + GAP
const INSET = (size.width - (3 * CELL + 2 * GAP)) / 2

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: NIGHT,
      }}
    >
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: INSET + c * PITCH,
              top: INSET + r * PITCH,
              width: CELL,
              height: CELL,
              borderRadius: 4,
              background: r === 0 && c === 0 ? AMBER : SAND,
            }}
          />
        ))
      )}
    </div>,
    { ...size }
  )
}
