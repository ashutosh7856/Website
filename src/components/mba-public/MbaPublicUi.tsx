import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, ExternalLink, ShieldCheck, UserCheck } from "lucide-react";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import toast from "react-hot-toast";
import type { Cutoff, OfficialSource, Source } from "@/api/mba";
import { useAuthStore, isMbaStudentRole } from "@/store/AuthStore";
import { rememberIntendedCourse } from "@/lib/mbaCourse";
import { trackEvent } from "@/lib/analytics";
import {
  CAT_PATTERN_PATH,
  EDITORIAL_AUTHOR,
  ELIGIBILITY_TOOL_PATH,
  FREE_MOCKS_PATH,
  IIM_CUTOFFS_PATH,
  LAST_VERIFIED,
  MBA_COUNSELLING_PATH,
  MBA_HUB_PATH,
  REVIEWER,
  SCORE_CALCULATOR_PATH,
  formatDay,
  pct,
  type Crumb,
  type Faq,
} from "@/lib/mbaPublic";

/**
 * Building blocks shared by the public MBA / CAT pages. Same visual language as
 * the counselling landing pages: white cards on a cool grey ground, #2F43F2
 * accent, Poppins headings.
 */

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#F4F6FC] pb-16 text-[#0E1629]">{children}</main>;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-5 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      {items.map((c, i) => (
        <span key={c.name} className="inline-flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          {c.to ? (
            <Link to={c.to} className="hover:text-[#2F43F2]">
              {c.name}
            </Link>
          ) : (
            <span className="font-medium text-slate-700" aria-current="page">
              {c.name}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** H1 + the direct answer, straight under it. */
export function Hero({
  crumbs,
  eyebrow,
  title,
  answer,
  updated,
  officialData = true,
  lead = true,
  leadExam = "CAT",
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  /** The one-paragraph answer to the page's question (40–60 words). */
  answer: ReactNode;
  /** "11 Nov 2026"; defaults to the snapshot's last-verified date. */
  updated?: string;
  /** Show the "official sources only" marker (data pages). */
  officialData?: boolean;
  /**
   * Show the login-free callback form at the top of the page (beside the H1 on
   * desktop, under the answer on phones). Leads are the point of these pages, so
   * it is on by default; tool pages turn it off and ask after the result.
   */
  lead?: boolean;
  /** Exam sent with the lead, e.g. "XAT" on the XAT page. */
  leadExam?: string;
  children?: ReactNode;
}) {
  const formId = `mba-top-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return (
    <section className="border-b border-slate-200 bg-white">
      <Container className="pb-9 pt-7 md:pb-12 md:pt-9">
        <Crumbs items={crumbs} />
        <div className={lead ? "lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10" : ""}>
          <div className="min-w-0">
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2F43F2]">{eyebrow}</p>
            <h1 className="mt-2 max-w-3xl font-[Poppins] text-[28px] font-semibold leading-tight sm:text-[36px]">
              {title}
            </h1>
            <div className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-700">{answer}</div>
            <Byline className="mt-4" updated={updated ?? LAST_VERIFIED} />
            {officialData && <VerifiedNote className="ml-0 mt-1 sm:ml-4 sm:mt-0" />}
            {children}
          </div>
          {lead && (
            <aside aria-label="Get MBA admission help" className="mt-6 lg:mt-6">
              <QuickLeadForm
                intent={title}
                course="MBA"
                exam={leadExam}
                formId={formId}
                heading="Get a free MBA counselling call"
                subheading="Tell us where you stand and an MBA counsellor will call you back. Free, no login needed."
              />
            </aside>
          )}
        </div>
      </Container>
    </section>
  );
}

/** Author, reviewer and last-updated date — on every MBA page. */
export function Byline({ updated, className = "" }: { updated: string; className?: string }) {
  return (
    <p className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-slate-500 ${className}`}>
      <UserCheck className="h-4 w-4 text-[#2F43F2]" aria-hidden />
      <span>
        By <span className="font-medium text-slate-700">{EDITORIAL_AUTHOR}</span>
      </span>
      <span aria-hidden>·</span>
      <span>Reviewed by {REVIEWER}</span>
      {updated && (
        <>
          <span aria-hidden>·</span>
          <span>Last updated {updated}</span>
        </>
      )}
    </p>
  );
}

export function VerifiedNote({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[12px] text-slate-500 ${className}`}>
      <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
      Official sources only · last verified {LAST_VERIFIED}
    </p>
  );
}

/** "Source: <title> ↗" — every figure on these pages points at one. */
export function Cite({ source, prefix = "Source" }: { source: Source | null | undefined; prefix?: string }) {
  if (!source) return null;
  return (
    <span className="text-[12px] leading-5 text-slate-500">
      {prefix}:{" "}
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="wrap-anywhere underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]"
        >
          {source.title}
          <ExternalLink className="ml-0.5 inline h-3 w-3 align-[-1px]" aria-hidden />
        </a>
      ) : (
        source.title
      )}
      {" "}· last verified {formatDay(source.retrievedAt) || LAST_VERIFIED}
    </span>
  );
}

export function Section({
  id,
  title,
  children,
  lead,
}: {
  id?: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-[Poppins] text-[21px] font-semibold leading-snug sm:text-[24px]">{title}</h2>
      {lead && <div className="mt-2 max-w-3xl text-[14.5px] leading-7 text-slate-700">{lead}</div>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
}

/** The "these are minimums, not cut-offs" warning, in one consistent box. */
export function MinimumsCaveat({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13.5px] leading-6 text-amber-900">
      <strong>These are minimum eligibility thresholds, not cut-offs.</strong> An IIM publishes them for its
      first, CAT-based shortlisting stage. The percentiles actually needed for an interview call are usually much
      higher, and meeting a minimum never guarantees a call or admission. {children}
    </div>
  );
}

/** Overall and sectional minimums for one record: "95 · 85 / 85 / 85". */
type Figures = Pick<Cutoff, "overall" | "varc" | "dilr" | "qa" | "gender">;

export function ThresholdFigures({ record }: { record: Figures }) {
  const sectional = [record.varc, record.dilr, record.qa];
  const hasSectional = sectional.some((v) => v !== null);
  return (
    <span className="whitespace-nowrap tabular-nums">
      <strong className="font-semibold text-[#0E1629]">{pct(record.overall)}</strong>
      {hasSectional && (
        <span className="text-slate-500">
          {" "}
          · {sectional.map(pct).join(" / ")}
        </span>
      )}
    </span>
  );
}

/** One table cell: a record, or one line per gender, or "not published". */
export function ThresholdCell({ records }: { records: Figures[] }) {
  if (records.length === 0) return <span className="text-slate-400">Not published</span>;
  if (records.length === 1 && !records[0].gender) return <ThresholdFigures record={records[0]} />;
  return (
    <span className="flex flex-col gap-0.5">
      {records.map((r) => (
        <span key={`${r.gender ?? "all"}`} className="whitespace-nowrap">
          <span className="mr-1 text-[11px] font-semibold uppercase text-slate-500">{r.gender ?? "All"}</span>
          <ThresholdFigures record={r} />
        </span>
      ))}
    </span>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {faqs.map((f) => (
        <div key={f.q} className="p-5">
          <h3 className="font-[Poppins] text-[15.5px] font-semibold">{f.q}</h3>
          <p className="mt-2 text-[14px] leading-7 text-slate-700">{f.a}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * "Start free CAT prep": the app lives behind the normal login. A new visitor
 * signs in and lands on onboarding with the MBA course preselected; an MBA
 * student is already in the app (RevampLayout sends them there).
 */
export function StartCatPrepButton({
  className = "",
  label = "Start free CAT prep",
  studentTo,
}: {
  className?: string;
  label?: string;
  /** Where a signed-in MBA student goes on click (e.g. "/mba/mocks"); otherwise nowhere. */
  studentTo?: string;
}) {
  const { isAuthenticated, role, toggleLogin } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onClick = () => {
    trackEvent("free_mock_cta_click", { location: pathname, cta: label, logged_in: isAuthenticated });
    if (isAuthenticated && isMbaStudentRole(role)) {
      if (studentTo) navigate(studentTo);
      return;
    }
    if (isAuthenticated) {
      toast("CAT prep is for accounts registered for MBA. Talk to a counsellor to switch your course.");
      return;
    }
    rememberIntendedCourse("MBA");
    toggleLogin();
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[14.5px] font-semibold text-white shadow-sm transition-colors hover:bg-[#2335d0] ${className}`}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </button>
  );
}

const RELATED = [
  { to: MBA_HUB_PATH, label: "MBA Admission Guide 2027", detail: "Exams, colleges, fees and the process" },
  { to: CAT_PATTERN_PATH, label: "CAT 2026 exam pattern", detail: "Sections, timing, marking, dates" },
  { to: SCORE_CALCULATOR_PATH, label: "CAT score calculator", detail: "Your raw score, official marking" },
  { to: FREE_MOCKS_PATH, label: "Free CAT mock tests", detail: "Full-length and sectional, with solutions" },
  { to: ELIGIBILITY_TOOL_PATH, label: "CAT college predictor", detail: "Your percentile against IIM minimums" },
  { to: IIM_CUTOFFS_PATH, label: "IIM CAT cut-offs", detail: "Official minimums, every category" },
  { to: "/mba-colleges", label: "Best MBA colleges in India", detail: "NIRF ranking and verified profiles" },
  { to: MBA_COUNSELLING_PATH, label: "MBA admission counselling", detail: "Talk to an MBA admissions counsellor" },
];

/** Cross-links between the MBA pages, minus the current one. */
export function RelatedMbaPages({ current }: { current: string }) {
  return (
    <nav aria-label="More MBA and CAT guides" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {RELATED.filter((r) => r.to !== current)
        .slice(0, 4)
        .map((r) => (
          <Link
            key={r.to}
            to={r.to}
            className="group rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#2F43F2]/40"
          >
            <span className="flex items-center justify-between gap-2 font-[Poppins] text-[14.5px] font-semibold group-hover:text-[#2F43F2]">
              {r.label}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </span>
            <span className="mt-1 block text-[12.5px] text-slate-500">{r.detail}</span>
          </Link>
        ))}
    </nav>
  );
}

export function TableWrap({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`border-b border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-slate-600 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-slate-100 px-4 py-3 align-top ${className}`}>{children}</td>;
}

/** "Sources" — every official document a page relies on, linked. */
export function SourcesList({ sources, intro }: { sources: (OfficialSource | Source)[]; intro?: ReactNode }) {
  const seen = new Set<string>();
  const unique = sources.filter((s) => {
    const key = `${s.url ?? ""}|${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length === 0) return null;
  return (
    <Section id="sources" title="Sources">
      <Card>
        <p className="text-[13.5px] text-slate-600">
          {intro ?? <>Official documents used on this page, last checked on {LAST_VERIFIED}.</>}
        </p>
        <ul className="mt-3 space-y-1.5 text-[13px] leading-6">
          {unique.map((s) => (
            <li key={`${s.url}-${s.title}`}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 wrap-anywhere underline decoration-dotted underline-offset-2 hover:text-[#2F43F2]">
                  {s.title}
                </a>
              ) : (
                <span className="text-slate-600">{s.title}</span>
              )}
              {s.year ? <span className="text-slate-400"> ({s.year})</span> : null}
            </li>
          ))}
        </ul>
      </Card>
    </Section>
  );
}

export interface LinkItem {
  to: string;
  label: string;
  detail?: string;
}

/** A grid of internal links (children, siblings) as real anchors. */
export function LinkCards({ items, label }: { items: LinkItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <Link
          key={r.to}
          to={r.to}
          className="group rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-[#2F43F2]/40"
        >
          <span className="flex items-center justify-between gap-2 font-[Poppins] text-[14.5px] font-semibold group-hover:text-[#2F43F2]">
            {r.label}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </span>
          {r.detail && <span className="mt-1 block text-[12.5px] text-slate-500">{r.detail}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** A compact row of chip links. */
export function LinkChips({ items, label }: { items: LinkItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {items.map((r) => (
          <li key={r.to}>
            <Link
              to={r.to}
              className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2]"
            >
              {r.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The end of every MBA page: the callback form, the counselling page and the
 * predictor. ProCounsel offers counselling and college selection — it never
 * promises admission, and the copy here says so.
 */
export function MbaConversion({
  intent,
  formId,
  exam = "CAT",
  heading = "Talk to an MBA admission counsellor",
  subheading = "Get help choosing where to apply after CAT, XAT, SNAP, NMAT, CMAT or MAH-CET, and with direct-admission options at private colleges. Free call, no login needed. We guide; admission decisions are always the institute's.",
}: {
  intent: string;
  formId: string;
  exam?: string;
  heading?: string;
  subheading?: string;
}) {
  return (
    <section aria-label="Get MBA admission help" className="space-y-4">
      <QuickLeadForm intent={intent} course="MBA" exam={exam} formId={formId} heading={heading} subheading={subheading} />
      <div className="flex flex-wrap gap-3">
        <Link
          to={MBA_COUNSELLING_PATH}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2F43F2] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[#2335d0]"
        >
          MBA admission counselling <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          to={ELIGIBILITY_TOOL_PATH}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
        >
          Try the CAT college predictor
        </Link>
      </div>
    </section>
  );
}
