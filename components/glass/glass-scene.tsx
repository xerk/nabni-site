"use client"

import * as React from "react"
import { Environment, Lightformer } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

import { readPalette } from "@/lib/design/palette"
import type { GlassWord } from "@/lib/glass/geometry"

import type { MountController } from "../stele/stele-placement"
import { steleState } from "../stele/stele-state"
import { glassEngine } from "./glass-engine"

/**
 * THE GLASS WORD — scene (DESIGN.md §V3).
 *
 * A drop-in replacement for the relief scene: same props, same placement
 * controller, same light rig. The word is one mesh per glyph sharing a single
 * physical-glass material, so three renders one transmission pass per frame
 * no matter how many letters are on screen.
 *
 * Glyphs assemble from a scattered cloud, staggered in reading order, and the
 * word being replaced dissolves outward at the same time.
 */

export type GlassSceneProps = {
  controller: MountController
  reduced: boolean
  onFirstFrame?: () => void
}

/** Usable fraction of the placement box, in the slab's own 1.0 × 1.5 units. */
const BOX = { width: 0.94, height: 1.34 }
/** Largest a single line of the word may be, in box units. */
const MAX_CAP = 0.46

/** Body colour on the Night grounds, and on Sand where it must read dark. */
const GLASS_LIGHT = new THREE.Color("#f7f3ec")
const GLASS_DARK = new THREE.Color("#3a3128")

/** Distance a glyph starts from its home, in cap heights. */
const SCATTER = 1.9
/** Fraction of the transition each glyph takes; the rest is stagger. */
const GLYPH_SPAN = 0.55

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** Smootherstep: no visible start or stop in a per-glyph tween. */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** Deterministic per-glyph jitter, so a word always assembles the same way. */
function hash(i: number): number {
  const x = Math.sin(i * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function useGlassMaterial(reduced: boolean) {
  return React.useMemo(() => {
    // Crystal, not refracted glass. True `transmission` samples three's
    // transmission buffer, which only contains opaque geometry — and this
    // canvas is a transparent overlay with the page behind it, so there is
    // nothing there to bend. Polished dielectric + iridescent edges + a real
    // amber key reads as glass on every GPU, and the material stays cheap.
    const material = new THREE.MeshPhysicalMaterial({
      // Body colour is written per frame (GLASS_LIGHT → GLASS_DARK by ground).
      color: GLASS_LIGHT.clone(),
      metalness: 0.08,
      roughness: 0.07,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      // The rainbow that sits on a real glass edge.
      iridescence: reduced ? 0 : 0.7,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [120, 520],
      ior: 1.5,
      reflectivity: 0.9,
      specularIntensity: 1,
      envMapIntensity: 1.45,
      // A little of the amber pool behind shows through the body.
      transparent: true,
      opacity: 0.88,
      depthWrite: true,
      side: THREE.FrontSide,
    })
    return material
  }, [reduced])
}

/**
 * A soft amber pool behind the word. Drawn once into a canvas texture; the
 * glass refracts it, and on the page it reads as the sun low behind the glass.
 */
function useBackdrop() {
  const palette = React.useMemo(() => readPalette(), [])
  return React.useMemo(() => {
    const size = 256
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const amber = `#${palette.amber.getHexString()}`
      const gradient = ctx.createRadialGradient(
        size * 0.42,
        size * 0.38,
        0,
        size * 0.5,
        size * 0.5,
        size * 0.55
      )
      gradient.addColorStop(0, amber)
      gradient.addColorStop(0.35, `${amber}66`)
      gradient.addColorStop(1, "#00000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [palette])
}

/** One word rendered as glass; `progress` drives assembly, `exit` dissolves. */
function Word({
  word,
  material,
  progress,
  exit,
  reduced,
}: {
  word: GlassWord
  material: THREE.Material
  progress: React.RefObject<number>
  exit: boolean
  reduced: boolean
}) {
  const meshes = React.useRef<THREE.Mesh[]>([])

  useFrame(() => {
    const p = progress.current ?? 1
    const count = word.glyphs.length
    for (let i = 0; i < count; i++) {
      const mesh = meshes.current[i]
      if (!mesh) continue
      const glyph = word.glyphs[i]
      // Reading-order stagger, normalised so the last glyph still finishes.
      const start = count > 1 ? (i / (count - 1)) * (1 - GLYPH_SPAN) : 0
      const t = reduced ? 1 : ease(clamp01((p - start) / GLYPH_SPAN))
      const away = exit ? t : 1 - t

      if (away <= 0.0005) {
        mesh.position.set(0, 0, 0)
        mesh.rotation.set(0, 0, 0)
        mesh.scale.setScalar(1)
        mesh.visible = true
        continue
      }

      // Scatter outward from the word's centre, with a deterministic wobble.
      const dir = glyph.center
      const len = Math.hypot(dir.x, dir.y) || 1
      const jitter = hash(i)
      const spread = SCATTER * away
      mesh.position.set(
        (dir.x / len) * spread * (0.6 + jitter * 0.8),
        (dir.y / len) * spread * (0.5 + jitter * 0.6) + away * 0.25,
        spread * (0.8 + jitter * 1.4) * (exit ? -1 : 1)
      )
      mesh.rotation.set(
        away * (0.9 + jitter) * (jitter > 0.5 ? 1 : -1),
        away * (1.3 + jitter * 0.8),
        away * 0.4 * (jitter - 0.5)
      )
      mesh.scale.setScalar(Math.max(0.02, 1 - away * 0.55))
      mesh.visible = away < 0.995
    }
  })

  return (
    <group position={word.offset}>
      {word.glyphs.map((glyph, i) => (
        <mesh
          key={i}
          ref={(node) => {
            if (node) meshes.current[i] = node
          }}
          geometry={glyph.geometry}
          material={material}
          castShadow={false}
          receiveShadow={false}
        />
      ))}
    </group>
  )
}

export function GlassScene({
  controller,
  reduced,
  onFirstFrame,
}: GlassSceneProps) {
  const invalidate = useThree((s) => s.invalidate)
  const frameloop = useThree((s) => s.frameloop)
  const palette = React.useMemo(() => readPalette(), [])
  const material = useGlassMaterial(reduced)
  const backdrop = useBackdrop()
  // Per-frame writes go through a ref: the React Compiler rules forbid
  // mutating a value produced by a hook during a render-adjacent call.
  const mat = React.useRef(material)

  const wordGroup = React.useRef<THREE.Group>(null)
  const tiltGroup = React.useRef<THREE.Group>(null)
  const key = React.useRef<THREE.DirectionalLight>(null)
  const halo = React.useRef<THREE.Mesh>(null)
  /** 0 on the Night grounds, 1 on Sand: how smoked the glass is. */
  const tint = React.useRef(0)
  // The controller is a mutable data holder shared with the DOM side; the
  // React Compiler rules forbid writing through a prop, so it is held in a ref.
  const ctl = React.useRef(controller)
  const assemble = React.useRef(1)
  const dissolve = React.useRef(1)
  const first = React.useRef(false)

  // Re-render when the engine swaps words. The subscribe callback must be
  // stable, or React re-subscribes on every render and the mount set churns.
  const version = React.useSyncExternalStore(
    glassEngine.subscribeVersion,
    () => glassEngine.version,
    () => 0
  )

  // Register this canvas so the engine can ask it for a frame.
  React.useEffect(() => glassEngine.addMount({ invalidate }), [invalidate])

  // The stage parks the frameloop at "never" while the word is out of its
  // zone (scrolling past capabilities into work). Resuming the loop does not
  // itself draw, and an `invalidate()` issued before R3F has restarted the
  // loop is dropped — which left the last, empty frame on screen until a
  // reload. Ask for a frame now and on the next two animation frames, by
  // which point the loop is definitely running again.
  React.useEffect(() => {
    if (frameloop === "never") return
    invalidate()
    let second = 0
    const first = requestAnimationFrame(() => {
      invalidate()
      second = requestAnimationFrame(() => invalidate())
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [frameloop, invalidate])
  const current = glassEngine.current
  const outgoing = glassEngine.outgoing

  React.useEffect(() => {
    ctl.current = controller
  }, [controller])

  React.useEffect(() => {
    mat.current = material
  }, [material])

  React.useEffect(() => {
    invalidate()
  }, [version, invalidate])

  React.useEffect(() => () => material.dispose(), [material])
  React.useEffect(() => () => backdrop.dispose(), [backdrop])

  useFrame((state, delta) => {
    assemble.current = glassEngine.assemble
    dissolve.current = glassEngine.dissolve

    // ---- light: the amber sun orbits the word (same rig as the relief)
    const c = ctl.current
    const rise = c.rise
    const targetEl = rise.active ? rise.el : c.targetEl
    const lerp = reduced ? 1 : 1 - Math.pow(0.001, delta)
    c.az += (c.targetAz - c.az) * lerp
    c.el += (targetEl - c.el) * lerp
    const az = ((c.az + c.nudge) * Math.PI) / 180
    const el = (c.el * Math.PI) / 180
    if (key.current) {
      const r = 4
      key.current.position.set(
        r * Math.cos(el) * Math.sin(az),
        r * Math.sin(el),
        r * Math.cos(el) * Math.cos(az)
      )
      key.current.intensity = rise.active ? rise.intensity : c.intensity
    }
    if (c.primary) {
      steleState.az = c.az
      steleState.el = c.el
    }

    // ---- placement: the DOM side writes the target rect every scroll frame
    const group = wordGroup.current
    if (group) {
      const { x, y, scale } = c.target
      group.position.set(x, y, 0)
      // `scale` sizes the 1.0 × 1.5 box the placement controller computes; the
      // word is fitted inside it with a margin so glyphs never touch an edge.
      // Fit inside the box, but cap the cap-height so a four-letter word does
      // not fill the frame: short words need air to read as an object.
      const fit = current
        ? Math.min(
            BOX.width / Math.max(current.width, 0.001),
            BOX.height / Math.max(current.height, 0.001),
            MAX_CAP / Math.max(current.height / current.lines, 0.001)
          )
        : 1
      group.scale.setScalar(scale * fit)
    }

    // The stage wrapper starts at opacity 0 and is driven from shared state:
    // the capabilities exit fades it out, the zone director restores it. The
    // frame step owns the write, so a state change can never be left
    // unpainted (dropping this left the word invisible after scrolling past
    // the capabilities section and back).
    c.applyOpacity(steleState.opacity)

    // The contact section is a Sand ground: pale glass on pale paper is
    // invisible, and the additive halo washes it out. There the word becomes
    // smoked glass instead, and the halo is dropped. The blend is eased so a
    // scroll between grounds never snaps.
    const wantsDark = c.zone === "contact" ? 1 : 0
    tint.current += (wantsDark - tint.current) * (reduced ? 1 : lerp * 0.4)
    const t = tint.current
    const m = mat.current
    m.color.copy(GLASS_LIGHT).lerp(GLASS_DARK, t)
    m.opacity = 0.88 + t * 0.09
    m.envMapIntensity = 1.45 - t * 0.75
    m.metalness = 0.08 + t * 0.12
    if (halo.current) halo.current.visible = t < 0.5

    // ---- drift and pointer tilt: weighted, never jittery
    const tilt = tiltGroup.current
    if (tilt) {
      if (reduced) {
        tilt.rotation.set(0, steleState.yaw, 0)
        tilt.position.y = 0
      } else {
        const t = state.clock.elapsedTime
        const px = (steleState.pointer.x - 0.5) * 0.16
        const py = (steleState.pointer.y - 0.5) * 0.1
        const targetY = steleState.yaw * 0.35 + px + Math.sin(t * 0.28) * 0.03
        const targetX = -py + Math.sin(t * 0.21 + 1.3) * 0.02
        tilt.rotation.y += (targetY - tilt.rotation.y) * lerp * 0.5
        tilt.rotation.x += (targetX - tilt.rotation.x) * lerp * 0.5
        tilt.position.y = Math.sin(t * 0.42) * 0.035
      }
    }

    // Keep the frame loop alive while anything is still easing.
    const settling =
      Math.abs(c.targetAz - c.az) > 0.05 ||
      Math.abs(targetEl - c.el) > 0.05 ||
      glassEngine.assemble < 1 ||
      rise.active
    if (settling || !reduced) invalidate()

    if (!first.current) {
      first.current = true
      c.firstFrameDone = true
      onFirstFrame?.()
    }
  })

  return (
    <>
      {/* Reflections come from lightformers, so nothing is downloaded. */}
      <Environment resolution={256}>
        <color attach="background" args={[palette.pitch]} />
        <Lightformer
          intensity={3.4}
          color={palette.sand}
          position={[0, 4, 2]}
          scale={[9, 2.5, 1]}
        />
        <Lightformer
          intensity={1.9}
          color={palette.amber}
          position={[-4, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 3, 1]}
        />
        <Lightformer
          intensity={1.1}
          color={palette.dune}
          position={[4, -2, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 3, 1]}
        />
      </Environment>

      <directionalLight ref={key} color={palette.sand} intensity={2.4} />
      {/* Amber rim from behind: the sun catching the far edge of the glass. */}
      <directionalLight
        color={palette.amber}
        intensity={2.6}
        position={[-3, 1.4, -3]}
      />
      <hemisphereLight
        args={[palette.dune, palette.pitch, 0.5]}
        position={[0, 1, 0]}
      />

      <group ref={wordGroup}>
        {/* A warm pool behind the word only. Additive, so its edges vanish
            into the page instead of drawing a rectangle over it. */}
        <mesh ref={halo} position={[0, 0, -1.1]} scale={[4, 2.6, 1]}>
          <planeGeometry />
          <meshBasicMaterial
            map={backdrop}
            transparent
            opacity={0.42}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <group ref={tiltGroup}>
          {current ? (
            <Word
              key={`in-${version}`}
              word={current}
              material={material}
              progress={assemble}
              exit={false}
              reduced={reduced}
            />
          ) : null}
          {outgoing ? (
            <Word
              key={`out-${version}`}
              word={outgoing}
              material={material}
              progress={dissolve}
              exit
              reduced={reduced}
            />
          ) : null}
        </group>
      </group>
    </>
  )
}
