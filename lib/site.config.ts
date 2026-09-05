/**
 * Single source of truth for brand facts. Change the name here and it
 * propagates to metadata, the wordmark, the footer and the contact action.
 */
export const site = {
  name: "Nabni",
  /** Arabic wordmark: "we build". */
  nameAr: "نبني",
  legalName: "Nabni",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nabni.sa",
  title: "Nabni — Engineering studio in Riyadh",
  description:
    "In-house engineers in Riyadh who ship web, mobile, desktop and AI systems for founders, enterprises and government programs.",
  locale: "en",
  location: {
    city: "Riyadh",
    country: "Saudi Arabia",
    countryAr: "المملكة العربية السعودية",
    timezone: "Asia/Riyadh",
    /** One mono line: base facts. */
    line: "Riyadh, Saudi Arabia · AST (UTC+3) · Sun–Thu",
  },
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@nabni.sa",
    /** Booking link shown on the primary CTA. Replace with Cal.com / Calendly. */
    bookingUrl: process.env.NEXT_PUBLIC_BOOKING_URL ?? "#contact",
    cta: "Book a build call",
    ctaShort: "Book a call",
  },
  social: {
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
    x: "https://x.com/",
  },
  nav: [
    { label: "Work", href: "#work" },
    { label: "Capabilities", href: "#capabilities" },
    { label: "Team", href: "#team" },
    { label: "Riyadh", href: "#kingdom" },
    { label: "Contact", href: "#contact" },
  ],
  /** Feature flag reserved for the Arabic locale; not implemented yet. */
  enableArabic: process.env.NEXT_PUBLIC_ENABLE_AR === "1",
} as const

export type SiteConfig = typeof site
