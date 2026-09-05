/**
 * Grid tiers (DESIGN.md §4.4). Pure constants; safe on the server.
 */
import type { SteleTier } from "@/components/stele/stele-state"

export type Grid = { cols: number; rows: number }

export const STELE_GRID: Record<SteleTier, Grid> = {
  A: { cols: 96, rows: 144 },
  B: { cols: 64, rows: 96 },
}

/** Brief caps per tier: characters and wrapped lines. */
export const STELE_BRIEF_CAP: Record<
  SteleTier,
  { maxChars: number; maxLines: number }
> = {
  A: { maxChars: 40, maxLines: 3 },
  B: { maxChars: 24, maxLines: 2 },
}

/** Slab body in world units (BoxGeometry 1.0 × 1.5 × 0.12). */
export const SLAB = { width: 1.0, height: 1.5, depth: 0.12 } as const

/**
 * Relief. Cells tile the face with no lattice gap (a 6% groove aliased into
 * moiré at ~4px per cell): `fill` is a hair over 1 so neighbours overlap by
 * 2% instead of meeting at a float-ulp crack that MSAA renders as a seam.
 * Flat cells are flush with the face: cells at height 0 are not drawn at all
 * (their instance collapses to a point and the slab body shows through), so
 * the flat field is one quad with no seams and only raised cells cast
 * shadows. A drawn cell is a box with a sub-pixel bevel (`inset` of the cell
 * size per side, `bevel` of its height): a neighbour's internal side face
 * then ends strictly below the adjacent top face instead of tying with it
 * in the depth buffer, which showed as speckles along every internal edge.
 * `baseDepth` is the height of a drawn cell at h = 0 (Tier B's fake-shadow
 * plates; never a singular z-scale). The state's `depth` (0.035 rest →
 * 0.012 noon, DESIGN.md §4.3) maps to geometry through `depthScale`, so a
 * raised cell at rest is ≈0.014 world units tall and throws a 2–3 cell
 * shadow under the 22° first light. Raised top faces are also tinted toward
 * Limestone (`tint`) in proportion to height × depth / rest depth, so the
 * word reads at every light angle and still dissolves toward flat stone at
 * noon.
 */
export const CELL = {
  baseDepth: 0.001,
  fill: 1.02,
  inset: 0.008,
  bevel: 0.35,
  faceZ: SLAB.depth / 2,
  depthScale: 0.4,
  /** Fraction of the way from slab to Limestone at full height and rest depth. */
  tint: 0.35,
} as const

/** Camera: fov 28 at z 4.85 → visible height at z = 0 ≈ 2.42 world units. */
export const CAMERA = { fov: 28, z: 4.85 } as const
export const VISIBLE_HEIGHT =
  2 * CAMERA.z * Math.tan((CAMERA.fov / 2) * (Math.PI / 180))
