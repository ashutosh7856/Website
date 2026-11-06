import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { createForeignStudent } from "@/api/foreignStudent";
import { getTrackedSource } from "@/lib/leadSource";
import { getLoggedInPhone } from "@/lib/phone";
import { useAuthStore } from "@/store/AuthStore";
import {
  BUDGETS,
  DESTINATIONS,
  FIELDS_OF_STUDY,
  INTAKES,
  QUALIFICATIONS,
  STUDY_LEVELS,
  TEST_STATUS,
  startYearOf,
} from "@/lib/studyAbroad";

const ACCENT = "#2F43F2";
const ORANGE = "#FA660F";
const INK = "#0E1629";

interface Props {
  /** Destination slugs currently selected — shared with the board on the page. */
  selected: string[];
  onToggle: (slug: string) => void;
  /** Fired once the session is booked, so the page can drop its floating CTA. */
  onBooked?: () => void;
  id?: string;
  className?: string;
}

type Errors = Partial<Record<"name" | "phone" | "email" | "countries", string>>;

const labelClass = "mb-1.5 block text-[12.5px] font-medium text-gray-600";
const fieldClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15";
const selectClass = `${fieldClass} cursor-pointer appearance-none pr-10`;

/**
 * The single lead form for /study-abroad.
 *
 * Kept to the four things the desk needs to make the call — who you are, how to
 * reach you and where you want to go — with everything else behind one
 * disclosure. A long form on a paid landing page is a bounced click, and the
 * counsellor can ask the rest on the call.
 *
 * The country chips and the comparison board write into the same selection, so
 * a visitor who has been ticking countries finds them already in the form.
 * Submission writes one record through POST /api/foreignStudent/createForeignStudent
 * — the table the admin panel's Study Abroad Leads page reads — with no token,
 * so nobody has to log in to ask for a call back.
 */
export default function StudyAbroadLeadForm({ selected, onToggle, onBooked, id, className = "" }: Props) {
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState<string>(QUALIFICATIONS[0]);
  const [level, setLevel] = useState<string>(STUDY_LEVELS[1]);
  const [intake, setIntake] = useState<string>(INTAKES[0]);
  const [field, setField] = useState("");
  const [testStatus, setTestStatus] = useState<string>(TEST_STATUS[0]);
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prefill for a signed-in visitor so they are not retyping what we have.
  // Every field stays editable — the number they want a call on is not always
  // the number they logged in with.
  useEffect(() => {
    const loginPhone = getLoggedInPhone();
    if (loginPhone) setPhone((p) => p || loginPhone.replace(/\D/g, "").slice(-10));
    if (user?.firstName) setName((n) => n || `${user.firstName} ${user.lastName ?? ""}`.trim());
    if (user?.email) setEmail((e) => e || user.email || "");
  }, [user]);

  const selectedNames = useMemo(
    () => DESTINATIONS.filter((d) => selected.includes(d.slug)).map((d) => d.name),
    [selected],
  );

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "Enter a valid email address";
    if (selected.length === 0) next.countries = "Pick at least one country";
    return next;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(Object.values(found)[0] as string);
      return;
    }

    const digits = phone.replace(/\D/g, "").slice(-10);
    const { source, landingPage } = getTrackedSource();

    setSubmitting(true);

    const remarks = [
      `Study abroad enquiry from ${landingPage || "/study-abroad"}`,
      source ? `Source: ${source}` : "",
      `Countries: ${selectedNames.join(", ")}`,
      `Qualification: ${qualification}`,
      `Applying for: ${level}`,
      `Intake: ${intake}`,
      field ? `Field: ${field}` : "",
      `Tests: ${testStatus}`,
      budget ? `Budget: ${budget}` : "",
      city.trim() ? `City: ${city.trim()}` : "",
    ]
      .filter(Boolean)
      .join(". ");

    /**
     * One submission, one record, in the table the admin panel's Study Abroad
     * Leads page reads — and nowhere else. Sent with no token: this page exists
     * to turn a click into a lead, and a login wall in front of the form costs
     * more enquiries than it could ever protect.
     *
     * Study abroad is a separate desk from the counselling CRM, so a failure
     * here is never quietly filed as a CRM lead: it would land in another
     * team's queue and be worked by people who cannot help this student. The
     * visitor is asked to send it again instead.
     */
    try {
      await createForeignStudent({
        name: name.trim(),
        phone: digits,
        email: email.trim(),
        qualification,
        interestedCountry: selectedNames.join(", "),
        startYear: startYearOf(intake),
        remarks,
      });
    } catch (error) {
      setSubmitting(false);
      console.error("[ProCounsel] Study abroad lead failed:", error);
      toast.error("That did not go through. Check your connection and send it again.");
      return;
    }

    setSubmitting(false);

    // Expose a conversion signal only after the lead has been accepted by the
    // backend. GTM can listen for this custom event and send it to Google Ads
    // once the new conversion action's label has been configured there.
    (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer =
      (window as Window & { dataLayer?: Record<string, unknown>[] }).dataLayer || [];
    (window as Window & { dataLayer: Record<string, unknown>[] }).dataLayer.push({
      event: "study_abroad_lead_submitted",
      form_id: "study_abroad_lead_form",
      lead_source: source || "direct",
    });

    // Count a Google Ads conversion only after the enquiry has been saved.
    // Calling this from the submit button itself would also count invalid and
    // failed submissions, so it intentionally lives after the API request.
    const gtag = (window as Window & {
      gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
    }).gtag;
    if (typeof gtag === "function") {
      gtag("event", "conversion", {
        send_to: "AW-18258760142/_F_gCL-DtYYdEM6juoJE",
        value: 1.0,
        currency: "INR",
      });
    }

    setSubmitted(true);
    onBooked?.();
  };

  if (submitted) {
    return (
      <div
        id={id}
        className={`rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_18px_44px_rgba(14,22,41,0.12)] ${className}`}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${ACCENT}14` }}
        >
          <Check className="h-5 w-5" style={{ color: ACCENT }} />
        </div>
        <h2 className="mt-4 font-[Poppins] text-[20px] font-semibold" style={{ color: INK }}>
          Session booked, {name.trim().split(/\s+/)[0]}.
        </h2>
        <p className="mt-2.5 text-[14px] leading-relaxed text-gray-600">
          A study abroad counsellor will call you back on {phone.replace(/\D/g, "").slice(-10)}.
          The call covers your profile, the countries that fit it and the deadlines you are closest
          to for {selectedNames.join(", ") || "your shortlist"}.
        </p>
        <Link
          to="/counsellor-listing"
          className="mt-5 inline-flex items-center rounded-xl border border-gray-200 px-4 py-2.5 text-[13.5px] font-semibold text-gray-700 transition-colors hover:border-[#2F43F2]/40 hover:text-[#2F43F2]"
        >
          Browse our counsellors while you wait
        </Link>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`overflow-hidden rounded-2xl bg-white shadow-[0_18px_44px_rgba(14,22,41,0.12)] ${className}`}
    >
      <div className="px-6 pt-6 pb-5" style={{ backgroundColor: INK }}>
        <h2 className="font-[Poppins] text-[20px] font-semibold leading-snug text-white">
          Book a <span className="study-free-highlight">free</span> counselling session
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
          Share a few details. A counsellor will call to discuss the countries and courses that fit
          your profile. There is no charge or obligation.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-6">
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="sa-name">
              Full name <span style={{ color: ORANGE }} aria-hidden="true">*</span>
            </label>
            <input
              id="sa-name"
              name="name"
              aria-label="Full name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              placeholder="Your name"
              className={fieldClass}
            />
            {errors.name && <p className="mt-1 text-[12px] text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="sa-phone">
              Mobile number <span style={{ color: ORANGE }} aria-hidden="true">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="flex h-11 shrink-0 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-[14px] text-gray-500">
                +91
              </span>
              <input
                id="sa-phone"
                name="phone"
                aria-label="Mobile number"
                type="tel"
                required
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                aria-invalid={Boolean(errors.phone)}
                placeholder="10-digit number"
                className={fieldClass}
              />
            </div>
            {errors.phone && <p className="mt-1 text-[12px] text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="sa-email">
              Email
            </label>
            <input
              id="sa-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              placeholder="you@example.com"
              className={fieldClass}
            />
            {errors.email && <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>}
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className={labelClass}>
            Where do you want to study?
            {selected.length > 0 && (
              <span className="ml-1 font-normal text-gray-400">{selected.length} selected</span>
            )}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => {
              const on = selected.includes(d.slug);
              return (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => onToggle(d.slug)}
                  aria-pressed={on}
                  className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                    on
                      ? "border-[#2F43F2] bg-[#2F43F2] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#2F43F2]/50 hover:text-[#2F43F2]"
                  }`}
                >
                  <span aria-hidden="true">{d.flag}</span>
                  {d.short}
                </button>
              );
            })}
          </div>
          {errors.countries && <p className="mt-1.5 text-[12px] text-red-600">{errors.countries}</p>}
        </fieldset>

        <div className="mt-5 space-y-4">
          <SelectField
            id="sa-qualification"
            name="qualification"
            label="Highest qualification"
            value={qualification}
            onChange={setQualification}
            options={[...QUALIFICATIONS]}
          />
          <SelectField
            id="sa-intake"
            name="intake"
            label="When do you want to start?"
            value={intake}
            onChange={setIntake}
            options={[...INTAKES]}
          />
        </div>

        {/* Everything the counsellor can also ask on the call lives behind one
            disclosure, so the form stays short for the people who just want the
            call booked. */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          aria-controls="sa-more"
          className="mt-4 flex min-h-[44px] cursor-pointer items-center gap-1.5 text-[13px] font-medium text-gray-500 transition-colors hover:text-[#2F43F2]"
        >
          Add details so the counsellor can prepare
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
        </button>

        <div id="sa-more" hidden={!showMore} className="mt-4 space-y-4">
          <SelectField
            id="sa-level"
            name="level"
            label="What are you applying for?"
            value={level}
            onChange={setLevel}
            options={[...STUDY_LEVELS]}
          />
          <SelectField
            id="sa-field"
            name="field"
            label="Field of study"
            value={field}
            onChange={setField}
            options={[...FIELDS_OF_STUDY]}
            placeholder="Not decided yet"
          />
          <SelectField
            id="sa-test"
            name="testStatus"
            label="IELTS, TOEFL, GRE or GMAT"
            value={testStatus}
            onChange={setTestStatus}
            options={[...TEST_STATUS]}
          />
          <SelectField
            id="sa-budget"
            name="budget"
            label="Budget for the whole degree"
            value={budget}
            onChange={setBudget}
            options={[...BUDGETS]}
            placeholder="Prefer to discuss"
          />
          <div>
            <label className={labelClass} htmlFor="sa-city">
              Your city
            </label>
            <input
              id="sa-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Optional"
              className={fieldClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: ACCENT }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Booking your session
            </>
          ) : (
            "Book my free session"
          )}
        </button>

        <p className="mt-2.5 text-center text-[12px] font-medium text-gray-500">
          Free profile review. No payment needed.
        </p>

        <p className="mt-3.5 text-[11.5px] leading-relaxed text-gray-400">
          By submitting you agree to be contacted by ProCounsel about studying abroad. Read our{" "}
          <Link to="/privacy-policy" className="underline hover:text-gray-600">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Rendered as the empty first option when the field is optional. */
  placeholder?: string;
}

/** Native <select> with the browser chevron replaced, so it matches the inputs. */
function SelectField({ id, name, label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClass}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
      </div>
    </div>
  );
}
