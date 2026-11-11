/**
 * Validation and payload building for the login-free QuickLeadForm.
 *
 * Kept free of React so the rules can be tested directly and reused by any
 * other form that wants the same "name + Indian mobile + consent" contract.
 */

import type { CaptureLeadPayload } from "@/api/leads";

export const QUICK_LEAD_CONSENT_TEXT = "I agree to be contacted by ProCounsel about counselling";

export interface QuickLeadInput {
  name: string;
  phone: string;
  consent: boolean;
}

export type QuickLeadErrors = Partial<Record<keyof QuickLeadInput, string>>;

/**
 * Reduce what a visitor types to a bare 10-digit Indian mobile, or null.
 *
 * Accepts the forms people actually paste — "98765 43210", "+91 98765-43210",
 * "09876543210", "919876543210" — and rejects anything that is not a mobile
 * number (Indian mobiles start with 6, 7, 8 or 9). The 10-digit form is what
 * OTP login stores, so a lead from this form dedupes against a login lead.
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function validateQuickLead(input: QuickLeadInput): QuickLeadErrors {
  const errors: QuickLeadErrors = {};
  const name = input.name.trim();
  if (name.length < 2) errors.name = "Enter your name";
  else if (!/\p{L}/u.test(name)) errors.name = "Enter a valid name";
  if (!normalizeIndianMobile(input.phone)) errors.phone = "Enter a valid 10-digit mobile number";
  if (!input.consent) errors.consent = "Please agree so a counsellor can contact you";
  return errors;
}

export interface QuickLeadContext {
  /** Page the form was submitted from, e.g. "/engineering-counselling/". */
  pagePath: string;
  /** What the visitor was looking at, e.g. "Engineering Counselling page". */
  intent: string;
  source: string;
  landingPage?: string;
  course?: string;
  exam?: string;
  /** Free text the visitor typed into "what do you need help with". */
  interest?: string;
}

/** Build the captureLead() payload. Assumes the input already validated. */
export function buildQuickLeadPayload(
  input: Pick<QuickLeadInput, "name" | "phone">,
  ctx: QuickLeadContext,
): CaptureLeadPayload {
  const phone = normalizeIndianMobile(input.phone) ?? input.phone.replace(/\D/g, "");
  const [firstName = "", ...rest] = input.name.trim().split(/\s+/);
  const interest = ctx.interest?.trim();
  const defaultInterest = ctx.exam || ctx.course || "";

  const remarks = [
    `Quick lead form on ${ctx.pagePath}`,
    `Intent: ${ctx.intent}`,
    interest && interest !== defaultInterest ? `Needs help with: ${interest}` : "",
    ctx.landingPage ? `Landing page: ${ctx.landingPage}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  const payload: CaptureLeadPayload = {
    phoneNumber: phone,
    firstName,
    lastName: rest.join(" "),
    source: ctx.source || "DIRECT",
    remarks,
  };
  const course = ctx.course || (!ctx.exam && interest ? interest : "");
  if (course) payload.interestedCourseName = course;
  if (ctx.exam) payload.interestedExamName = ctx.exam;
  return payload;
}
