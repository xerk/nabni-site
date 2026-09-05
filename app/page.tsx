import { Capabilities } from "@/components/sections/capabilities"
import { Contact } from "@/components/sections/contact"
import { Footer } from "@/components/sections/footer"
import { Hero } from "@/components/sections/hero"
import { Kingdom } from "@/components/sections/kingdom"
import { Nav } from "@/components/sections/nav"
import { Team } from "@/components/sections/team"
import { Work } from "@/components/sections/work"
import { SteleStage } from "@/components/stele/stele"

/**
 * Page order and grounds (DESIGN.md §5):
 * hero (palm) → capabilities (palm) → work (limestone) → team (palm)
 * → kingdom (palm) → contact (limestone).
 *
 * The hero is pinned by ScrollTrigger on fine pointers, which re-parents its
 * <section> into a pin-spacer. It therefore lives in a wrapper of its own so
 * React never has to insert a sibling next to a node GSAP has moved. The
 * stele stage mounts after fonts load and is the last child of <main> for
 * the same reason (appended, never inserted before a pinned node).
 */
export default function Page() {
  return (
    <>
      <Nav />
      <main id="content" className="relative">
        <div data-pin-root>
          <Hero />
        </div>
        <Capabilities />
        <Work />
        <Team />
        <Kingdom />
        <Contact />
        <SteleStage />
      </main>
      <Footer />
    </>
  )
}
