import { WORD_PATHS } from "@/lib/glass/word-paths"
import { STELE_DEFAULT_WORD } from "@/components/stele/stele-state"
import { cn } from "@/lib/utils"

/**
 * Server-rendered placeholder for the glass word (DESIGN.md §V3, §4.7).
 *
 * The word's outline in dune with a hairline amber edge: the same silhouette
 * the canvas will draw, so the crossfade has nothing to jump. It is also the
 * no-WebGL path and what social crawlers and print see.
 *
 * Pure and hook-free, so server and client render byte-identical markup.
 */
export function GlassSvg({
  word = STELE_DEFAULT_WORD,
  className,
}: {
  word?: string
  className?: string
}) {
  const shaped = WORD_PATHS[word] ?? WORD_PATHS[STELE_DEFAULT_WORD]
  if (!shaped) return null

  // A little air around the block so the amber stroke never clips.
  const pad = 0.14
  const viewBox = `${-pad} ${-pad} ${shaped.width + pad * 2} ${shaped.height + pad * 2}`

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={cn("block size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="var(--color-dune)" fillOpacity="0.55">
        {shaped.glyphs.map((glyph, i) => (
          <path key={i} d={glyph.d} />
        ))}
      </g>
      <g
        fill="none"
        stroke="var(--color-amber)"
        strokeOpacity="0.45"
        strokeWidth={0.012}
      >
        {shaped.glyphs.map((glyph, i) => (
          <path key={i} d={glyph.d} />
        ))}
      </g>
    </svg>
  )
}
