import { useId, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { MBA_CATEGORIES, type MbaCategory, type MbaGender } from "@/api/mba";
import {
  cleanPercentile,
  type EligibilityDraft,
  type EligibilityErrors,
} from "@/lib/mbaEligibilityInput";

const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15";
const labelClass = "mb-1.5 block text-[12.5px] font-medium text-slate-600";

const GENDERS: { id: MbaGender | ""; label: string }[] = [
  { id: "", label: "Prefer not to say" },
  { id: "Female", label: "Female" },
  { id: "Male", label: "Male" },
  { id: "Transgender", label: "Transgender" },
];

/**
 * Category, PwD, gender and the four percentiles. Controlled: the parent owns
 * the draft, validation and the request. Used by the public tool and by the
 * student app's Colleges page.
 */
export default function EligibilityForm({
  draft,
  errors,
  onChange,
  onSubmit,
  pending,
  submitLabel = "Check against IIM minimums",
}: {
  draft: EligibilityDraft;
  errors: EligibilityErrors;
  onChange: (next: EligibilityDraft) => void;
  onSubmit: () => void;
  pending: boolean;
  submitLabel?: string;
}) {
  const uid = useId();
  const set = <K extends keyof EligibilityDraft>(key: K, value: EligibilityDraft[K]) =>
    onChange({ ...draft, [key]: value });

  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const percentileField = (key: "overall" | "varc" | "dilr" | "qa", label: string, hint: string) => (
    <div>
      <label htmlFor={`${uid}-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`${uid}-${key}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={hint}
        value={draft[key]}
        onChange={(e) => set(key, cleanPercentile(e.target.value))}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${uid}-${key}-err` : undefined}
        className={fieldClass}
      />
      {errors[key] && (
        <p id={`${uid}-${key}-err`} className="mt-1 text-[12px] text-red-600">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handle} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`${uid}-category`} className={labelClass}>
            Category
          </label>
          <select
            id={`${uid}-category`}
            value={draft.category}
            onChange={(e) => set("category", e.target.value as MbaCategory)}
            className={fieldClass}
          >
            {MBA_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-gender`} className={labelClass}>
            Gender <span className="font-normal text-slate-400">(some IIMs set separate minimums)</span>
          </label>
          <select
            id={`${uid}-gender`}
            value={draft.gender}
            onChange={(e) => set("gender", e.target.value as MbaGender | "")}
            className={fieldClass}
          >
            {GENDERS.map((g) => (
              <option key={g.id || "none"} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 self-end rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-700">
          <input
            type="checkbox"
            checked={draft.pwd}
            onChange={(e) => set("pwd", e.target.checked)}
            className="h-4 w-4 accent-[#2F43F2]"
          />
          PwD / PwBD candidate
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {percentileField("overall", "Overall percentile *", "e.g. 96.4")}
        {percentileField("varc", "VARC percentile", "optional")}
        {percentileField("dilr", "DILR percentile", "optional")}
        {percentileField("qa", "QA percentile", "optional")}
      </div>
      <p className="text-[12px] leading-5 text-slate-500">
        Use the percentiles on your CAT scorecard. Leave a section blank if you do not have it yet; IIMs that set a
        minimum for that section will show as &ldquo;not checked&rdquo; rather than pass.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2335d0] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Checking…" : submitLabel}
      </button>
    </form>
  );
}
