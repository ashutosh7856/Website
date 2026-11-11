import { useEffect, useId, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowDownUp, CalendarPlus } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import { SrcLink } from "@/components/mba-public/CollegeTable";
import {
  Card,
  Container,
  FaqList,
  Hero,
  LinkChips,
  MbaConversion,
  PageShell,
  RelatedMbaPages,
  Section,
  SourcesList,
  TableWrap,
  Td,
  Th,
} from "@/components/mba-public/MbaPublicUi";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import {
  LAST_VERIFIED,
  LAST_VERIFIED_ISO,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  institutePath,
  isPublished,
  mbaCrumbs,
  type Faq,
} from "@/lib/mbaPublic";
import { buildIcs, deadlineLabel, filterByExam, icsStamp, isPast, sortByDate, type DeadlineRow } from "@/lib/mbaDeadlines";
import { MBA_EXAMS, MBA_PATHS, deadlineRows, examPath } from "@/lib/mbaRoutes.mjs";
import { useAuthStore, isMbaStudentRole } from "@/store/AuthStore";

const PATH = MBA_PATHS.deadlines;
const CRUMBS = mbaCrumbs({ name: "Admission deadlines" });
const ROWS = deadlineRows(MBA_SNAPSHOT);
const examShort = (id: string) => MBA_EXAMS.find((e) => e.id === id)?.short ?? id.toUpperCase();
const EXAMS_PRESENT = MBA_EXAMS.filter((e) => ROWS.some((r) => r.exams.includes(e.id)));
const COLLEGE_ROWS = ROWS.filter((r) => r.kind === "college");
const DEADLINES = COLLEGE_ROWS.filter((r) => r.event === "Application deadline");
const TODAY_AT_BUILD = MBA_SNAPSHOT.retrievedAt ?? "";
const NEXT = DEADLINES.filter((r) => !isPast(r, TODAY_AT_BUILD));

const FAQS: Faq[] = [
  {
    q: "Where do these MBA deadlines come from?",
    a: "Each date is copied from the institute's own admission page or the exam body's bulletin, and the row links to it. We list a date only when an official document states it; dates the institutes have not announced are left out rather than guessed.",
  },
  {
    q: "What does 'tentative' mean?",
    a: "The official source itself calls the date tentative or likely. It can move, so check the linked page before you plan around it.",
  },
  {
    q: "Are interview dates listed?",
    a: "Where an institute publishes its interview or GD-PI window, it appears in the notes of that institute's row, as the institute states it. Most institutes announce exact interview slots only to shortlisted candidates.",
  },
  {
    q: "How do I add a deadline to my calendar?",
    a: "Use the 'Add to calendar' button on a row, or download every date in the current filter at once. The file is a standard .ics calendar that Google Calendar, Apple Calendar and Outlook can import. Month-only dates cannot go in a calendar and are left out of the file.",
  },
  {
    q: "Do I need to apply to colleges separately from CAT?",
    a: "Often, yes. The IIMs use the CAT application itself, but many other institutes (for example FMS Delhi, MDI Gurgaon, SPJIMR, IIFT and IMT) run their own application with their own deadline, sometimes before the CAT result. That is why their deadlines are listed here.",
  },
];

function downloadIcs(rows: DeadlineRow[], filename: string) {
  const blob = new Blob([buildIcs(rows, icsStamp())], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function NameCell({ row }: { row: DeadlineRow }) {
  const to = row.kind === "college" ? institutePath(row.slug) : examPath(row.slug);
  return isPublished(to) ? (
    <Link to={to} className="font-semibold text-[#2F43F2] hover:underline">
      {row.name}
    </Link>
  ) : (
    <span className="font-semibold">{row.name}</span>
  );
}

function DeadlineTable({ rows, today }: { rows: DeadlineRow[]; today: string }) {
  return (
    <TableWrap caption="MBA 2027 admission dates from official sources">
      <thead>
        <tr>
          <Th>Date</Th>
          <Th>Institute or exam</Th>
          <Th>Event</Th>
          <Th>Status</Th>
          <Th>
            <span className="sr-only">Calendar</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const past = today ? isPast(r, today) : false;
          return (
            <tr key={r.id} className={past ? "text-slate-400" : undefined}>
              <Td className="whitespace-nowrap font-semibold tabular-nums">
                {deadlineLabel(r)}
                {r.precision === "month" && <span className="block text-[11px] font-normal text-slate-500">Month only</span>}
              </Td>
              <Td>
                <NameCell row={r} />
                <span className="block text-[11.5px] text-slate-500">{r.exams.map(examShort).join(", ")}</span>
              </Td>
              <Td className="max-w-[360px] text-[13px]">
                {r.event}
                {r.kind === "college" && r.note && (
                  <details className="mt-1 text-[12px] leading-5 text-slate-500">
                    <summary className="cursor-pointer text-slate-600">Interviews and other steps</summary>
                    {r.note}
                  </details>
                )}
              </Td>
              <Td className="whitespace-nowrap text-[12px]">
                <span className={`rounded-md px-2 py-0.5 font-semibold ${r.tentative ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
                  {r.tentative ? "Official, tentative" : "Official"}
                </span>
                {past && <span className="mt-1 block text-slate-400">Passed</span>}
                <span className="mt-1 block">
                  <SrcLink url={r.source.url} label={`${r.name} ${r.event}`} />
                </span>
              </Td>
              <Td>
                {r.precision === "day" && (
                  <button
                    type="button"
                    onClick={() => downloadIcs([r], `${r.id}.ics`)}
                    aria-label={`Add ${r.name}: ${r.event} to calendar`}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2]"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                    Add to calendar
                  </button>
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableWrap>
  );
}

function Page() {
  const uid = useId();
  const [exam, setExam] = useState("all");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  // "Today" and sign-in state are read after mount, so the prerendered HTML matches the first render.
  const [today, setToday] = useState("");
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, role } = useAuthStore();
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
    setMounted(true);
  }, []);
  const rows = sortByDate(filterByExam(ROWS, exam), direction);
  const sources = ROWS.map((r) => r.source);
  const title = "MBA Admission Deadlines 2027: Applications, Exams and Interviews";
  const description = `${ROWS.length} official MBA 2027 admission dates: college application deadlines and CAT, XAT, SNAP, NMAT and MAT dates, each linked to its source.`;
  const showShortlist = mounted && isAuthenticated && isMbaStudentRole(role);

  return (
    <>
      <PageSEO
        title="MBA Admission Deadlines 2027: Official Dates"
        description={description}
        canonical={PATH}
        jsonLd={[
          articleJsonLd({ headline: title, description, path: PATH, dateModified: LAST_VERIFIED_ISO }),
          breadcrumbJsonLd(CRUMBS, PATH),
          faqJsonLd(FAQS),
        ]}
      />
      <PageShell>
        <Hero
          crumbs={CRUMBS}
          eyebrow="MBA 2027 intake · official dates"
          title={title}
          answer={
            <p>
              We track {ROWS.length} dated events for the 2027 MBA intake: {DEADLINES.length} institutes&rsquo; own application
              deadlines and the entrance exams&rsquo; registration, test and result dates. As of {LAST_VERIFIED},{" "}
              {NEXT.length ? `the next college deadline is ${NEXT[0].name}'s on ${deadlineLabel(NEXT[0])}` : "the college deadlines we track have passed"}.
              Every row links to the official page; dates the source calls tentative are flagged.
            </p>
          }
        />
        <Container className="mt-8 space-y-12">
          <Section
            id="deadlines"
            title="When are the MBA application deadlines for 2027?"
            lead={
              <p>
                Institutes&rsquo; application windows and entrance-exam dates, sorted by date. Filter by exam to see only the
                institutes and dates that apply to it. Greyed rows have passed.
              </p>
            }
          >
            <Card className="mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label htmlFor={`${uid}-exam`} className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
                    Filter by exam
                  </label>
                  <select
                    id={`${uid}-exam`}
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-[14px] outline-none focus:border-[#2F43F2] focus:ring-2 focus:ring-[#2F43F2]/15"
                  >
                    <option value="all">All exams ({ROWS.length})</option>
                    {EXAMS_PRESENT.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.short} ({filterByExam(ROWS, e.id).length})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[13.5px] font-semibold text-slate-800 hover:border-[#2F43F2] hover:text-[#2F43F2]"
                >
                  <ArrowDownUp className="h-4 w-4" aria-hidden />
                  {direction === "asc" ? "Earliest first" : "Latest first"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadIcs(rows, `mba-2027-deadlines${exam === "all" ? "" : `-${exam}`}.ics`)}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#2F43F2] px-4 text-[13.5px] font-semibold text-white hover:bg-[#2335d0]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Add these {rows.filter((r) => r.precision === "day").length} dates to your calendar
                </button>
              </div>
              {showShortlist && (
                <p className="mt-3 text-[13px] text-slate-600">
                  Signed in:{" "}
                  <Link to="/mba/shortlist" className="font-medium text-[#2F43F2] underline">
                    open your IIM shortlist
                  </Link>{" "}
                  to check these dates against the colleges you are targeting.
                </p>
              )}
            </Card>
            <DeadlineTable rows={rows} today={today} />
            <p className="mt-2 text-[12.5px] text-slate-500">
              &ldquo;Official&rdquo; = stated in the institute&rsquo;s or exam body&rsquo;s own document; &ldquo;tentative&rdquo; = that
              document calls the date tentative or likely. Last verified {LAST_VERIFIED}.
            </p>
          </Section>

          <Section id="how-to-use" title="How should you plan around these dates?">
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-[14px] leading-7 text-slate-700">
              <li>Several non-IIM institutes close applications before the CAT result, so apply on time even before you know your percentile.</li>
              <li>XAT, SNAP and NMAT need a separate registration for each programme that uses them; the exam registration alone is not an application.</li>
              <li>Confirm every date on the linked official page before paying a fee: institutes extend and reschedule.</li>
            </ul>
            <div className="mt-4">
              <LinkChips
                label="Exam guides"
                items={EXAMS_PRESENT.filter((e) => isPublished(examPath(e.id))).map((e) => ({ to: examPath(e.id), label: `${e.short} exam guide` }))}
              />
            </div>
          </Section>

          <Section id="faq" title="Frequently asked questions">
            <FaqList faqs={FAQS} />
          </Section>

          <RelatedMbaPages current={PATH} />

          <MbaConversion intent="MBA admission deadlines enquiry" formId="mba_deadlines_page" />

          <SourcesList sources={sources} />
        </Container>
      </PageShell>
    </>
  );
}

export default function MbaDeadlines() {
  if (!isPublished(PATH)) return <Navigate to={MBA_PATHS.hub} replace />;
  return <Page />;
}
