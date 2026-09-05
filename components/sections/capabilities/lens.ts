/**
 * The width lens — pure math, no DOM. DESIGN.md §5.3.
 *
 * A word's width is a function of its distance from the viewport's centre
 * band: 50 (spire) at one reach away, the range maximum (slab) inside the
 * band. Only the two words nearest the band are ever written; everyone
 * else sits at the minimum.
 */

/** Spire. The narrow end of Anybody's width axis. */
export const LENS_MIN = 50
/** Slab on ≥768px; 115 below it (DESIGN.md §3.2 live range). */
export const LENS_MAX_WIDE = 150
export const LENS_MAX_NARROW = 115
/** Half-height of the centre band, as a fraction of the viewport height. */
export const LENS_BAND = 0.1
/** Ramp length from spire to slab, as a fraction of the viewport height. */
export const LENS_REACH = 0.6
/** A word must be nearer than the active one by this much (× vh) to take over. */
export const LENS_HYSTERESIS = 0.02

export type LensRange = { min: number; max: number }

/**
 * Width for a word whose centre sits `distance` px from the viewport centre.
 * `reach` and `band` are in px. `ease` maps 0..1 → 0..1.
 */
export function lensWidth(
  distance: number,
  reach: number,
  band: number,
  range: LensRange,
  ease: (t: number) => number
): number {
  const d = Math.max(0, distance - band)
  if (d >= reach) return range.min
  const t = 1 - d / reach
  return range.min + (range.max - range.min) * ease(t)
}

/**
 * The ramp must be finished by the time a word stops being one of the two
 * nearest, or the third word would snap from mid-width to the minimum. The
 * hand-over happens one pitch away, so the reach is capped at the smaller
 * adjacent pitch minus the band.
 */
export function guardedReach(
  reach: number,
  band: number,
  pitch: number
): number {
  return Math.max(1, Math.min(reach, pitch - band))
}

/** Indices of the two nearest words, nearest first. Second is -1 for a single word. */
export function nearestTwo(dists: ArrayLike<number>): [number, number] {
  let a = -1
  let b = -1
  for (let i = 0; i < dists.length; i++) {
    if (a < 0 || dists[i] < dists[a]) {
      b = a
      a = i
    } else if (b < 0 || dists[i] < dists[b]) {
      b = i
    }
  }
  return [a, b]
}
