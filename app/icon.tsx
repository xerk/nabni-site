import { ImageResponse } from "next/og"

/**
 * Favicon — a Night square carrying a 3×3 lattice of Sand cells, the
 * top-left cell in Amber: the sun sitting where the key light rakes in
 * from (upper left, matching the OG stone's side faces). Nine full cells
 * so the mark still reads at 16px in a tab; nothing dimmed, nothing rounded
 * beyond the cell radius.
 *
 * Colours are the hex values from app/globals.css: ImageResponse cannot read
 * CSS custom properties. Keep them in sync with the token block.
 */
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

const NIGHT = "#0f0d0b"
const SAND = "#efe7d9"
const AMBER = "#f0a43a"

const CELL = 6
const GAP = 3
const PITCH = CELL + GAP
const INSET = (size.width - (3 * CELL + 2 * GAP)) / 2

export default function Icon() {
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
              borderRadius: 1,
              background: r === 0 && c === 0 ? AMBER : SAND,
            }}
          />
        ))
      )}
    </div>,
    { ...size }
  )
}
