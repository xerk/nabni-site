import type { Metadata, Viewport } from "next"
import {
  Anybody,
  IBM_Plex_Sans_Arabic,
  Martian_Mono,
  Reem_Kufi,
} from "next/font/google"

import "./globals.css"

import { Cursor } from "@/components/cursor/cursor"
import { SmoothScroll } from "@/components/providers/smooth-scroll"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { site } from "@/lib/site.config"
import { cn } from "@/lib/utils"

/**
 * Fonts — DESIGN.md §3.1.
 * `axes: ["wdth"]` is mandatory on Anybody and Martian Mono: without it the
 * width axis is stripped and the whole width system silently disappears.
 * Client code that needs a family name for canvas reads the CSS variable
 * (see lib/design/fonts.ts); never write a literal family name.
 */
const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-anybody",
  display: "swap",
})

const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-reem-kufi",
  display: "swap",
})

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
})

const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-martian",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn(
        anybody.variable,
        reemKufi.variable,
        plexArabic.variable,
        martianMono.variable,
        "antialiased"
      )}
    >
      <body>
        <ThemeProvider forcedTheme="light" enableSystem={false}>
          <DirectionProvider direction="ltr">
            <TooltipProvider>
              <SmoothScroll>
                <a href="#content" className="skip-link">
                  Skip to content
                </a>
                {children}
                <Cursor />
                <Toaster position="bottom-left" />
              </SmoothScroll>
            </TooltipProvider>
          </DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
