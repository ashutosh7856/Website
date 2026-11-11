import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import type { EligibilityPart, EligibilityResponse, EligibilityResult, EligibilityStatus } from "@/api/mba";
import { formatDay, pct } from "@/lib/mbaPublic";

const STATUS: Record<EligibilityStatus, { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  meets_minimum: { label: "Meets the published minimum", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  unknown: { label: "Can't tell yet", tone: "border-slate-200 bg-slate-50 text-slate-700", icon: HelpCircle },
  below_minimum: { label: "Below the published minimum", tone: "border-rose-200 bg-rose-50 text-rose-800", icon: XCircle },
};

const ORDER: EligibilityStatus[] = ["meets_minimum", "unknown", "below_minimum"];

const partLabel = (p: EligibilityPart) => (p === "overall" ? "Overall" : p);

function ResultRow({
  r,
  institutePathFor,
  actions,
}: {
  r: EligibilityResult;
  institutePathFor?: (slug: string) => string | null;
  actions?: ReactNode;
}) {
  const s = STATUS[r.status];
  const Icon = s.icon;
  const href = institutePathFor?.(r.slug) ?? null;
  const title = `${r.shortName}${r.programCode ? ` · ${r.programCode}` : ""}`;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${r.status === "meets_minimum" ? "text-emerald-600" : r.status === "below_minimum" ? "text-rose-600" : "text-slate-400"}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-[Poppins] text-[15px] font-semibold text-[#0E1629]">
            {href ? (
              <Link to={href} className="hover:text-[#2F43F2] hover:underline">
                {title}
              </Link>
            ) : (
              title
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {r.programName ?? r.name}
            {r.policyBatch ? ` · ${r.policyBatch} policy` : ""}
          </p>
          {r.failedOn.length > 0 && (
            <p className="mt-2 text-[13px] text-rose-700">Below the minimum on: {r.failedOn.map(partLabel).join(", ")}</p>
          )}
          {r.notChecked.length > 0 && (
            <p className="mt-2 text-[13px] text-slate-600">
              Not checked (add your percentile): {r.notChecked.map(partLabel).join(", ")}
            </p>
          )}
          {r.thresholds && (
            <p className="mt-2 text-[13px] text-slate-700">
              Minimums used: overall {pct(r.thresholds.overall)} · VARC {pct(r.thresholds.varc)} · DILR{" "}
              {pct(r.thresholds.dilr)} · QA {pct(r.thresholds.qa)}
            </p>
          )}
          {r.notes && <p className="mt-2 text-[12.5px] leading-5 text-slate-500">{r.notes}</p>}
          {r.source && (
            <p className="mt-2 text-[12px] text-slate-500">
              Source:{" "}
              <a href={r.source.url} target="_blank" rel="noopener noreferrer" className="wrap-anywhere underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]">
                {r.source.title}
              </a>
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </li>
  );
}

/**
 * POST /eligibility results: counts, then one group per status, with the API's
 * methodology and limitations verbatim beside them.
 */
export default function EligibilityResults({
  response,
  institutePathFor,
  renderActions,
}: {
  response: EligibilityResponse;
  institutePathFor?: (slug: string) => string | null;
  renderActions?: (r: EligibilityResult) => ReactNode;
}) {
  const { counts, results } = response;
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-3">
        {ORDER.map((status) => {
          const s = STATUS[status];
          return (
            <div key={status} className={`rounded-xl border p-4 ${s.tone}`}>
              <p className="text-[26px] font-semibold tabular-nums">{counts[status]}</p>
              <p className="text-[13px] font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
        <p className="flex items-center gap-1.5 font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden /> Limitations
        </p>
        <p className="mt-1">{response.limitations}</p>
      </div>

      {ORDER.map((status) => {
        const group = results.filter((r) => r.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status}>
            <h3 className="font-[Poppins] text-[16px] font-semibold text-[#0E1629]">
              {STATUS[status].label} ({group.length})
            </h3>
            <ul className="mt-3 space-y-2.5">
              {group.map((r) => (
                <ResultRow
                  key={`${r.slug}-${r.programCode ?? ""}`}
                  r={r}
                  institutePathFor={institutePathFor}
                  actions={renderActions?.(r)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-6 text-slate-700">
        <p className="font-semibold text-[#0E1629]">How this was checked</p>
        <p className="mt-1">{response.methodology}</p>
        <p className="mt-2 text-[12px] text-slate-500">
          {response.dataFreshness.note}
          {response.dataFreshness.retrievedAt ? ` Retrieved ${formatDay(response.dataFreshness.retrievedAt)}.` : ""}
          {response.dataFreshness.cutoffPolicyBatches.length
            ? ` Policy batches: ${response.dataFreshness.cutoffPolicyBatches.join(", ")}.`
            : ""}
        </p>
      </div>
    </div>
  );
}
