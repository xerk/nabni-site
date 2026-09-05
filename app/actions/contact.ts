"use server"

import { z } from "zod"

import { site } from "@/lib/site.config"

const BUDGETS = [
  "under-50k",
  "50k-150k",
  "150k-500k",
  "500k-plus",
  "undecided",
] as const

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Keep your name under 80 characters."),
  email: z.email("Add the part after @ in your email."),
  company: z
    .string()
    .trim()
    .max(120, "Keep the organisation under 120 characters.")
    .optional()
    .or(z.literal("")),
  budget: z.enum(BUDGETS).optional().or(z.literal("")),
  project: z
    .string()
    .trim()
    .min(12, "Tell us in a sentence what you want to build.")
    .max(4000, "Keep it under 4000 characters."),
  // Honeypot. Real visitors never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
})

export type ContactFields = z.infer<typeof contactSchema>

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error"
      message: string
      fieldErrors?: Partial<Record<keyof ContactFields, string>>
    }

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

async function deliver(fields: ContactFields): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from =
    process.env.CONTACT_FROM_EMAIL ?? `${site.name} <onboarding@resend.dev>`

  if (!apiKey || !to) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("not-configured")
    }
    console.warn(
      "[contact] RESEND_API_KEY / CONTACT_TO_EMAIL not set. Submission logged only:",
      fields
    )
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: fields.email,
      subject: `New project inquiry from ${fields.name}`,
      html: `
        <h2>New inquiry via ${escapeHtml(site.name)}</h2>
        <p><strong>Name:</strong> ${escapeHtml(fields.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(fields.company || "-")}</p>
        <p><strong>Budget:</strong> ${escapeHtml(fields.budget || "-")}</p>
        <p><strong>Project:</strong></p>
        <p>${escapeHtml(fields.project).replaceAll("\n", "<br/>")}</p>
      `,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error("[contact] Resend rejected the message:", res.status, body)
    throw new Error("delivery-failed")
  }
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = contactSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ContactFields, string>> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFields | undefined
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors,
    }
  }

  // Honeypot filled: pretend success so bots learn nothing.
  if (parsed.data.website) return { status: "success" }

  try {
    await deliver(parsed.data)
    return { status: "success" }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown"
    if (reason === "not-configured") {
      return {
        status: "error",
        message: `The form is not connected yet. Email us at ${site.contact.email}.`,
      }
    }
    return {
      status: "error",
      message: `We could not send your message. Email us at ${site.contact.email}.`,
    }
  }
}
