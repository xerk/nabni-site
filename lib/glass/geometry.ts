import * as THREE from "three"

import { groupContours, parsePathData } from "./path"
import type { SerialisedWord } from "./shape"

/**
 * Glyph outlines → extruded glass geometry (DESIGN.md §V3).
 *
 * Outlines arrive in SVG convention (y down); three is y up, so contours are
 * mirrored while parsing. ExtrudeGeometry normalises contour winding itself,
 * so mirroring cannot leave inside-out faces.
 *
 * Each glyph's path data already encodes its position inside the word, so the
 * geometry is left where it lands and the renderer centres the whole word with
 * one group offset. Per-glyph animation is then a delta from (0, 0, 0).
 *
 * Geometries are cached by (path data + depth + bevel): the same word is
 * rebuilt whenever the visitor scrolls back to it.
 */

export type GlassGlyph = {
  geometry: THREE.ExtrudeGeometry
  /** Glyph centroid relative to the word's centre, y up. Drives the scatter. */
  center: THREE.Vector3
  /** Reading order, for staggered assembly. */
  order: number
}

export type GlassWord = {
  glyphs: GlassGlyph[]
  width: number
  height: number
  /** Line count, so the renderer can cap a single line's cap height. */
  lines: number
  /** Apply to the group holding the glyphs to centre the word on the origin. */
  offset: THREE.Vector3
  triangles: number
  script: "latin" | "arabic"
}

const cache = new Map<string, THREE.ExtrudeGeometry>()

function buildGeometry(
  d: string,
  depth: number,
  bevel: number
): THREE.ExtrudeGeometry {
  const key = `${d}|${depth}|${bevel}`
  const hit = cache.get(key)
  if (hit) return hit

  const contours = parsePathData(d, true)
  const shapes = groupContours(contours).map(({ outer, holes }) => {
    const shape = new THREE.Shape(outer.map((p) => new THREE.Vector2(p.x, p.y)))
    shape.holes = holes.map(
      (hole) => new THREE.Path(hole.map((p) => new THREE.Vector2(p.x, p.y)))
    )
    return shape
  })

  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    bevelOffset: 0,
    bevelSegments: 2,
    // Contours are already flattened; this only affects any curve we add later.
    curveSegments: 1,
  })
  // Extrusion runs from z = 0 forward; centre it so the glyph turns about its
  // own middle and the transmission thickness reads symmetrically.
  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  cache.set(key, geometry)
  return geometry
}

export type BuildOptions = {
  /** Extrusion depth as a fraction of cap height. */
  depth?: number
  /** Bevel size as a fraction of cap height. */
  bevel?: number
}

/**
 * Turn a shaped word into per-glyph geometries plus the offset that centres
 * the word on the origin.
 */
export function buildGlassWord(
  word: SerialisedWord,
  { depth = 0.17, bevel = 0.018 }: BuildOptions = {}
): GlassWord {
  const glyphs: GlassGlyph[] = []
  let triangles = 0

  // shape.ts lays the block out from its top-left corner with y down; after
  // mirroring, the block spans x ∈ [0, width] and y ∈ [-height, 0].
  const offset = new THREE.Vector3(-word.width / 2, word.height / 2, 0)

  word.glyphs.forEach((glyph, index) => {
    const geometry = buildGeometry(glyph.d, depth, bevel)
    triangles += geometry.getAttribute("position").count / 3
    glyphs.push({
      geometry,
      center: new THREE.Vector3(glyph.cx + offset.x, -glyph.cy + offset.y, 0),
      order: index,
    })
  })

  return {
    glyphs,
    width: word.width,
    height: word.height,
    lines: Math.max(1, word.lines),
    offset,
    triangles: Math.round(triangles),
    script: word.script,
  }
}

/** Drop cached geometry; call on unmount so a long session cannot grow. */
export function disposeGlassCache() {
  for (const geometry of cache.values()) geometry.dispose()
  cache.clear()
}
