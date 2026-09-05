import type { MetadataRoute } from "next"

import { site } from "@/lib/site.config"

/**
 * sitemap.xml — the site is one page; section anchors are fragments, not
 * URLs, so they are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", site.url).href,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
