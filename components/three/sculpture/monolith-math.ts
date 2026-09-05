/**
 * THE SCULPTURE — the form as pure math (DESIGN.md §V2 item 2).
 *
 * One monolith: a superellipsoid (squircle cross-section, flat-shouldered
 * caps) tapered toward the top and twisted gently about its axis. This module
 * has no three.js and no DOM, so the server-rendered SVG placeholder and the
 * WebGL geometry are computed from the same function and always agree.
 */

export const DEG = Math.PI / 180
export const TAU = Math.PI * 2

export const MONOLITH = {
  /** Full extents in world units. */
  width: 1.08,
  depth: 0.78,
  height: 2.36,
  /** Total twist from base to cap. */
  twist: 34 * DEG,
  /** The cap's cross-section is (1 − taper) × the base's. */
  taper: 0.14,
  /** Superellipse exponents: cross-section (squircle) and vertical profile (flat caps). */
  crossExponent: 4.2,
  profileExponent: 5.6,
  /** Tessellation: interior rings × radial samples (2 pole vertices added). */
  rings: 100,
  radial: 160,
} as const

/** Rest pose: a shoulder toward the camera so the twist reads in the highlights. */
export const REST_YAW = 32 * DEG

/**
 * Camera framing shared by the canvas and the placeholder: a long lens, a
 * little above the form so the cap and the contact shadow both read.
 */
export const FRAMING = {
  fov: 24,
  cameraY: 1.25,
  cameraZ: 8.4,
  lookY: -0.1,
  /** Contact-shadow plane, just under the resting base. */
  floorY: -MONOLITH.height / 2 - 0.035,
} as const

/** Placeholder viewBox (the desktop 3:2 box; `slice` keeps the vertical framing elsewhere). */
export const VIEWBOX = { width: 300, height: 200 } as const

export type Vec3 = { x: number; y: number; z: number }

/** sign(v) · |v|^e, the superellipse power. */
export function sgnPow(v: number, e: number): number {
  return v < 0 ? -Math.pow(-v, e) : Math.pow(v, e)
}

/**
 * Surface point for η ∈ [−π/2, π/2] (base → cap) and ω ∈ [0, 2π) around.
 * Twist and taper are functions of the normalised height only, so the
 * numeric normals in the geometry builder stay exact.
 */
export function monolithPoint(eta: number, omega: number, out: Vec3): Vec3 {
  const e1 = 2 / MONOLITH.profileExponent
  const e2 = 2 / MONOLITH.crossExponent
  const rp = sgnPow(Math.cos(eta), e1)
  const yn = sgnPow(Math.sin(eta), e1)
  const rx = rp * sgnPow(Math.cos(omega), e2) * (MONOLITH.width / 2)
  const rz = rp * sgnPow(Math.sin(omega), e2) * (MONOLITH.depth / 2)
  const k = 1 - MONOLITH.taper * (yn + 1) * 0.5
  const phi = MONOLITH.twist * yn * 0.5
  const c = Math.cos(phi)
  const s = Math.sin(phi)
  out.x = (rx * c - rz * s) * k
  out.y = yn * (MONOLITH.height / 2)
  out.z = (rx * s + rz * c) * k
  return out
}

/**
 * Spread `count` parameter values over [from, to] so that samples follow a
 * 2D curve's turning angle (weight `turn`) blended with its arc length
 * (weight 1 − turn): corners get the vertices, straight runs get few. Used
 * for both the profile (η) and the cross-section (ω).
 */
export function distribute(
  curve: (t: number, out: { x: number; y: number }) => void,
  from: number,
  to: number,
  count: number,
  turn: number,
  closed: boolean
): number[] {
  const fine = 4096
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= fine; i++) {
    const p = { x: 0, y: 0 }
    curve(from + ((to - from) * i) / fine, p)
    pts.push(p)
  }
  const lengths = new Float64Array(fine)
  const turns = new Float64Array(fine)
  let totalLength = 0
  let totalTurn = 0
  let prevAngle = 0
  for (let i = 0; i < fine; i++) {
    const dx = pts[i + 1].x - pts[i].x
    const dy = pts[i + 1].y - pts[i].y
    lengths[i] = Math.hypot(dx, dy)
    totalLength += lengths[i]
    const angle = Math.atan2(dy, dx)
    if (i > 0) {
      let d = angle - prevAngle
      if (d > Math.PI) d -= TAU
      if (d < -Math.PI) d += TAU
      turns[i] = Math.abs(d)
      totalTurn += turns[i]
    }
    prevAngle = angle
  }
  const cumulative = new Float64Array(fine + 1)
  for (let i = 0; i < fine; i++) {
    const w =
      ((1 - turn) * lengths[i]) / (totalLength || 1) +
      (turn * turns[i]) / (totalTurn || 1)
    cumulative[i + 1] = cumulative[i] + w
  }
  const total = cumulative[fine]
  const out: number[] = []
  const steps = closed ? count : count - 1
  let j = 0
  for (let k = 0; k < count; k++) {
    const target = (total * k) / steps
    while (j < fine - 1 && cumulative[j + 1] < target) j++
    const span = cumulative[j + 1] - cumulative[j] || 1
    const f = (target - cumulative[j]) / span
    out.push(from + ((to - from) * (j + f)) / fine)
  }
  return out
}

/** Interior ring parameters η (base → cap), poles excluded. */
export function ringParams(): number[] {
  const e1 = 2 / MONOLITH.profileExponent
  const eps = 1e-4
  return distribute(
    (t, o) => {
      o.x = sgnPow(Math.cos(t), e1)
      o.y = sgnPow(Math.sin(t), e1) * (MONOLITH.height / MONOLITH.width)
    },
    -Math.PI / 2 + eps,
    Math.PI / 2 - eps,
    MONOLITH.rings,
    0.62,
    false
  )
}

/** Radial parameters ω around the cross-section, closed. */
export function radialParams(): number[] {
  const e2 = 2 / MONOLITH.crossExponent
  return distribute(
    (t, o) => {
      o.x = sgnPow(Math.cos(t), e2) * MONOLITH.width
      o.y = sgnPow(Math.sin(t), e2) * MONOLITH.depth
    },
    0,
    TAU,
    MONOLITH.radial,
    0.6,
    true
  )
}

/**
 * Perspective-project a world point with the shared framing into a viewBox
 * of the given size (y down). Returns false when the point is behind the camera.
 */
function project(
  p: Vec3,
  viewW: number,
  viewH: number,
  out: { x: number; y: number }
): boolean {
  // Camera basis: forward toward the look point, right, then true up.
  const fx = 0
  const fy = FRAMING.lookY - FRAMING.cameraY
  const fz = -FRAMING.cameraZ
  const fl = Math.hypot(fx, fy, fz)
  const f = { x: fx / fl, y: fy / fl, z: fz / fl }
  // right = forward × up(0,1,0)
  const r = { x: -f.z, y: 0, z: f.x }
  const rl = Math.hypot(r.x, r.y, r.z)
  r.x /= rl
  r.z /= rl
  // up = right × forward
  const u = {
    x: r.y * f.z - r.z * f.y,
    y: r.z * f.x - r.x * f.z,
    z: r.x * f.y - r.y * f.x,
  }
  const dx = p.x
  const dy = p.y - FRAMING.cameraY
  const dz = p.z - FRAMING.cameraZ
  const depth = dx * f.x + dy * f.y + dz * f.z
  if (depth <= 0) return false
  const xv = dx * r.x + dy * r.y + dz * r.z
  const yv = dx * u.x + dy * u.y + dz * u.z
  const t = Math.tan((FRAMING.fov * DEG) / 2)
  const aspect = viewW / viewH
  const ndcX = xv / depth / (t * aspect)
  const ndcY = yv / depth / t
  out.x = ((ndcX + 1) / 2) * viewW
  out.y = ((1 - ndcY) / 2) * viewH
  return true
}

/**
 * SVG path (viewBox units) of the monolith's outline at a yaw, as the camera
 * sees it: the surface is sampled coarsely, projected, and its left and right
 * edges taken per horizontal band. Pure and deterministic; computed once per
 * process for the placeholder.
 */
export function silhouettePath(yaw: number): string {
  const { width: W, height: H } = VIEWBOX
  const bands = 64
  const rings = 72
  const radial = 96
  const minX = new Float64Array(bands).fill(Infinity)
  const maxX = new Float64Array(bands).fill(-Infinity)
  let top = Infinity
  let bottom = -Infinity
  const p: Vec3 = { x: 0, y: 0, z: 0 }
  const q = { x: 0, y: 0 }
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const pts: { x: number; y: number }[] = []
  for (let j = 0; j <= rings; j++) {
    const eta = -Math.PI / 2 + (Math.PI * j) / rings
    for (let i = 0; i < radial; i++) {
      monolithPoint(eta, (TAU * i) / radial, p)
      const x = p.x * cy + p.z * sy
      const z = -p.x * sy + p.z * cy
      if (!project({ x, y: p.y, z }, W, H, q)) continue
      pts.push({ x: q.x, y: q.y })
      if (q.y < top) top = q.y
      if (q.y > bottom) bottom = q.y
    }
  }
  const span = bottom - top || 1
  for (const pt of pts) {
    let b = Math.floor(((pt.y - top) / span) * bands)
    if (b >= bands) b = bands - 1
    if (pt.x < minX[b]) minX[b] = pt.x
    if (pt.x > maxX[b]) maxX[b] = pt.x
  }
  const f = (v: number) => v.toFixed(1)
  const y = (b: number) => top + ((b + 0.5) / bands) * span
  const parts: string[] = []
  // Right edge, base → cap; then left edge, cap → base.
  for (let b = bands - 1; b >= 0; b--) {
    if (!Number.isFinite(maxX[b])) continue
    parts.push(`${parts.length ? "L" : "M"}${f(maxX[b])} ${f(y(b))}`)
  }
  for (let b = 0; b < bands; b++) {
    if (!Number.isFinite(minX[b])) continue
    parts.push(`L${f(minX[b])} ${f(y(b))}`)
  }
  return parts.join(" ") + " Z"
}
