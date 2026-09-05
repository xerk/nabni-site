"use client"

import { useSyncExternalStore } from "react"

/**
 * `document.fonts.ready` as an external store, so the canvas can mount after
 * the fonts settle without setting React state inside an effect.
 */
let ready = false
let started = false
const listeners = new Set<() => void>()

function start() {
  if (started || typeof document === "undefined") return
  started = true
  const done = () => {
    ready = true
    for (const l of listeners) l()
  }
  if ("fonts" in document) document.fonts.ready.then(done, done)
  else done()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
  }
}

export function useFontsReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false
  )
}
