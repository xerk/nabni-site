import type { MetadataRoute } from "next"

import { site } from "@/lib/site.config"

/**
 * robots.txt — everything is crawlable except the dev-only routes
 * (app/dev/*, which 404 outside development anyway).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/dev",
    },
    sitemap: new URL("/sitemap.xml", site.url).href,
  }
}
