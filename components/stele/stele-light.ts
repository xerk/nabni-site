/**
 * THE STELE — light rig constants (DESIGN.md §V2, §4.2).
 *
 * Night edition: the slab is basalt, the key light is the amber sun and the
 * hemisphere is a warm dark sky over a pitch ground. Pure numbers, shared by
 * the scene (which builds the lights) and the placement controller (which
 * tweens the load rise toward the full key intensity).
 *
 * three r155+ lights are physically based (radiance = albedo · E / π), so
 * every intensity below is a legacy-scale value multiplied by π: a fully lit
 * face then shows the material colour times the light colour.
 */
export const LIGHT_SCALE = Math.PI

/** Key light (the sun), legacy scale 2.6. */
export const KEY_INTENSITY = 2.6 * LIGHT_SCALE
/**
 * The key is amber pulled a little toward sand (linear lerp). Under a pure
 * amber spectrum a sand-tinted cell can only ever be ochre; a hair of sand in
 * the light keeps the word reading as pale stone lit by a low sun.
 */
export const KEY_WARMTH = 0.3

/** Hemisphere: sky = night lifted toward dune (linear lerp), ground = pitch. */
export const HEMI_INTENSITY = 0.7 * LIGHT_SCALE
export const SKY_LIFT = 0.4

/**
 * Contact zone (stage over the sand ground, and the coarse in-flow contact
 * canvas): basalt reads muddy against sand under the hero rig, so the key
 * and the sky are lifted there.
 */
export const CONTACT_KEY_GAIN = 1.3
export const CONTACT_HEMI_GAIN = 1.6
