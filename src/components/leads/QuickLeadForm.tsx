import { useEffect, useId, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { captureLead } from "@/api/leads";
import { getTrackedSource, isLeadCaptured, markLeadCaptured } from "@/lib/leadSource";
import { getLoggedInPhone } from "@/lib/phone";
import { canonicalPath } from "@/lib/siteUrl.mjs";
import {
  QUICK_LEAD_CONSENT_TEXT,
  buildQuickLeadPayload,
  normalizeIndianMobile,
  validateQuickLead,
  type QuickLeadErrors,
} from "@/lib/quickLead";
import { useAuthStore } from "@/store/AuthStore";

const ACCENT = "#2F43F2";
const INK = "#0E1629";

const labelClass = "mb-1.5 block text-[12.5px] font-medium text-gray-600";
const fieldClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15";

type AnalyticsWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  fbq?: (...args: unknown[]) => void;
};

export interface QuickLeadFormProps {
  /** Short description of the page context, recorded in the lead remarks. */
  intent: string;
  /** Course the page is about, e.g. "Engineering Counselling". Sent as interestedCourseName. */
  course?: string;
  /** Exam the page is about, e.g. "JEE Main". Sent as interestedExamName. */
  exam?: string;
  /** Identifies the placement in analytics, e.g. "counselling_category". */
  formId: string;
  heading?: string;
  subheading?: string;
  className?: string;
}

/**
 * Login-free callback request: name, mobile, consent — one POST to
 * /api/leads/captureLead and a success state.
 *
 * The OTP login CTA on the same page stays; this is for the visitor who wants
 * a call but will not create an account first, which on a landing page is most
 * of them. Deduped per phone on this device with the same localStorage list the
 * login-time capture uses, so a visitor who submits here and later logs in (or
 * the reverse) is one lead, not two.
 */
export default function QuickLeadForm({
  intent,
  course,
  exam,
  formId,
  heading = "Talk to a counsellor",
  subheading = "Leave your number and a ProCounsel counsellor will call you back. Free, no login needed.",
  className = "",
}: QuickLeadFormProps) {
  const uid = useId();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(exam || course || "");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<QuickLeadErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState<string | null>(null);

  // Signed-in visitors should not retype what we already know. Every field
  // stays editable — the number they want a call on may not be the login one.
  useEffect(() => {
    if (!user) return;
    const loginPhone = normalizeIndianMobile(getLoggedInPhone() ?? "");
    if (loginPhone) setPhone((p) => p || loginPhone);
    if (user.firstName) setName((n) => n || `${user.firstName} ${user.lastName ?? ""}`.trim());
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    const found = validateQuickLead({ name, phone, consent });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const digits = normalizeIndianMobile(phone)!;

    // Already sent from this device (here or at login): the desk has the
    // number, so don't create a duplicate — just confirm.
    if (isLeadCaptured(digits)) {
      setSubmittedPhone(digits);
      return;
    }

    const { source, landingPage } = getTrackedSource();
    const pagePath = canonicalPath(pathname);
    const payload = buildQuickLeadPayload(
      { name, phone: digits },
      { pagePath, intent, source, landingPage, course, exam, interest },
    );

    setSubmitting(true);
    try {
      await captureLead(payload);
    } catch (error) {
      console.error("[ProCounsel] Quick lead failed:", error);
      setSubmitError("That did not go through. Check your connection and try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    markLeadCaptured(digits);

    // Conversion signals only after the backend accepted the lead, mirroring
    // the study-abroad predictor (dataLayer custom event + Meta "Lead").
    const w = window as AnalyticsWindow;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event: "quick_lead_submitted",
      form_id: formId,
      lead_source: source || "direct",
      page_path: pagePath,
    });
    if (typeof w.fbq === "function") {
      w.fbq("track", "Lead", { content_name: intent });
    }

    setSubmittedPhone(digits);
  };

  if (submittedPhone) {
    return (
      <div
        className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_12px_32px_rgba(14,22,41,0.08)] ${className}`}
        role="status"
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${ACCENT}14` }}
        >
          <Check className="h-5 w-5" style={{ color: ACCENT }} />
        </div>
        <h2 className="mt-4 font-[Poppins] text-[19px] font-semibold" style={{ color: INK }}>
          Thanks{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ""}. We will call you soon.
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
          A ProCounsel counsellor will call you on {submittedPhone}
          {interest.trim() ? ` about ${interest.trim()}` : ""}.
        </p>
      </div>
    );
  }

  const id = (field: string) => `${uid}-${field}`;

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_12px_32px_rgba(14,22,41,0.08)] ${className}`}
    >
      <h2 className="font-[Poppins] text-[19px] font-semibold leading-snug" style={{ color: INK }}>
        {heading}
      </h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600">{subheading}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4" data-form-id={formId}>
        <div>
          <label className={labelClass} htmlFor={id("name")}>
            Your name
          </label>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? id("name-error") : undefined}
            placeholder="Full name"
            className={fieldClass}
          />
          {errors.name && (
            <p id={id("name-error")} className="mt-1 text-[12px] text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor={id("phone")}>
            Mobile number
          </label>
          <div className="flex items-center gap-2">
            <span className="flex h-11 shrink-0 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-[14px] text-gray-500">
              +91
            </span>
            <input
              id={id("phone")}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 16))}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? id("phone-error") : undefined}
              placeholder="10-digit mobile"
              className={fieldClass}
            />
          </div>
          {errors.phone && (
            <p id={id("phone-error")} className="mt-1 text-[12px] text-red-600">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor={id("interest")}>
            Course or exam <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id={id("interest")}
            name="interest"
            type="text"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. B.Tech, NEET, MBA"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-snug text-gray-600">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#2F43F2]"
            />
            <span>
              {QUICK_LEAD_CONSENT_TEXT}.{" "}
              <Link to="/privacy-policy" className="underline hover:text-gray-800">
                Privacy policy
              </Link>
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-[12px] text-red-600">{errors.consent}</p>}
        </div>

        {submitError && (
          <p className="text-[12.5px] text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Request a call back"
          )}
        </button>
      </form>
    </div>
  );
}
