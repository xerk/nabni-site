/**
 * A minimal SVG path-data reader for font outlines (DESIGN.md §V3).
 *
 * three's SVGLoader needs a DOM, which rules it out of build scripts and
 * tests. Glyph outlines only ever use M, L, Q, C and Z, so parsing them
 * directly is both smaller and testable in Node.
 *
 * Curves are flattened here, so callers get plain polygons and can decide
 * containment (which contour is a hole) without a geometry library.
 */

export type Point = { x: number; y: number }
export type Contour = Point[]

const TOKEN = /([MmLlQqCcZzHhVv])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi

/** Segments used to flatten a curve one cap-height long. */
const CURVE_DETAIL = 24
const MIN_SEGMENTS = 3
const MAX_SEGMENTS = 16

function segmentsFor(length: number): number {
  return Math.min(
    MAX_SEGMENTS,
    Math.max(MIN_SEGMENTS, Math.ceil(length * CURVE_DETAIL))
  )
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Parse path data into flattened contours.
 * `flipY` mirrors into three's y-up space in the same pass.
 */
export function parsePathData(d: string, flipY = false): Contour[] {
  const contours: Contour[] = []
  let contour: Contour = []
  let current: Point = { x: 0, y: 0 }
  let start: Point = { x: 0, y: 0 }
  let command = ""

  const numbers: number[] = []
  const tokens: Array<{ command?: string; value?: number }> = []
  for (const match of d.matchAll(TOKEN)) {
    if (match[1]) tokens.push({ command: match[1] })
    else tokens.push({ value: parseFloat(match[2]) })
  }

  const push = (x: number, y: number) => {
    contour.push({ x, y: flipY ? -y : y })
  }
  const close = () => {
    if (contour.length > 2) contours.push(contour)
    contour = []
  }

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    if (token.command) {
      command = token.command
      i++
      if (command === "Z" || command === "z") {
        close()
        current = { ...start }
      }
      continue
    }

    // Gather the argument count this command needs.
    const arity =
      command === "M" || command === "m" || command === "L" || command === "l"
        ? 2
        : command === "H" || command === "h" || command === "V" || command === "v"
          ? 1
          : command === "Q" || command === "q"
            ? 4
            : 6
    numbers.length = 0
    while (numbers.length < arity && i < tokens.length && tokens[i].value !== undefined) {
      numbers.push(tokens[i].value as number)
      i++
    }
    if (numbers.length < arity) break

    const relative = command === command.toLowerCase()
    const ox = relative ? current.x : 0
    const oy = relative ? current.y : 0

    switch (command.toUpperCase()) {
      case "M": {
        close()
        current = { x: numbers[0] + ox, y: numbers[1] + oy }
        start = { ...current }
        push(current.x, current.y)
        // Subsequent pairs after an M are implicit L commands.
        command = relative ? "l" : "L"
        break
      }
      case "L": {
        current = { x: numbers[0] + ox, y: numbers[1] + oy }
        push(current.x, current.y)
        break
      }
      case "H": {
        current = { x: numbers[0] + ox, y: current.y }
        push(current.x, current.y)
        break
      }
      case "V": {
        current = { x: current.x, y: numbers[0] + oy }
        push(current.x, current.y)
        break
      }
      case "Q": {
        const c = { x: numbers[0] + ox, y: numbers[1] + oy }
        const end = { x: numbers[2] + ox, y: numbers[3] + oy }
        const n = segmentsFor(dist(current, c) + dist(c, end))
        for (let s = 1; s <= n; s++) {
          const t = s / n
          const u = 1 - t
          push(
            u * u * current.x + 2 * u * t * c.x + t * t * end.x,
            u * u * current.y + 2 * u * t * c.y + t * t * end.y
          )
        }
        current = end
        break
      }
      case "C": {
        const c1 = { x: numbers[0] + ox, y: numbers[1] + oy }
        const c2 = { x: numbers[2] + ox, y: numbers[3] + oy }
        const end = { x: numbers[4] + ox, y: numbers[5] + oy }
        const n = segmentsFor(
          dist(current, c1) + dist(c1, c2) + dist(c2, end)
        )
        for (let s = 1; s <= n; s++) {
          const t = s / n
          const u = 1 - t
          push(
            u * u * u * current.x +
              3 * u * u * t * c1.x +
              3 * u * t * t * c2.x +
              t * t * t * end.x,
            u * u * u * current.y +
              3 * u * u * t * c1.y +
              3 * u * t * t * c2.y +
              t * t * t * end.y
          )
        }
        current = end
        break
      }
    }
  }
  close()
  return contours
}

/** Signed area; sign tells winding, magnitude tells size. */
export function signedArea(contour: Contour): number {
  let sum = 0
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    sum += (contour[j].x + contour[i].x) * (contour[j].y - contour[i].y)
  }
  return sum / 2
}

/** Ray casting; `point` is assumed not to lie exactly on an edge. */
export function contains(contour: Contour, point: Point): boolean {
  let inside = false
  for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
    const a = contour[i]
    const b = contour[j]
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside
    }
  }
  return inside
}

export type ContourTree = { outer: Contour; holes: Contour[] }

/**
 * Sort contours into outers and holes by containment, largest first.
 * Winding is not trusted: fonts and the y-flip both reverse it.
 */
export function groupContours(contours: Contour[]): ContourTree[] {
  const sorted = contours
    .map((contour) => ({ contour, area: Math.abs(signedArea(contour)) }))
    .filter((entry) => entry.area > 1e-9)
    .sort((a, b) => b.area - a.area)

  const trees: ContourTree[] = []
  for (const { contour } of sorted) {
    // A contour inside an existing outer is that outer's hole, unless it is
    // already inside one of that outer's holes (an island, e.g. the bowl of
    // a "0" drawn as a ring inside a ring).
    let placed = false
    for (const tree of trees) {
      if (!contains(tree.outer, contour[0])) continue
      if (tree.holes.some((hole) => contains(hole, contour[0]))) continue
      tree.holes.push(contour)
      placed = true
      break
    }
    if (!placed) trees.push({ outer: contour, holes: [] })
  }
  return trees
}
