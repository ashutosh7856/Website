import type { MbaCategory, OfficialSource, Source } from "@/api/mba";
import { CAT_PREP_GUIDES } from "@/content/mbaPrepGuides";
import { MBA_SNAPSHOT } from "@/data/mbaSnapshot";
import type { MbaCollege } from "@/data/mbaSnapshotTypes";
import {
  ALL_COLLEGES,
  CAT_2026_KEY_DATES,
  CAT_LATEST,
  MBA_INSTITUTES,
  NIRF,
  cutoffSources,
  describeMinimum,
  examInfo,
  flagship,
  formatInr,
  formatLakh,
  getInstitute,
  isPublished,
  joinNames,
  overallRange,
  thresholdRows,
  type Faq,
} from "@/lib/mbaPublic";
import {
  MBA_PATHS,
  MBA_PERCENTILES,
  bandCount,
  bandFigure,
  collegePath,
  examPath,
  percentilePath,
  specialisationPath,
} from "@/lib/mbaRoutes.mjs";

/**
 * Original MBA guides (docs/MBA-SEO-BLUEPRINT.md, "Guides"). Every number in
 * here is computed from the official snapshot and cited in the page's Sources;
 * where our data has no figure the copy says it in words. Nothing here promises
 * admission, a placement or a salary.
 *
 * A guide listed here is published: its path must also be in MBA_GUIDE_PATHS
 * (src/lib/mbaRoutes.mjs) — src/test/mbaRoutes.test.ts pins the two together.
 */

export interface GuideTable {
  caption: string;
  head: string[];
  rows: string[][];
}

export interface GuideSection {
  /** Question-style H2. */
  h2: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: GuideTable;
  /** Internal links shown under the section (only published ones render). */
  links?: { to: string; label: string }[];
}

export interface MbaGuide {
  path: string;
  /** Rendered title is `${seoTitle} | ProCounsel`; keep it ≤ 47 characters. */
  seoTitle: string;
  description: string;
  h1: string;
  /** The 40–60 word answer straight under the H1. */
  answer: string;
  cardDetail: string;
  updated: string;
  /** "prep" for exam-preparation guides (mbaPrepGuides.ts); admission and decision guides leave it out. */
  group?: "prep";
  /** Three or four one-line points shown in a "Key takeaways" box under the answer. */
  takeaways?: string[];
  /** Exam sent with leads from this guide (defaults to CAT). */
  leadExam?: string;
  sections: GuideSection[];
  faqs: Faq[];
  sources: (OfficialSource | Source)[];
}

const UPDATED = "2026-11-11";

// ── Facts from the snapshot, phrased once ─────────────────────────────────────

const named = (slug: string): MbaCollege | undefined => getInstitute(slug);
const feeOf = (c: MbaCollege | undefined) => (c ? flagship(c)?.feeTotal ?? null : null);
const policySource = (c: MbaCollege | undefined): OfficialSource | null =>
  c ? c.cutoffs[0]?.source ?? flagship(c)?.feeSource ?? c.sources[0] ?? null : null;
const feeSource = (c: MbaCollege | undefined) => (c ? flagship(c)?.feeSource ?? null : null);
const present = <T,>(xs: (T | null | undefined)[]): T[] => xs.filter((x): x is T => x !== null && x !== undefined);

const IIM_FEES = MBA_INSTITUTES.map((i) => ({ i, fee: feeOf(i) })).filter((x): x is { i: MbaCollege; fee: number } => x.fee !== null);
const IIM_FEE_MIN = IIM_FEES.length ? IIM_FEES.reduce((a, b) => (b.fee < a.fee ? b : a)) : null;
const IIM_FEE_MAX = IIM_FEES.length ? IIM_FEES.reduce((a, b) => (b.fee > a.fee ? b : a)) : null;
const GENERAL = overallRange("General");
const IIM_COUNT = MBA_INSTITUTES.length;

const FMS = named("fms-delhi");
const MDI = named("mdi-gurgaon");
const SPJIMR = named("spjimr-mumbai");
const IIMA = named("iim-ahmedabad");
const IIM_INDORE = named("iim-indore");
const IIM_CALCUTTA = named("iim-calcutta");

const PGDM_SCHOOLS = ALL_COLLEGES.filter((c) => flagship(c)?.code.startsWith("PGDM"));
const IIM_PROGRAMME_NAMES = present([IIM_INDORE, IIM_CALCUTTA].map((c) => (c ? `${c.shortName}: “${flagship(c)?.name}”` : null)));

const feePhrase = (c: MbaCollege | undefined) => {
  const fee = feeOf(c);
  return c && fee !== null ? `${c.shortName} states ${formatLakh(fee)} for its ${flagship(c)?.code}` : null;
};

const selectionTable = (c: MbaCollege | undefined): GuideTable | undefined =>
  c && c.selectionProcess.length
    ? {
        caption: `${c.shortName} selection process (from its official admission document)`,
        head: ["Stage", "What happens", "Weightage"],
        rows: c.selectionProcess.map((s) => [String(s.stage), s.name, s.weightage ?? "Not published"]),
      }
    : undefined;

// ── Facts for the decision, IIM and interview guides ──────────────────────────

/** CAT tools that live outside the MBA route list; guides link them directly. */
export const CAT_SCORE_CALCULATOR_PATH = "/cat-score-calculator";
export const FREE_CAT_MOCK_PATH = "/free-cat-mock-test";
export const GUIDE_TOOL_PATHS: readonly string[] = [CAT_SCORE_CALCULATOR_PATH, FREE_CAT_MOCK_PATH];

const IIM_BANGALORE = named("iim-bangalore");
const IIM_KOZHIKODE = named("iim-kozhikode");
const IIM_SHILLONG = named("iim-shillong");
const IIM_UDAIPUR = named("iim-udaipur");
const IIM_SAMBALPUR = named("iim-sambalpur");
const IIM_AMRITSAR = named("iim-amritsar");
const IIM_BODH_GAYA = named("iim-bodh-gaya");
const IIM_RAIPUR = named("iim-raipur");
const IIM_RANCHI = named("iim-ranchi");
const IIM_TRICHY = named("iim-tiruchirappalli");
const IIM_VIZAG = named("iim-visakhapatnam");
const IIM_LUCKNOW = named("iim-lucknow");
const IIM_ROHTAK = named("iim-rohtak");
const DMS = named("dms-iit-delhi");
const SJMSOM = named("sjmsom-iit-bombay");
const IIFT = named("iift-delhi");
const KJSIM = named("kjsim-mumbai");
const SIBM = named("sibm-pune");
const SCMHRD = named("scmhrd-pune");
const IMT = named("imt-ghaziabad");
const IMI = named("imi-delhi");
const GREAT_LAKES = named("great-lakes-chennai");
const NMIMS = named("nmims-mumbai");
const WESCHOOL = named("welingkar-mumbai");

const catFact = (label: string) => examInfo("cat")?.facts.find((f) => f.label === label) ?? null;
const examEligibility = (id: string) => examInfo(id)?.facts.find((f) => f.label === "Eligibility") ?? null;
const CAT_ELIGIBILITY = catFact("Eligibility");
/** Guards the one hand-written summary of CAT eligibility against the official text it summarises. */
const CAT_ELIGIBILITY_SAYS_50 = Boolean(CAT_ELIGIBILITY?.value.includes("50%") && CAT_ELIGIBILITY.value.includes("45% for SC, ST and PwBD"));
const CAT_ACCEPTS_PROFESSIONAL = Boolean(CAT_ELIGIBILITY?.value.includes("CA/CS/ICWA"));
const CAT_DATE = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const CAT_RESULT = CAT_2026_KEY_DATES.find((d) => d.label === "Result");
const MCQ_MARKING = CAT_LATEST.marking.find((m) => m.type === "MCQ");
const TITA_MARKING = CAT_LATEST.marking.find((m) => m.type === "TITA");

/** A point an IIM's own policy makes, kept only when the note recorded from that policy says it. */
interface PolicyPoint {
  c: MbaCollege;
  text: string;
  batch: string;
  source: OfficialSource;
}
const policyPoint = (c: MbaCollege | undefined, says: RegExp, text: string): PolicyPoint | null => {
  const rec = c?.cutoffs.find((x) => x.notes !== null && says.test(x.notes));
  return c && rec ? { c, text, batch: rec.policyBatch, source: rec.source } : null;
};

/** The General, non-PwD overall figure an IIM places applicants by (male/all-gender row). */
const generalOverall = (c: MbaCollege | undefined): number | null => {
  if (!c) return null;
  const rows = thresholdRows(c, "General", false);
  const figures = rows.map((r) => bandFigure(r.records)).filter((v): v is number => v !== null);
  return figures.length ? Math.min(...figures) : null;
};
const generalMinimumPhrase = (c: MbaCollege | undefined): string | null => {
  const row = c ? thresholdRows(c, "General", false)[0] : undefined;
  return row ? describeMinimum(row.records) : null;
};

const IIM_AT_OR_BELOW_90 = MBA_INSTITUTES.filter((i) => {
  const f = generalOverall(i);
  return f !== null && f <= 90;
});

const CATEGORIES: MbaCategory[] = ["General", "EWS", "NC-OBC", "SC", "ST"];
const CATEGORY_RANGES = CATEGORIES.map((category) => ({ category, range: overallRange(category) })).filter(
  (x) => Number.isFinite(x.range.min) && Number.isFinite(x.range.max),
);

const PUBLISHED_BANDS = MBA_PERCENTILES.filter((p) => isPublished(percentilePath(p)));

const medianOf = (c: MbaCollege | undefined) => {
  const p = c ? flagship(c) : undefined;
  return p && p.medianSalary !== null && p.salarySource ? { value: p.medianSalary, year: p.medianSalaryYear, source: p.salarySource } : null;
};

/** A spread of institutes that publish both a sourced fee and a sourced median salary. */
const FEE_VS_MEDIAN = present([IIMA, IIM_LUCKNOW, IIM_ROHTAK, IIM_VIZAG, FMS, MDI, SIBM, KJSIM, WESCHOOL])
  .map((c) => ({ c, fee: feeOf(c), feeSrc: feeSource(c), median: medianOf(c) }))
  .filter((x): x is { c: MbaCollege; fee: number; feeSrc: OfficialSource; median: NonNullable<ReturnType<typeof medianOf>> } =>
    x.fee !== null && x.feeSrc !== null && x.median !== null,
  );

const stageWeights = (c: MbaCollege | undefined, stage: number): string | null =>
  c?.selectionProcess.find((s) => s.stage === stage)?.weightage ?? null;
const hasStage = (c: MbaCollege | undefined, name: RegExp): boolean => Boolean(c?.selectionProcess.some((s) => name.test(s.name)));
const stageDetail = (c: MbaCollege | undefined, says: RegExp): string | null =>
  c?.selectionProcess.find((s) => s.detail && says.test(s.detail))?.detail ?? null;

/** Final-merit weights as each institute publishes them; institutes that publish none are left out. */
const FINAL_WEIGHTS = present([
  DMS && stageWeights(DMS, 3) ? { c: DMS, rounds: "Personal interview", weights: stageWeights(DMS, 3)! } : null,
  FMS && stageWeights(FMS, 3) ? { c: FMS, rounds: "SOP discussion, extempore and interview", weights: stageWeights(FMS, 3)! } : null,
  MDI && stageWeights(MDI, 2) ? { c: MDI, rounds: "WAT, GD, behavioural test and interview", weights: stageWeights(MDI, 2)! } : null,
  SJMSOM && stageWeights(SJMSOM, 2) ? { c: SJMSOM, rounds: "Personal interview", weights: stageWeights(SJMSOM, 2)! } : null,
  KJSIM && stageWeights(KJSIM, 3) && stageWeights(KJSIM, 4)
    ? { c: KJSIM, rounds: "WAT, problem situation analysis and interview", weights: `WAT ${stageWeights(KJSIM, 3)}; ${stageWeights(KJSIM, 4)}` }
    : null,
  SIBM && SIBM.selectionProcess.every((s) => s.weightage)
    ? { c: SIBM, rounds: "Group exercise and personal interaction", weights: SIBM.selectionProcess.map((s) => `${s.name}: ${s.weightage}`).join("; ") }
    : null,
]);

/** Selection rounds that go beyond the classic WAT-GD-PI, as institutes name them. */
const OTHER_FORMATS = present([
  hasStage(FMS, /Extempore/) && FMS ? `${FMS.shortName}: a discussion on your statement of purpose and an extempore, alongside the interview.` : null,
  hasStage(MDI, /Behavioural Assessment/) && MDI ? `${MDI.shortName}: a behavioural assessment test in addition to WAT, GD and interview.` : null,
  hasStage(KJSIM, /Problem Situation Analysis/) && KJSIM ? `${KJSIM.shortName}: a problem situation analysis (PSA) with the interview.` : null,
  hasStage(IMT, /Critical Thinking Test/) && IMT ? `${IMT.shortName}: a critical thinking test with the interview (CTPI).` : null,
  hasStage(GREAT_LAKES, /AI-proctored interview/) && GREAT_LAKES ? `${GREAT_LAKES.shortName}: an AI-proctored interview before the personal interview.` : null,
  hasStage(IMI, /Video Assessment/) && IMI ? `${IMI.shortName}: a video assessment before the interview.` : null,
  hasStage(SIBM, /Group Exercise/) && SIBM ? `Symbiosis institutes such as ${SIBM.shortName}: a group exercise (GE) instead of a classic GD.` : null,
  hasStage(SPJIMR, /group interviews/) && SPJIMR ? `${SPJIMR.shortName}: two rounds of group interviews.` : null,
  hasStage(NMIMS, /Competency Test/) && NMIMS ? `${NMIMS.shortName}: a competency test and/or interview.` : null,
]);

/** Fee concessions stated in institutes' own fee documents. */
const SJMSOM_NOTE = SJMSOM ? flagship(SJMSOM)?.feeNote ?? "" : "";
const IIFT_NOTE = IIFT ? flagship(IIFT)?.feeNote ?? "" : "";
const DMS_NOTE = DMS ? flagship(DMS)?.feeNote ?? "" : "";
const FEE_CONCESSIONS = present([
  SJMSOM && SJMSOM_NOTE.includes("7,55,800 - tuition waived") && feeOf(SJMSOM)
    ? {
        c: SJMSOM,
        text: `Tuition is waived for SC, ST and PwD candidates, who pay ${formatInr(755800)} for the programme against ${formatInr(feeOf(SJMSOM))} for others.`,
      }
    : null,
  IIFT && IIFT_NOTE.includes("SC/ST/PwD: 50% tuition concession")
    ? { c: IIFT, text: "SC, ST and PwD candidates get a 50% concession on tuition." }
    : null,
  DMS && DMS_NOTE.includes("SC/ST/PwD pay only other charges and residence fee")
    ? { c: DMS, text: "SC, ST and PwD candidates pay only the other charges and residence fee, not tuition (as stated for the 2025-27 batch)." }
    : null,
]);
const AID_PAGES = present([named("iim-nagpur"), IIM_SHILLONG, SPJIMR])
  .map((c) => ({ c, source: feeSource(c) }))
  .filter((x): x is { c: MbaCollege; source: OfficialSource } => x.source !== null && /aid|scholarship/i.test(x.source.title));

// ── The guides ────────────────────────────────────────────────────────────────

export const MBA_GUIDES: MbaGuide[] = [
  {
    path: "/mba-without-cat",
    seoTitle: "MBA Without CAT: Exams & Admission Routes",
    description:
      "How to get into a good MBA without CAT: XAT, SNAP, NMAT, CMAT, MAH-CET, MAT and GMAT, direct admission at private colleges, and what to check first.",
    h1: "MBA Without CAT: Other Exams and Direct Admission Routes",
    answer:
      "Yes, you can do an MBA without CAT. XLRI uses XAT, Symbiosis uses SNAP, NMIMS uses NMAT, Maharashtra fills MBA/MMS seats through MAH-CET, and many AICTE-approved and private colleges accept CMAT, MAT or GMAT. Some private colleges also run their own institute-level admissions. The IIMs, however, admit to their two-year MBA through CAT.",
    cardDetail: "XAT, SNAP, NMAT, CMAT, MAH-CET, MAT, GMAT and direct admission",
    updated: UPDATED,
    sections: [
      {
        h2: "Can you get into an IIM without CAT?",
        paragraphs: [
          `Not for the flagship two-year MBA. Every one of the ${IIM_COUNT} IIMs we track publishes its shortlisting rules in terms of CAT percentiles, so a CAT score is the entry ticket. Some IIMs run executive and one-year programmes that accept GMAT or GRE, but those are aimed at candidates with several years of work experience and are a different product.`,
          "If an IIM seat is your goal, skipping CAT is not a shortcut. If your goal is a good MBA in general, there are several well-regarded routes that do not depend on CAT.",
        ],
        links: [{ to: MBA_PATHS.iimCutoffs, label: "IIM CAT cut-offs by category" }],
      },
      {
        h2: "Which exams lead to an MBA without CAT?",
        table: {
          caption: "MBA entrance exams other than CAT",
          head: ["Exam", "Who uses it", "Worth adding if"],
          rows: [
            ["XAT", "XLRI and other institutes that accept XAT", "XLRI is on your list; it tests decision-making, which CAT does not"],
            ["SNAP", "Symbiosis institutes such as SIBM Pune and SCMHRD", "You want a Symbiosis MBA, especially in Pune"],
            ["NMAT", "NMIMS and other participating schools", "NMIMS is a target, or you want the option of a retake"],
            ["CMAT", "AICTE-approved institutes that accept it", "You want a back-up score for AICTE-approved colleges"],
            ["MAH-MBA/MMS CET", "MBA/MMS seats in Maharashtra via state CAP counselling", "You want a Maharashtra seat, including Mumbai and Pune colleges"],
            ["MAT", "Many private B-schools", "Your shortlisted private colleges list MAT"],
            ["GMAT", "Schools worldwide and some Indian programmes", "You are applying abroad too, or to an Indian programme that lists it"],
          ],
        },
        paragraphs: [
          "Choose exams by working backwards from the colleges you would actually join. Two or three well-chosen tests are better than five rushed ones: each has its own pattern, and preparation time is the scarce resource.",
        ],
        links: [
          { to: MBA_PATHS.exams, label: "Compare MBA entrance exams" },
          { to: "/mba-resources/cat-vs-xat-vs-snap-vs-nmat", label: "CAT vs XAT vs SNAP vs NMAT" },
        ],
      },
      {
        h2: "What is direct admission, and is it legitimate?",
        paragraphs: [
          "Some private and deemed-university B-schools fill part of their seats through their own process — an application, the institute's own test or interview, and often a minimum score in any national exam. This is sometimes called direct or institute-level admission, and it is legitimate when it follows the institute's published admission policy.",
          "It is not legitimate when someone offers a 'guaranteed seat' for a payment outside the institute's official fee receipt. AICTE-approved institutes publish their fee and admission process; anything that cannot be matched to an official document is a warning sign.",
        ],
        bullets: [
          "Check the programme's approval (AICTE for PGDM, UGC/university for MBA) on the regulator's or university's site.",
          "Pay fees only to the institute's official account, against a receipt in the institute's name.",
          "Ask for the admission policy in writing: eligibility, selection stages and refund rules.",
          "Look up the institute's placement report on its own website rather than relying on a brochure figure.",
        ],
      },
      {
        h2: "How should you plan an MBA without CAT?",
        paragraphs: [
          "Start with a shortlist of eight to twelve colleges you would genuinely join, grouped by the exam each uses. That tells you which tests to register for and in what order — the major exams fall between November and February, so overlapping preparation is normal.",
          "Keep CAT in the plan if any CAT-only college is on your list. Many students take CAT alongside XAT or SNAP: the quantitative and reading skills carry over, and it keeps the IIMs and other CAT-based schools open.",
        ],
        links: [
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
          { to: MBA_PATHS.counselling, label: "Get help building a shortlist" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA without CAT worth it?",
        a: "It can be. XLRI, Symbiosis and NMIMS, for example, admit mainly through XAT, SNAP and NMAT. What matters is the institute's quality, placements and fit for you, not which exam got you in. Check each institute's official placement report and fees before deciding.",
      },
      {
        q: "Which is the easiest exam for MBA admission?",
        a: "No exam is reliably easier; each tests different things and draws a different pool of candidates. A better question is which exams the colleges you want accept, and which pattern suits your strengths.",
      },
      {
        q: "Can I get MBA admission without any entrance exam?",
        a: "Some private colleges admit on academic record and their own interview, but most AICTE-approved programmes require a national or state entrance score. Be careful with any offer that skips the institute's published process.",
      },
    ],
    sources: present([policySource(IIMA), policySource(SPJIMR), NIRF?.source]),
  },

  {
    path: "/mba-resources/mba-vs-pgdm",
    seoTitle: "MBA vs PGDM: Differences That Matter",
    description:
      "MBA vs PGDM explained: degree vs diploma, who awards each, AICTE and university approval, and how to compare programmes on what actually matters.",
    h1: "MBA vs PGDM: What Is the Difference, and Does It Matter?",
    answer:
      "An MBA is a degree awarded by a university or by an institute with degree-granting powers, such as the IIMs. A PGDM is a diploma awarded by an autonomous institute approved by AICTE. For a given institute, the quality of teaching, recruiters and alumni matters far more than the label on the certificate.",
    cardDetail: "Degree vs diploma, approvals, and what to compare instead",
    updated: UPDATED,
    sections: [
      {
        h2: "What is the difference between an MBA and a PGDM?",
        table: {
          caption: "MBA and PGDM compared",
          head: ["", "MBA", "PGDM"],
          rows: [
            ["What it is", "A master's degree", "A postgraduate diploma"],
            ["Who awards it", "A university, or an institute empowered by law to award degrees (the IIMs)", "An autonomous institute"],
            ["Approval", "University / UGC framework", "AICTE approval for the institute and programme"],
            ["Curriculum", "Set within the university's academic rules", "Set by the institute, which can revise it faster"],
            ["Typical length", "Two years for a full-time programme", "Two years for a full-time programme"],
          ],
        },
        paragraphs: [
          "Both can be excellent and both can be poor. The label tells you how the programme is governed; it does not tell you how good it is.",
        ],
      },
      {
        h2: "Do the IIMs award an MBA or a PGDM?",
        paragraphs: [
          `The IIMs now award MBA degrees. Several still use their older programme names alongside the degree — for example ${IIM_PROGRAMME_NAMES.length ? joinNames(IIM_PROGRAMME_NAMES) : "\"Post Graduate Programme (PGP)\" leading to an MBA"}. If you see "PGP" at an IIM, it is the same flagship programme.`,
        ],
        links: [{ to: MBA_PATHS.colleges, label: "IIM profiles: fees, cut-offs and placements" }],
      },
      {
        h2: "Which well-known schools offer a PGDM?",
        paragraphs: [
          PGDM_SCHOOLS.length
            ? `Among the institutes we have verified, ${joinNames(PGDM_SCHOOLS.map((c) => c.shortName))} offer${PGDM_SCHOOLS.length === 1 ? "s" : ""} a PGDM as ${PGDM_SCHOOLS.length === 1 ? "its" : "their"} flagship programme. Many of India's best-known private B-schools are PGDM institutes; being a diploma has not held them back with recruiters.`
            : "Many of India's best-known private B-schools are autonomous PGDM institutes; being a diploma has not held them back with recruiters.",
          "Some PGDM programmes also hold an equivalence to an MBA granted by the Association of Indian Universities, which matters mainly for higher studies or government jobs that ask for a degree. Check the specific institute's notice rather than assuming.",
        ],
        links: PGDM_SCHOOLS.map((c) => ({ to: collegePath(c.slug), label: `${c.shortName} profile` })),
      },
      {
        h2: "When does MBA vs PGDM actually matter?",
        bullets: [
          "If you plan a PhD or a teaching career, a degree (or an AIU-equivalent PGDM) can simplify eligibility.",
          "Some government and public-sector recruitments specify a degree; read the notification.",
          "For corporate placements, recruiters look at the institute, the batch and your profile, not the certificate type.",
          "A university MBA can cost far less — FMS Delhi is a university department — while a PGDM institute may move faster on curriculum and industry links.",
        ],
      },
      {
        h2: "How should you compare an MBA and a PGDM offer?",
        paragraphs: [
          "Put both offers through the same checklist: approval status, total fee, the institute's own placement report (median salary, not only the highest), batch size, specialisations actually offered, location and alumni network. The comparison is between two institutes, not between two labels.",
        ],
        links: [
          { to: "/mba-resources/how-to-choose-mba-college", label: "How to choose an MBA college" },
          ...(present([FMS ? { to: collegePath(FMS.slug), label: `${FMS.shortName} profile` } : null])),
        ],
      },
    ],
    faqs: [
      {
        q: "Is a PGDM equal to an MBA?",
        a: "For jobs in the private sector, a PGDM from a good AICTE-approved institute is generally treated on par with an MBA. Formal equivalence for higher studies depends on the institute; some PGDMs carry an equivalence granted by the Association of Indian Universities.",
      },
      {
        q: "Is an IIM PGP an MBA?",
        a: "Yes. The IIMs now award MBA degrees for their flagship programme, even where the programme is still called PGP or PGPM.",
      },
      {
        q: "Which is better, MBA or PGDM?",
        a: "Neither is better by label. Compare the specific institutes on fees, placements, faculty, batch, specialisations and fit with your goals.",
      },
    ],
    sources: present([policySource(IIM_INDORE), policySource(IIM_CALCUTTA), feeSource(SPJIMR), feeSource(MDI), feeSource(FMS)]),
  },

  {
    path: "/mba-resources/how-to-choose-mba-college",
    seoTitle: "How to Choose an MBA College: Checklist",
    description:
      "How to choose an MBA college: compare official placement reports, total fees, cut-offs, batch, specialisations and location, then build a shortlist.",
    h1: "How to Choose the Right MBA College: A Practical Checklist",
    answer:
      "Choose an MBA college by comparing what its own documents show: the median salary in its placement report, the total fee, the minimum scores it accepts, batch size, the specialisations it actually offers and where it is. Then shortlist eight to twelve colleges across a spread of difficulty, so one result never decides your year.",
    cardDetail: "What to compare, and how to build a balanced shortlist",
    updated: UPDATED,
    sections: [
      {
        h2: "What should you compare between MBA colleges?",
        table: {
          caption: "MBA college comparison checklist",
          head: ["What to check", "Where to find it", "Why it matters"],
          rows: [
            ["Median salary and batch placed", "The institute's own final placement report", "The median describes a typical graduate; the highest package does not"],
            ["Total programme fee", "The institute's fee page or admission policy", "Includes or excludes hostel and other charges — read what it covers"],
            ["Minimum scores and selection weights", "The admission policy", "Shows whether your profile is realistic and what else counts"],
            ["Batch size and intake", "Admission policy or NIRF data", "Affects peer group, electives and placement competition"],
            ["Specialisations offered", "Programme page", "A college strong in finance may be thin in operations"],
            ["Ranking", "NIRF (Ministry of Education)", "A consistent, public yardstick across institutes"],
            ["Location and industry access", "Campus city", "Internships and live projects are easier near industry"],
          ],
        },
      },
      {
        h2: "How do you read a placement report honestly?",
        paragraphs: [
          "Look for the median salary, the number of students who were placed out of the number who sought placement, and the year. Average salaries are pulled up by a few large offers, and 'highest package' figures — sometimes international — say little about a typical outcome.",
          ALL_COLLEGES.some((c) => flagship(c)?.medianSalary)
            ? `For example, the median salaries we hold come straight from each institute's report and are labelled with the graduating year, because different institutes publish for different years and do not always define 'salary' the same way.`
            : "Compare like with like: the same year, the same programme, and the same definition of salary.",
          "Past placements do not guarantee yours. Your specialisation, prior experience and performance in the programme matter as much as the institute's average.",
        ],
        links: [{ to: MBA_PATHS.placements, label: "MBA placements compared" }],
      },
      {
        h2: "How much should an MBA cost you?",
        paragraphs: [
          IIM_FEE_MIN && IIM_FEE_MAX
            ? `Fees vary widely. The IIMs' stated flagship fees range from ${formatLakh(IIM_FEE_MIN.fee)} (${IIM_FEE_MIN.i.shortName}) to ${formatLakh(IIM_FEE_MAX.fee)} (${IIM_FEE_MAX.i.shortName})${FMS && feeOf(FMS) ? `, while ${feePhrase(FMS)}` : ""}. Check what each figure includes before comparing.`
            : "Fees vary widely between institutes; check what each published figure includes before comparing.",
          "Think in terms of return: the fee and two years of forgone income on one side, the realistic median outcome for someone like you on the other.",
        ],
        links: [{ to: MBA_PATHS.fees, label: "MBA fees compared" }],
      },
      {
        h2: "How many colleges should you shortlist?",
        paragraphs: [
          "Eight to twelve is a workable number. Split them into reach colleges (your score is near or below what they usually call), match colleges (you clear their minimums comfortably), and safe options (you clear them by a wide margin and would still be happy to join).",
          "Use each institute's published minimum percentiles to place it in a group, remembering that minimums are not cut-offs.",
        ],
        links: [
          { to: percentilePath(90), label: "MBA colleges at 90 percentile" },
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
        ],
      },
      {
        h2: "What are the red flags when choosing an MBA college?",
        bullets: [
          "Placement figures you cannot find in an official report on the institute's own website.",
          "A 'guaranteed placement' or 'guaranteed admission' promise.",
          "Fees collected by an agent rather than paid to the institute.",
          "Approval you cannot verify with AICTE or the awarding university.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I choose an MBA college by ranking or by placements?",
        a: "Use both, plus fees and fit. NIRF gives a consistent public ranking; the institute's placement report shows outcomes. A college that ranks a little lower but is strong in your chosen specialisation can be the better choice for you.",
      },
      {
        q: "Is a newer IIM better than an established private B-school?",
        a: "Not automatically. Compare the specific institutes' median salaries, fees, batch and location. Some established private schools outperform some newer IIMs on placements, and the reverse is also true.",
      },
      {
        q: "Does the city of an MBA college matter?",
        a: "It can. Being near a business hub makes internships, live projects and guest faculty easier, and some recruiters concentrate on nearby campuses.",
      },
    ],
    sources: present([NIRF?.source, feeSource(IIM_FEE_MIN?.i), feeSource(IIM_FEE_MAX?.i), feeSource(FMS)]),
  },

  {
    path: "/mba-resources/what-is-mba",
    seoTitle: "What Is an MBA? Course, Eligibility, Value",
    description:
      "What is an MBA: what you study, how admission works in India, programme types, and how to decide whether an MBA fits your career plans.",
    h1: "What Is an MBA? The Course, Admission and Who It Suits",
    answer:
      "An MBA (Master of Business Administration) is a postgraduate programme in management: finance, marketing, operations, people, strategy and analytics. In India the full-time MBA usually runs two years, and admission is through an entrance exam such as CAT followed by a written test and interview. It suits people who want to manage, not only specialise.",
    cardDetail: "What you study, how you get in, and who it suits",
    updated: UPDATED,
    sections: [
      {
        h2: "What do you study in an MBA?",
        paragraphs: [
          "The first year is a common core: accounting, finance, marketing, economics, statistics and analytics, operations, organisational behaviour, business communication and strategy. The second year is mostly electives, where you build a specialisation such as finance, marketing, HR, operations or analytics.",
          "Most full-time programmes include a summer internship between the two years, which is often where recruiters first assess you.",
        ],
        links: [{ to: MBA_PATHS.specialisations, label: "MBA specialisations" }],
      },
      {
        h2: "What types of MBA programmes are there?",
        table: {
          caption: "Types of MBA programmes",
          head: ["Type", "Who it is for", "Format"],
          rows: [
            ["Full-time MBA / PGDM", "Graduates and early-career professionals", "Two years on campus"],
            ["One-year MBA", "Professionals with several years of experience", "Intensive, about a year on campus"],
            ["Executive MBA", "Working managers", "Weekend or modular, while employed"],
            ["Online / distance MBA", "Learners who need flexibility", "Remote; check UGC/AICTE recognition"],
          ],
        },
      },
      {
        h2: "How do you get into an MBA in India?",
        paragraphs: [
          `You take an entrance exam — CAT for the IIMs and most top schools, or XAT, SNAP, NMAT, CMAT, MAH-CET or MAT for others — then apply to each institute. Shortlisted candidates face a written test, group discussion or interview. CAT ${CAT_LATEST.year} is a ${CAT_LATEST.totalDurationMinutes}-minute test in ${CAT_LATEST.sections.length} sections.`,
          "Most programmes require a bachelor's degree with a minimum percentage, with relaxation for reserved categories; check each institute's admission policy for the exact rule.",
        ],
        links: [
          { to: examPath("cat"), label: "CAT exam pattern and dates" },
          { to: MBA_PATHS.hub, label: "MBA Admission Guide 2027" },
        ],
      },
      {
        h2: "Who should do an MBA?",
        bullets: [
          "People who want to lead teams, run a business function or start a business.",
          "Professionals who have hit a ceiling in a technical role and want a broader one.",
          "Career switchers who need a structured way into a new industry.",
          "It suits less well someone who only wants a higher salary without a view of the work they want to do; the degree opens doors, it does not choose them for you.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the full form of MBA?",
        a: "Master of Business Administration.",
      },
      {
        q: "How long is an MBA in India?",
        a: "A full-time MBA or PGDM is usually two years. One-year programmes exist for experienced professionals, and executive MBAs are spread across weekends or modules.",
      },
      {
        q: "Can I do an MBA after any graduation?",
        a: "Generally yes. MBA programmes accept graduates from any discipline who meet the minimum marks in their policy, whether you studied commerce, engineering, arts or science.",
      },
    ],
    sources: present([CAT_LATEST.source]),
  },

  {
    path: "/mba-resources/cat-vs-xat-vs-snap-vs-nmat",
    seoTitle: "CAT vs XAT vs SNAP vs NMAT: Which to Take",
    description:
      "CAT vs XAT vs SNAP vs NMAT: who conducts each, which colleges use it, how the tests differ, and how to decide which MBA exams to take.",
    h1: "CAT vs XAT vs SNAP vs NMAT: Which MBA Exams Should You Take?",
    answer:
      "Take CAT for the IIMs and most top B-schools, XAT for XLRI, SNAP for the Symbiosis institutes and NMAT for NMIMS. They differ in who conducts them, which colleges use them and what they test — XAT adds decision-making, NMAT lets you retake within its window. Pick exams by the colleges you want, then plan preparation around their order.",
    cardDetail: "Who uses each exam and how they differ",
    updated: UPDATED,
    sections: [
      {
        h2: "How do CAT, XAT, SNAP and NMAT compare?",
        table: {
          caption: "CAT, XAT, SNAP and NMAT compared",
          head: ["", "CAT", "XAT", "SNAP", "NMAT"],
          rows: [
            ["Conducted by", "The IIMs (rotating)", "XLRI Jamshedpur for XAMI", "Symbiosis International (Deemed University)", "GMAC"],
            ["Main users", "IIMs and many top B-schools", "XLRI and XAT-accepting institutes", "Symbiosis institutes", "NMIMS and participating schools"],
            ["Distinctive feature", `${CAT_LATEST.sections.length} fixed-order sections, ${CAT_LATEST.sections[0]?.durationMinutes ?? 40} minutes each`, "A decision-making section", "Used only for Symbiosis programmes", "Choose your section order; retakes allowed in the window"],
          ],
        },
        paragraphs: ["Dates, fees and question counts change every year; each exam's page carries the current official figures as we verify them."],
        links: [
          { to: examPath("cat"), label: "CAT exam pattern" },
          { to: MBA_PATHS.exams, label: "All MBA entrance exams" },
        ],
      },
      {
        h2: "Which exam is right for you?",
        bullets: [
          "Want an IIM, FMS Delhi, MDI or SPJIMR? CAT is essential.",
          "XLRI on your list? Add XAT — and prepare specifically for decision-making questions.",
          "Pune and a Symbiosis institute appeal to you? SNAP is the route.",
          "NMIMS in Mumbai is a target, or you want a second chance in the same season? NMAT.",
          "Applying abroad as well? GMAT is accepted by some Indian programmes too.",
        ],
      },
      {
        h2: "Can you prepare for all four at once?",
        paragraphs: [
          "Mostly yes. Quantitative ability, reading comprehension and logical reasoning carry across all of them. What differs is speed (SNAP and NMAT reward pace), XAT's decision-making section, and each test's marking and section rules. Build a common base for CAT, then add two to three weeks of exam-specific mocks before each later test.",
        ],
        links: [
          { to: "/mba-resources/cat-preparation-strategy", label: "CAT preparation strategy" },
          { to: "/mba-resources/xat-preparation", label: "XAT preparation" },
          { to: "/mba-resources/snap-preparation", label: "SNAP preparation" },
          { to: "/mba-resources/nmat-preparation", label: "NMAT preparation" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is XAT harder than CAT?",
        a: "Different rather than harder. XAT's decision-making section has no CAT equivalent, while CAT's fixed sectional timing is its own challenge. Your comfort with each format matters more than a general ranking of difficulty.",
      },
      {
        q: "Should I take CAT and XAT both?",
        a: "If XLRI or another XAT-only college is on your list, yes. The preparation overlaps heavily, so the extra effort is mainly XAT-specific practice.",
      },
      {
        q: "Is NMAT easier than CAT?",
        a: "NMAT draws a different pool and allows retakes within its window, which some candidates find less pressured. It is accepted by fewer institutes, so it complements CAT rather than replacing it for most people.",
      },
    ],
    sources: present([CAT_LATEST.source]),
  },

  {
    path: "/mba-resources/mba-without-work-experience",
    seoTitle: "MBA Without Work Experience: Is It Wise?",
    description:
      "Can you do an MBA without work experience? How IIMs and top B-schools weigh experience, when going straight from college makes sense, and when to wait.",
    h1: "MBA Without Work Experience: Should You Go Straight After College?",
    answer:
      "Yes, the IIMs and most Indian B-schools admit freshers to their two-year MBA. Work experience earns some points in many selection formulas, but it is one factor among several, alongside the entrance score, academics and interview. Going straight in makes sense if you know why you want an MBA; otherwise a year or two of work can sharpen that answer.",
    cardDetail: "How experience is weighed, and when to wait",
    updated: UPDATED,
    sections: [
      {
        h2: "Do IIMs take freshers?",
        paragraphs: [
          `Yes. The IIMs' admission policies give marks for work experience in their composite scores, but none of the ${IIM_COUNT} policies we track makes it compulsory for the flagship two-year MBA. Freshers make up a meaningful share of many batches.`,
          "Experience does count, though, and the way it counts differs: some institutes reward each month up to a cap, others score only experience above a minimum.",
        ],
        links: [{ to: MBA_PATHS.iimCutoffs, label: "IIM admission policies and minimums" }],
      },
      {
        h2: "How much does work experience weigh in selection?",
        paragraphs: [
          MDI && MDI.selectionProcess.length
            ? `It varies by institute. ${MDI.shortName}'s published process, for example, gives work experience a stated weight at both the shortlisting and final stages:`
            : "It varies by institute and is set out in each admission policy.",
        ],
        table: selectionTable(MDI),
        links: present([MDI ? { to: collegePath(MDI.slug), label: `${MDI.shortName} profile` } : null]),
      },
      {
        h2: "When is it better to work first?",
        bullets: [
          "You cannot yet say what role you want after the MBA — a year of work usually answers that.",
          "Your target programme rewards experience heavily, or is a one-year programme that requires it.",
          "Your entrance score is near the margin and experience would strengthen your composite.",
          "You want to specialise in a field (for example operations or HR) where prior exposure helps you in placements.",
        ],
      },
      {
        h2: "How can a fresher strengthen an MBA application?",
        bullets: [
          "Internships, live projects and leadership roles in college, described with concrete outcomes.",
          "A clear, specific answer to 'why an MBA, why now' for the interview.",
          "Strong academics, since Class X, XII and graduation marks carry weight in many composites.",
          "Awareness of the business world: read about the industries you want to enter.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA without work experience worth it?",
        a: "It can be, if you have a clear goal and get into a strong programme. Freshers sometimes find placements in roles that prefer experience harder; research the placement report for your specialisation before deciding.",
      },
      {
        q: "How much work experience is ideal for an MBA?",
        a: "There is no single ideal. Two-year programmes admit freshers and experienced candidates alike; one-year programmes usually require several years. Check how each target institute scores experience.",
      },
    ],
    sources: present([MDI?.selectionSource, policySource(IIMA)]),
  },

  {
    path: "/mba-resources/government-vs-private-mba-colleges",
    seoTitle: "Government vs Private MBA Colleges",
    description:
      "Government vs private MBA colleges in India: fees, admission routes, autonomy and placements compared with official figures, and how to choose.",
    h1: "Government vs Private MBA Colleges: Fees, Admission and Value",
    answer:
      "Government MBA colleges — the IIMs, university departments like FMS Delhi and state institutes — admit mainly through CAT or state exams and often cost less; university departments can cost a fraction of private fees. Private B-schools set their own fees and processes and range from excellent to weak. Compare each institute's official fee and placement report, not the category.",
    cardDetail: "Fees, admission routes and how to compare",
    updated: UPDATED,
    sections: [
      {
        h2: "How do fees compare between government and private MBA colleges?",
        paragraphs: [
          present([feePhrase(FMS), feePhrase(SPJIMR), feePhrase(MDI)]).length
            ? `The gap can be large. ${joinNames(present([feePhrase(FMS), feePhrase(SPJIMR), feePhrase(MDI)]))} — each figure from the institute's own fee document for the batch it names.`
            : "The gap can be large; compare each institute's own fee document for the same batch.",
          IIM_FEE_MIN && IIM_FEE_MAX
            ? `The IIMs, which are public institutes, are not cheap either: their stated flagship fees run from ${formatLakh(IIM_FEE_MIN.fee)} to ${formatLakh(IIM_FEE_MAX.fee)}.`
            : "",
        ].filter(Boolean),
        links: [{ to: MBA_PATHS.fees, label: "MBA fees compared" }],
      },
      {
        h2: "How do admission routes differ?",
        bullets: [
          "IIMs: CAT, then each IIM's composite score, written test and interview.",
          "University departments (for example FMS Delhi): usually CAT or a university process, with reservation as per government rules.",
          "State government and state-quota seats: often through a state exam and centralised counselling, such as MAH-CET and CAP in Maharashtra.",
          "Private institutes: CAT, XAT, NMAT, SNAP, CMAT or MAT as each specifies, sometimes with institute-level seats.",
        ],
      },
      {
        h2: "Are government MBA colleges better than private ones?",
        paragraphs: [
          NIRF
            ? `Not as a rule. The NIRF ${NIRF.year} Management top 100 includes both — the IIMs alongside private institutes such as ${joinNames(present([MDI, SPJIMR]).map((c) => c.shortName)) || "several private B-schools"}. Within each group, quality varies widely.`
            : "Not as a rule; both groups include excellent and weak institutes.",
          "Judge each institute on its placement report, faculty, batch, and the fee you would actually pay.",
        ],
        links: [{ to: MBA_PATHS.colleges, label: "NIRF Management ranking" }],
      },
    ],
    faqs: [
      {
        q: "Which is the cheapest good MBA college in India?",
        a: FMS && feeOf(FMS)
          ? `University departments are usually the least expensive. ${feePhrase(FMS)}, and it reports strong placements in its official report. Admission is highly competitive.`
          : "University departments are usually the least expensive, though admission to the well-known ones is highly competitive.",
      },
      {
        q: "Do private MBA colleges have management quota seats?",
        a: "Some private institutes fill part of their intake through their own process. It is legitimate only when it follows the institute's published admission policy and fees are paid to the institute directly.",
      },
    ],
    sources: present([feeSource(FMS), feeSource(SPJIMR), feeSource(MDI), feeSource(IIM_FEE_MIN?.i), feeSource(IIM_FEE_MAX?.i), NIRF?.source]),
  },

  {
    path: "/mba-resources/mba-admission-process",
    seoTitle: "MBA Admission Process 2027, Step by Step",
    description:
      "The MBA admission process for 2027: entrance exam, applications, minimum percentiles, composite scores, WAT, GD and interviews, and the final merit list.",
    h1: "MBA Admission Process 2027: From Entrance Exam to Offer",
    answer: `MBA admission runs in five steps: take an entrance exam (CAT ${CAT_LATEST.year} for the IIMs), apply to each institute, clear its minimum percentiles, get shortlisted on a composite score, then take its written test, group discussion or interview. The final offer re-weights the score, academics, experience and interview — the exam alone never decides.`,
    cardDetail: "Exam, application, shortlist, WAT/GD/PI, offer",
    updated: UPDATED,
    sections: [
      {
        h2: "What are the steps in MBA admission?",
        table: {
          caption: "MBA admission steps",
          head: ["Step", "What happens", "What you control"],
          rows: [
            ["1. Entrance exam", "CAT, XAT, SNAP, NMAT, CMAT, MAH-CET or MAT", "Which exams, and your preparation"],
            ["2. Applications", "Each institute's form and deadline (IIMs use the CAT registration)", "Your shortlist and meeting deadlines"],
            ["3. Minimum percentiles", "Overall and sectional thresholds by category", "Little after the exam — choose colleges accordingly"],
            ["4. Shortlisting", "Composite of score, academics, experience and diversity", "Nothing at this stage; it is computed"],
            ["5. WAT / GD / PI", "Written test, discussion and interview", "Preparation, clarity about your goals"],
            ["6. Final merit list", "Re-weighted composite; offers and waitlists", "Accepting, paying fees on time, comparing offers"],
          ],
        },
      },
      {
        h2: "What CAT percentile do you need to be considered?",
        paragraphs: [
          `Each IIM publishes minimums by category. For a General, non-PwD candidate the published overall minimums range from ${GENERAL.min} (${joinNames(GENERAL.minNames)}) to ${GENERAL.max} (${joinNames(GENERAL.maxNames)}), and sectional minimums apply too. Clearing them makes you eligible; the percentile at which calls actually go out is usually higher.`,
        ],
        links: [
          { to: MBA_PATHS.iimCutoffs, label: "IIM CAT cut-offs" },
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
        ],
      },
      {
        h2: "How does a real selection formula look?",
        paragraphs: [
          FMS && FMS.selectionProcess.length
            ? `Every institute publishes its own. ${FMS.shortName}'s, from its official information bulletin:`
            : "Every institute publishes its own in its admission policy.",
        ],
        table: selectionTable(FMS),
        links: present([FMS ? { to: collegePath(FMS.slug), label: `${FMS.shortName} profile` } : null]),
      },
      {
        h2: "When do MBA admissions happen?",
        paragraphs: [
          "Most entrance exams fall between November and February. Institutes announce shortlists from January, run written tests and interviews between February and April, and release final lists from April into the summer. Many private institutes' application deadlines fall close to the CAT date, so apply early.",
        ],
        links: [{ to: MBA_PATHS.hub, label: "MBA Admission Guide 2027" }],
      },
    ],
    faqs: [
      {
        q: "Is the CAT score enough for MBA admission?",
        a: "No. The score gets you considered and carries weight, but academics, work experience, diversity factors and the interview all count in the final composite.",
      },
      {
        q: "What is WAT, GD and PI?",
        a: "Written Ability Test, Group Discussion and Personal Interview — the selection rounds institutes use after shortlisting. Each institute chooses its own combination.",
      },
    ],
    sources: present([FMS?.selectionSource, policySource(IIMA), CAT_LATEST.source]),
  },

  {
    path: "/mba-resources/is-mba-worth-it",
    seoTitle: "Is an MBA Worth It? An Honest ROI Check",
    description:
      "Is an MBA worth it in India? Set official fees against median salaries, count the income you give up, and see when an MBA pays off and when it does not.",
    h1: "Is an MBA Worth It? Costs, Outcomes and Alternatives",
    answer:
      "An MBA is worth it when three things line up: a programme whose own placement report shows outcomes you would accept, a total fee and two years of lost income you can carry, and a clear idea of the work you want afterwards. Fees and median salaries differ widely between colleges, so judge the programme, not the degree.",
    cardDetail: "Fees against median salaries, and when an MBA pays off",
    updated: UPDATED,
    sections: [
      {
        h2: "What does an MBA actually cost?",
        paragraphs: [
          IIM_FEE_MIN && IIM_FEE_MAX
            ? `Start with the fee. The IIMs' stated flagship fees run from ${formatLakh(IIM_FEE_MIN.fee)} (${IIM_FEE_MIN.i.shortName}) to ${formatLakh(IIM_FEE_MAX.fee)} (${IIM_FEE_MAX.i.shortName})${feePhrase(FMS) ? `, while ${feePhrase(FMS)}` : ""}. Some of these figures include hostel and others do not, so read the note on each institute's fee document before comparing.`
            : "Start with the fee, as each institute states it, and read what it includes before comparing.",
          "Then add the cost most people forget: two years without a salary. If you are working, the income you give up can be as large as the fee itself. Add hostel and living costs where the fee excludes them, and interest if you borrow.",
        ],
        links: [{ to: MBA_PATHS.fees, label: "MBA fees compared" }],
      },
      {
        h2: "What do MBA graduates earn after these programmes?",
        paragraphs: [
          "The fairest single number is the median salary in the institute's own final placement report: half the placed batch earned more, half less. Set it beside the fee, as below, and the spread between institutes becomes obvious.",
        ],
        table: FEE_VS_MEDIAN.length
          ? {
              caption: "Stated total fee and median salary at selected institutes (each from the institute's own documents)",
              head: ["Institute", "Total fee (stated)", "Median salary (graduating year)"],
              rows: FEE_VS_MEDIAN.map((x) => [x.c.shortName, formatLakh(x.fee), `${formatLakh(x.median.value)} a year${x.median.year ? ` (${x.median.year})` : ""}`]),
            }
          : undefined,
        bullets: [
          "Institutes do not define salary the same way: some report a median 'maximum earning potential', others a median CTC, and some figures come from NIRF data covering all two-year programmes together.",
          "A median describes a past batch. Your outcome depends on your specialisation, experience, performance and the job market in your year.",
        ],
        links: [
          { to: MBA_PATHS.placements, label: "Median MBA salaries compared" },
          ...FEE_VS_MEDIAN.slice(0, 4).map((x) => ({ to: collegePath(x.c.slug), label: `${x.c.shortName} profile` })),
        ],
      },
      {
        h2: "When is an MBA worth it?",
        bullets: [
          "You can name the roles you want afterwards — product, consulting, finance, sales leadership, operations — and they usually hire from MBA campuses.",
          "You are switching industry or function and need a structured way in, with internships and campus recruitment.",
          "The programme you can get into has a published placement report whose median you would be content with.",
          "You can fund the fee and the lost income without debt that would force you into a job you do not want.",
        ],
      },
      {
        h2: "When might an MBA not be worth it?",
        bullets: [
          "Your main reason is a higher salary, with no view of the work you want; the degree opens doors, it does not choose them.",
          "The only offer you hold is from a programme that cannot show an official placement report, or whose median is close to what you already earn.",
          "You would borrow heavily for a programme whose outcomes are modest. Compare the loan repayment with the realistic median, not the highest package.",
          "You already have a clear path to promotion in your current field, where an MBA adds little.",
        ],
      },
      {
        h2: "What are the alternatives to a full-time MBA?",
        table: {
          caption: "Alternatives to a two-year full-time MBA",
          head: ["Option", "Suits", "Trade-off"],
          rows: [
            ["Executive or weekend MBA", "Working managers who want to keep their salary", "Less access to campus placements; heavy time demands while employed"],
            ["One-year MBA", "Professionals with several years of experience", "Usually requires substantial experience; intense pace"],
            ["Online MBA", "People who need flexibility", "Check UGC or AICTE recognition and how employers in your field view it"],
            ["Specialised master's or certification", "People sure of one function, such as HR or finance", "Narrower; may not offer the general-management route"],
            ["Staying in your role", "People already on a clear growth path", "No credential, but no fee or lost income either"],
          ],
        },
      },
      {
        h2: "How do you check whether a specific MBA is worth it for you?",
        bullets: [
          "Write down the total cost: stated fee, hostel and living costs, and two years of your current income.",
          "Find the institute's latest final placement report on its own website and note the median, the year and how many were placed out of those who sought placement.",
          "Check whether your target specialisation and background place well there; ask current students or alumni.",
          "Compare two or three realistic offers on the same basis rather than one dream college against nothing.",
        ],
        links: [
          { to: MBA_PATHS.predictor, label: "Check which IIMs your percentile clears" },
          { to: "/mba-resources/how-to-choose-mba-college", label: "How to choose an MBA college" },
          { to: MBA_PATHS.counselling, label: "Talk to an MBA counsellor" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA worth it in India?",
        a: "It can be, at a programme whose official median salary justifies its fee and the income you give up, and when you know what you want to do with it. Compare specific institutes, not the degree in general.",
      },
      {
        q: "Is an MBA worth it from a lesser-known college?",
        a: "Only if its own placement report, read honestly, shows outcomes that justify the cost. Some lesser-known programmes place well in particular sectors; others cannot show any official figures. Treat missing data as a warning sign.",
      },
      {
        q: "Does an MBA guarantee a higher salary?",
        a: "No. Past medians describe past batches. Your outcome depends on your specialisation, prior experience, performance in the programme and the job market when you graduate.",
      },
      {
        q: "Is an MBA worth it after a few years of work?",
        a: "Often it fits better then, because you know what you want from it. The trade-off is a larger salary given up for two years; a one-year or executive programme may suit experienced professionals.",
      },
    ],
    sources: present([
      feeSource(IIM_FEE_MIN?.i),
      feeSource(IIM_FEE_MAX?.i),
      feeSource(FMS),
      ...FEE_VS_MEDIAN.flatMap((x) => [x.feeSrc, x.median.source]),
      medianOf(IIM_AMRITSAR)?.source,
    ]),
  },

  {
    path: "/mba-resources/mba-after-bcom",
    seoTitle: "MBA After BCom: Specialisations & Colleges",
    description:
      "MBA after BCom: eligibility for CAT and other exams, specialisations that build on commerce, how selection weighs academic diversity, and where to apply.",
    h1: "MBA After BCom: Is It Right, and Where to Apply?",
    answer:
      "Yes, BCom graduates can do an MBA. CAT, XAT, SNAP, CMAT, MAT and MAH-CET accept graduates of any discipline, subject to minimum marks, and some selection formulas give weight to academic diversity. A commerce degree helps with first-year accounting and finance; your entrance score, academics and a clear reason for the MBA matter more.",
    cardDetail: "Eligibility, specialisations and selection for commerce graduates",
    updated: UPDATED,
    sections: [
      {
        h2: "Are BCom graduates eligible for an MBA?",
        paragraphs: [
          CAT_ELIGIBILITY_SAYS_50
            ? `Yes. CAT asks for a bachelor's degree with at least 50% marks or equivalent CGPA (45% for SC, ST and PwBD); final-year students can apply.${CAT_ACCEPTS_PROFESSIONAL ? " CAT's eligibility also accepts CA, CS and ICWA (CMA) qualifications with the required percentage." : ""}`
            : "Yes. MBA entrance exams accept graduates of any discipline who meet their minimum marks.",
          "Individual institutes can set higher bars. Read each target college's admission policy before you apply.",
        ],
        table: {
          caption: "Who can take each MBA entrance exam (summarised from the exam body's official document)",
          head: ["Exam", "Eligibility in brief"],
          rows: present([
            CAT_ELIGIBILITY_SAYS_50 ? ["CAT", "Bachelor's degree with at least 50% (45% for SC, ST, PwBD); final-year students can apply"] : null,
            examEligibility("xat") ? ["XAT", "A recognised bachelor's degree of at least three years in any discipline; final-year students eligible"] : null,
            examEligibility("snap")?.value.includes("50%") ? ["SNAP", "Graduate with at least 50% (45% for SC and ST); some programmes add their own requirements"] : null,
            examEligibility("cmat") ? ["CMAT", "Bachelor's degree in any discipline; final-year students can apply"] : null,
            examEligibility("mat")?.value.includes("B.Com") ? ["MAT", "Graduation in any discipline; final-year students, including BCom, can appear provisionally"] : null,
            examEligibility("mah-mba-cet")?.value.includes("50%")
              ? ["MAH-MBA/MMS CET", "Three-year bachelor's in any discipline with at least 50% (45% for some Maharashtra reserved categories)"]
              : null,
          ]),
        },
        links: [{ to: MBA_PATHS.exams, label: "MBA entrance exams compared" }],
      },
      {
        h2: "Do IIMs set academic minimums beyond CAT?",
        paragraphs: present([
          policyPoint(IIM_KOZHIKODE, /CA\/CMA\/CS 50%/, "")
            ? `Some do. ${IIM_KOZHIKODE!.shortName}'s policy asks for graduation of at least 60% — or 50% for CA, CMA or CS — along with its own Class X and XII minimums.`
            : null,
          policyPoint(IIM_RAIPUR, /Academic minimums: X 60 \/ XII 60 \/ Grad 50/, "")
            ? "The joint admission process run by IIM Kashipur, Raipur, Ranchi and Tiruchirappalli sets Class X and XII minimums of 60% and a graduation minimum of 50% for General, EWS and NC-OBC candidates, with lower figures for other groups."
            : null,
          "Others use Class X, XII and graduation marks as scored parameters rather than cut-offs. Either way, consistent academics help a BCom applicant as much as anyone else.",
        ]),
        links: [{ to: MBA_PATHS.iimCutoffs, label: "IIM cut-offs and policies" }],
      },
      {
        h2: "Do B-schools prefer engineers over BCom graduates?",
        paragraphs: present([
          "Published admission policies do not say so. Several explicitly reward a mix of backgrounds in the batch.",
          MDI && stageWeights(MDI, 1)?.includes("Academic diversity")
            ? `${MDI.shortName}'s proposed shortlisting weights for 2027-29, for example, are ${stageWeights(MDI, 1)} — academic diversity is a scored line of its own.`
            : null,
          policyPoint(IIM_SHILLONG, /by academic discipline/, "")
            ? `${IIM_SHILLONG!.shortName} shortlists on a composite score by academic discipline, category and gender, so applicants are compared within comparable groups.`
            : null,
        ]),
        links: present([MDI ? { to: collegePath(MDI.slug), label: `${MDI.shortName} selection process` } : null]),
      },
      {
        h2: "Which MBA specialisations suit BCom graduates?",
        bullets: [
          "Finance: your accounting, taxation and financial-statement background gives you a head start in corporate finance, banking and investment roles.",
          "Marketing: open to any background; sales and brand roles reward communication and customer insight more than prior study.",
          "Business analytics: a good fit if you enjoyed statistics; expect to build programming and modelling skills in the MBA.",
          "Human resources and operations: open to any background; operations suits those comfortable with numbers and processes.",
        ],
        paragraphs: ["Your first year is common to everyone, so you choose a specialisation after seeing the subjects, not before."],
        links: [
          { to: specialisationPath("finance"), label: "MBA in Finance" },
          { to: specialisationPath("marketing"), label: "MBA in Marketing" },
          { to: specialisationPath("business-analytics"), label: "MBA in Business Analytics" },
          { to: MBA_PATHS.specialisations, label: "All MBA specialisations" },
        ],
      },
      {
        h2: "How should a BCom graduate prepare for CAT?",
        paragraphs: [
          `CAT ${CAT_LATEST.year} has ${CAT_LATEST.sections.length} timed sections — ${joinNames(CAT_LATEST.sections.map((s) => s.name))}. If school-level maths is a long way back for you, Quantitative Ability may need the most work, so start there early. Take full mocks to find your weak section, since most IIMs also set sectional minimums.`,
        ],
        links: [
          { to: examPath("cat"), label: "CAT exam pattern" },
          { to: FREE_CAT_MOCK_PATH, label: "Free CAT mock test" },
          { to: CAT_SCORE_CALCULATOR_PATH, label: "CAT score calculator" },
        ],
      },
      {
        h2: "Should you work before an MBA after BCom?",
        paragraphs: [
          "Not necessarily. Freshers are admitted to two-year MBAs, including at the IIMs. A year or two in an accounting, audit, banking or sales role can, however, sharpen your goals and add points where selection formulas reward experience.",
        ],
        links: [
          { to: "/mba-resources/mba-without-work-experience", label: "MBA without work experience" },
          { to: "/mba-without-cat", label: "MBA without CAT" },
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA a good option after BCom?",
        a: "It can be, if you have a clear goal for it. A BCom gives you a base in accounting, economics and business law that helps in the first year, especially if you specialise in finance.",
      },
      {
        q: "Can I do an MBA after BCom without CAT?",
        a: "Yes. XAT, SNAP, NMAT, CMAT, MAT and MAH-CET lead to MBA and PGDM seats at many institutes. The IIMs' two-year MBA, however, admits through CAT.",
      },
      {
        q: "What percentage do I need in BCom for an MBA?",
        a: "CAT itself asks for at least 50% (45% for SC, ST and PwBD). Some institutes set higher academic minimums or score your marks in their selection formula, so check each target college's policy.",
      },
      {
        q: "Is maths needed for an MBA after BCom?",
        a: "CAT has a Quantitative Ability section, and the MBA itself includes statistics, finance and analytics. School-level maths, practised well, is enough to start.",
      },
    ],
    sources: present([
      CAT_ELIGIBILITY?.source,
      examEligibility("xat")?.source,
      examEligibility("snap")?.source,
      examEligibility("cmat")?.source,
      examEligibility("mat")?.source,
      examEligibility("mah-mba-cet")?.source,
      policyPoint(IIM_KOZHIKODE, /CA\/CMA\/CS 50%/, "")?.source,
      policyPoint(IIM_RAIPUR, /Academic minimums: X 60 \/ XII 60 \/ Grad 50/, "")?.source,
      policyPoint(IIM_SHILLONG, /by academic discipline/, "")?.source,
      MDI?.selectionSource,
      CAT_LATEST.source,
    ]),
  },

  {
    path: "/mba-resources/mba-after-engineering",
    seoTitle: "MBA After Engineering (B.Tech): Guide",
    description:
      "MBA after engineering: when it makes sense, how work experience and academic diversity are weighed, which specialisations engineers pick, and MBA vs MTech.",
    h1: "MBA After Engineering: When It Makes Sense",
    answer:
      "An MBA after engineering makes sense when you want to move from building things to managing them — product, operations, consulting, analytics or general management. Engineers are eligible for every MBA entrance exam, but some selection formulas add points for academic diversity, so your CAT score, academics and work experience must stand out. A technical career may not need one.",
    cardDetail: "When it makes sense, work experience, and MBA vs MTech",
    updated: UPDATED,
    sections: [
      {
        h2: "When does an MBA after engineering make sense?",
        bullets: [
          "You enjoy the business side of projects — customers, costs, people, trade-offs — more than the technical depth.",
          "You want a role such as product management, consulting, operations or analytics leadership, where an MBA is a common route.",
          "You have hit a ceiling in a purely technical track and want a broader one.",
          "It makes less sense if you want to stay a specialist; a master's in your field, or simply experience, may serve you better.",
        ],
      },
      {
        h2: "Should engineers work before an MBA?",
        paragraphs: [
          "It is not required — freshers are admitted to two-year programmes — but experience is scored in many selection formulas, and it gives you something concrete to talk about in interviews. Here is how three institutes publish their shortlisting weights:",
        ],
        table: (() => {
          const rows = present([DMS, SJMSOM, MDI].map((c) => (c && stageWeights(c, 1) ? [c.shortName, stageWeights(c, 1)!] : null)));
          return rows.length
            ? { caption: "Published shortlisting weights (from each institute's official admission document)", head: ["Institute", "Shortlisting weights"], rows }
            : undefined;
        })(),
        links: [
          { to: "/mba-resources/mba-without-work-experience", label: "MBA without work experience" },
          ...present([DMS, SJMSOM].map((c) => (c ? { to: collegePath(c.slug), label: `${c.shortName} profile` } : null))),
        ],
      },
      {
        h2: "Does academic diversity work against engineers?",
        paragraphs: present([
          MDI && stageWeights(MDI, 1)?.includes("Academic diversity")
            ? `Some policies give a few points for academic diversity — ${MDI.shortName} scores it as a separate line in its shortlist — which benefits backgrounds that are less common in the applicant pool.`
            : "Some policies give a few points for academic diversity, which benefits backgrounds that are less common in the applicant pool.",
          DMS && stageWeights(DMS, 1)?.includes("MoE-funded technical institution")
            ? `It cuts both ways: ${DMS.shortName}'s shortlisting index gives weight to graduates of MoE-funded technical institutions, Institutes of Eminence and Institutes of National Importance.`
            : null,
          "The practical answer is the same for everyone: a strong, balanced CAT score, consistent academics and a convincing reason for the MBA.",
        ]),
      },
      {
        h2: "Which MBA specialisations do engineers choose?",
        bullets: [
          "Operations and supply chain: manufacturing, logistics and process roles build directly on engineering training.",
          "Business analytics: data, modelling and technology-heavy decision roles.",
          "Finance and consulting: popular, competitive, and open to engineers who build the business vocabulary.",
          "Product and marketing: technology companies value people who understand both the product and the customer.",
        ],
        links: [
          { to: specialisationPath("operations-management"), label: "MBA in Operations" },
          { to: specialisationPath("supply-chain-management"), label: "MBA in Supply Chain" },
          { to: specialisationPath("business-analytics"), label: "MBA in Business Analytics" },
          { to: specialisationPath("finance"), label: "MBA in Finance" },
        ],
      },
      {
        h2: "MBA or MTech: which should an engineer choose?",
        table: {
          caption: "MBA and MTech compared for engineering graduates",
          head: ["", "MBA", "MTech / MS"],
          rows: [
            ["Direction", "Broadens you into management", "Deepens you in one technical field"],
            ["Typical roles", "Product, consulting, operations, finance, general management", "Specialist engineering, research, technical leadership"],
            ["Entrance", "CAT, XAT, SNAP, NMAT and others", "GATE or institute tests in India; GRE abroad"],
            ["Experience", "Valued in many selection formulas", "Not usually scored"],
          ],
        },
        paragraphs: ["Choose by the work you want to be doing in five years, not by which degree sounds more impressive."],
      },
      {
        h2: "How should an engineer plan CAT and applications?",
        paragraphs: [
          "If Quantitative Ability comes easily from your engineering maths, put the extra hours into verbal ability and reading comprehension. Since most IIMs set sectional minimums, a lopsided score can rule you out even with a high overall percentile.",
        ],
        links: [
          { to: FREE_CAT_MOCK_PATH, label: "Free CAT mock test" },
          { to: CAT_SCORE_CALCULATOR_PATH, label: "CAT score calculator" },
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
          { to: MBA_PATHS.counselling, label: "MBA counselling" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA after B.Tech a good idea?",
        a: "It is a good idea when you want a management role and can name it. If you want to stay in core engineering, an MTech, MS or simply more experience may serve you better.",
      },
      {
        q: "Do IIMs prefer engineers?",
        a: "Published IIM policies do not say they prefer engineers. They weigh the CAT score, academics, work experience and, in several cases, academic and gender diversity — each as set out in that IIM's own policy.",
      },
      {
        q: "Can I do an MBA straight after engineering?",
        a: "Yes. The two-year MBA admits freshers, including at the IIMs. Work experience can add points and make your interview answers more concrete, so weigh a year or two of work if your goals are still unclear.",
      },
    ],
    sources: present([DMS?.selectionSource, SJMSOM?.selectionSource, MDI?.selectionSource]),
  },

  {
    path: "/mba-resources/mba-after-bba",
    seoTitle: "MBA After BBA: Worth It?",
    description:
      "MBA after BBA: whether to go straight in or work first, how institutes score experience, avoiding repetition of your BBA, and which exams to take.",
    h1: "MBA After BBA: Straight Away or Work First?",
    answer:
      "You can go straight from a BBA into an MBA — the IIMs and most B-schools admit freshers. But a BBA already covers much of an MBA's first-year basics, so a year or two of work often makes the MBA count for more: clearer goals, stronger interview answers and, at many institutes, extra points for experience in the selection formula.",
    cardDetail: "Going straight in or working first, and how to avoid repetition",
    updated: UPDATED,
    sections: [
      {
        h2: "Is an MBA after BBA worth it?",
        paragraphs: [
          "It can be, particularly from a well-placed institute. A BBA gives you breadth at the undergraduate level; a good MBA adds depth, a peer group of people from different backgrounds, internships and access to campus recruitment that most BBA programmes do not have.",
          "The risk is paying for two years that feel like a repeat. That depends on the programme you join and on whether you arrive with experience to make sense of the material.",
        ],
        links: [{ to: "/mba-resources/is-mba-worth-it", label: "Is an MBA worth it?" }],
      },
      {
        h2: "Should you do an MBA straight after BBA or work first?",
        table: {
          caption: "Going straight in vs working first",
          head: ["", "Straight after BBA", "Work one to three years first"],
          rows: [
            ["Selection", "Relies on CAT score and academics", "Experience adds points in many formulas"],
            ["Interviews", "Answers rest on college projects and internships", "Answers draw on real work"],
            ["Classroom", "First-year basics may feel familiar", "Concepts connect to problems you have seen"],
            ["Placements", "Fresher roles; some recruiters prefer experience", "Access to roles that ask for prior experience"],
            ["Cost", "No salary given up yet", "You give up a salary for two years"],
          ],
        },
      },
      {
        h2: "How do institutes score work experience?",
        paragraphs: present([
          "Each institute decides, in its published policy. A few examples from official documents:",
        ]),
        bullets: present([
          policyPoint(IIM_SAMBALPUR, /male candidates with >=1 year relevant work experience/, "")
            ? `${IIM_SAMBALPUR!.shortName} sets a lower General minimum percentile for men with at least one year of relevant work experience.`
            : null,
          MDI && stageWeights(MDI, 1)?.includes("Work experience 10%") ? `${MDI.shortName} gives work experience 10% at both its shortlisting and final stages.` : null,
          KJSIM && stageDetail(KJSIM, /12-42 months of work experience/)
            ? `${KJSIM.shortName} runs a separate profile-based track for candidates with 12 to 42 months of work experience.`
            : null,
          SJMSOM && stageWeights(SJMSOM, 1)?.includes("work experience 5%") ? `${SJMSOM.shortName} gives work experience 5% in its interview shortlist.` : null,
        ]),
        links: present([
          IIM_SAMBALPUR ? { to: collegePath(IIM_SAMBALPUR.slug), label: `${IIM_SAMBALPUR.shortName} profile` } : null,
          KJSIM ? { to: collegePath(KJSIM.slug), label: `${KJSIM.shortName} profile` } : null,
        ]),
      },
      {
        h2: "How do you avoid repeating your BBA in the MBA?",
        bullets: [
          "Choose a programme whose second-year electives go well beyond what you studied, and check the course list before applying.",
          "Use the first year to go deeper — case work, live projects and competitions — rather than coasting on familiar topics.",
          "Pick a specialisation that adds a skill you lack, such as analytics, or deepens one you want to lead with.",
        ],
        links: [{ to: MBA_PATHS.specialisations, label: "MBA specialisations" }],
      },
      {
        h2: "Which exams should a BBA graduate take?",
        paragraphs: [
          "The same as anyone else: CAT for the IIMs and most top schools, then XAT, SNAP or NMAT if XLRI, Symbiosis or NMIMS are on your list. A BBA helps with business awareness in interviews; the entrance tests themselves reward quantitative, reading and reasoning skills, so prepare for those directly.",
        ],
        links: [
          { to: "/mba-resources/cat-vs-xat-vs-snap-vs-nmat", label: "CAT vs XAT vs SNAP vs NMAT" },
          { to: FREE_CAT_MOCK_PATH, label: "Free CAT mock test" },
          { to: MBA_PATHS.predictor, label: "CAT college predictor" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is an MBA after BBA a waste of time?",
        a: "Not if you choose a strong programme and arrive with a clear purpose. It can feel repetitive in the first year, which is why many BBA graduates work for a year or two first.",
      },
      {
        q: "Can I get into an IIM straight after BBA?",
        a: "Yes. The IIMs admit freshers to their two-year MBA. You need to clear each IIM's minimum percentiles and rank well on its composite score and interview.",
      },
      {
        q: "How many years of work experience are best before an MBA after BBA?",
        a: "There is no single answer. One to three years is a common choice for the two-year MBA; one-year programmes usually ask for more. Check how your target institutes score experience.",
      },
    ],
    sources: present([
      policyPoint(IIM_SAMBALPUR, /male candidates with >=1 year relevant work experience/, "")?.source,
      MDI?.selectionSource,
      KJSIM?.selectionSource,
      SJMSOM?.selectionSource,
    ]),
  },

  {
    path: "/mba-resources/how-to-get-into-iim",
    seoTitle: "How to Get Into an IIM: Step by Step",
    description:
      "How to get into an IIM: CAT, minimum percentiles by category, composite-score shortlisting, CAP and JAP, WAT and interview — from the IIMs' own policies.",
    h1: "How to Get Into an IIM: Scores, Profile and Interviews",
    answer:
      "To get into an IIM, take CAT, clear that IIM's published minimum percentiles — overall and sectional — for your category, then rank high on its composite score, which adds academics, work experience and diversity factors as its own policy sets out. Shortlisted candidates take a written test or interview, and the final offer re-weights everything.",
    cardDetail: "CAT, minimums, composite scores, CAP/JAP and interviews",
    updated: UPDATED,
    sections: [
      {
        h2: "What are the steps to an IIM seat?",
        table: {
          caption: "How IIM admission works (from the IIMs' published admission policies)",
          head: ["Step", "What happens"],
          rows: [
            ["1. Take CAT", `${CAT_DATE ? `CAT ${CAT_LATEST.year}: ${CAT_DATE.value}.` : `Take CAT ${CAT_LATEST.year}.`}${catFact("How often it is held")?.value.includes("paid once") ? " One registration fee covers every IIM programme you apply to." : ""}`],
            ["2. Meet the eligibility", CAT_ELIGIBILITY_SAYS_50 ? "Bachelor's degree with at least 50% (45% for SC, ST and PwBD); some IIMs add Class X, XII or graduation minimums" : "A bachelor's degree with the minimum marks in CAT's eligibility rules"],
            ["3. Clear the minimum percentiles", "Overall and sectional minimums for your category; many IIMs also need a positive score in every section"],
            ["4. Composite-score shortlist", "CAT combined with Class X, XII and graduation marks, work experience and diversity factors, as weighted by each IIM"],
            ["5. Written test and interview", "WAT or AWT and a personal interview; formats differ by IIM"],
            ["6. Final merit list", "Interview, CAT and profile re-weighted; offers and waitlists follow"],
          ],
        },
        links: [
          { to: examPath("cat"), label: "CAT exam pattern and dates" },
          { to: "/mba-resources/mba-admission-process", label: "MBA admission process, step by step" },
        ],
      },
      {
        h2: "What CAT percentile do the IIMs ask for?",
        paragraphs: [
          `For a General, non-PwD candidate the published overall minimums run from ${GENERAL.min} (${joinNames(GENERAL.minNames)}) to ${GENERAL.max} (${joinNames(GENERAL.maxNames)}). Reserved categories have lower thresholds, and sectional minimums apply on top. These are the bars to be considered, not the percentiles at which calls actually go out.`,
        ],
        table: CATEGORY_RANGES.length
          ? {
              caption: "Lowest and highest published IIM overall minimum, by category (non-PwD)",
              head: ["Category", "Lowest overall minimum", "Highest overall minimum"],
              rows: CATEGORY_RANGES.map(({ category, range }) => [
                category,
                `${range.min} (${joinNames(range.minNames)})`,
                `${range.max} (${joinNames(range.maxNames)})`,
              ]),
            }
          : undefined,
        links: [
          { to: MBA_PATHS.iimCutoffs, label: "Every IIM's cut-offs by category" },
          { to: MBA_PATHS.predictor, label: "Check your percentile against every IIM" },
          { to: "/mba-resources/good-cat-percentile", label: "What is a good CAT percentile?" },
        ],
      },
      {
        h2: "How do IIMs shortlist candidates after CAT?",
        paragraphs: [
          "Clearing the minimums puts you in the pool. Each IIM then ranks the pool on its own composite score. A few examples of what the policies say:",
        ],
        table: (() => {
          const points = present([
            policyPoint(IIMA, /application rating 35%/, "Applies its minimums to a normalised composite: CAT total percentile 65%, application rating 35%"),
            policyPoint(IIM_SHILLONG, /35% NARS/, "No overall minimum; shortlists on 65% CAT percentile and 35% application rating, by academic discipline, category and gender"),
            policyPoint(IIM_KOZHIKODE, /CA\/CMA\/CS 50%/, "Adds Class X, XII and graduation minimums, and needs a positive scaled score in every CAT section"),
            policyPoint(IIM_AMRITSAR, /Class X\/XII and graduation are scoring parameters/, "Scores Class X, XII and graduation in its shortlist; needs a positive raw score in every section"),
            policyPoint(IIM_UDAIPUR, /work-ex\/gender/, "Uses Class X, XII and graduation marks, work experience and gender for the interview shortlist"),
            policyPoint(IIM_SAMBALPUR, /male candidates with >=1 year relevant work experience/, "Sets a lower General minimum for women and for men with a year or more of relevant work experience"),
            policyPoint(IIM_BANGALORE, /were higher/, "States that the scores of those called for interviews were higher than its published cut-offs"),
          ]);
          return points.length
            ? { caption: "What selected IIM admission policies add beyond the CAT minimum", head: ["IIM", "What its policy says", "Policy batch"], rows: points.map((p) => [p.c.shortName, p.text, p.batch]) }
            : undefined;
        })(),
      },
      {
        h2: "What are CAP and JAP?",
        paragraphs: present([
          policyPoint(IIM_BODH_GAYA, /CAP 2026 \(IIM Bodh Gaya, IIM Jammu, IIM Sirmaur/, "")
            ? "CAP, the Common Admission Process, is run jointly by IIM Bodh Gaya, IIM Jammu and IIM Sirmaur: you register once and are considered by all three, each with its own published shortlisting cut-offs."
            : null,
          policyPoint(IIM_RAIPUR, /common JAP 2026 policy/, "")
            ? "JAP, the Joint Admission Process, does the same for IIM Kashipur, IIM Raipur, IIM Ranchi and IIM Tiruchirappalli, under a common policy coordinated by IIM Raipur."
            : null,
          "The other IIMs run their own processes. Watch each one's application window after CAT results — missing a registration step can cost you a call you would otherwise have had.",
        ]),
        links: present([IIM_BODH_GAYA, IIM_RAIPUR].map((c) => (c ? { to: collegePath(c.slug), label: `${c.shortName} profile` } : null))),
      },
      {
        h2: "What can you still improve before CAT?",
        bullets: [
          "Sectional balance: a weak section can rule you out regardless of your overall percentile.",
          "Timing under pressure: full-length mocks in CAT's fixed section order, reviewed carefully afterwards.",
          "Your application story: why an MBA, why now, and what you did in college or at work that shows it.",
          "Interview readiness: your academic subjects, your work, current affairs and your own form, which interviewers read closely.",
        ],
        links: [
          { to: FREE_CAT_MOCK_PATH, label: "Free CAT mock test" },
          { to: CAT_SCORE_CALCULATOR_PATH, label: "CAT score calculator" },
          { to: "/mba-resources/mba-interview-preparation", label: "MBA interview preparation" },
          { to: MBA_PATHS.counselling, label: "MBA counselling" },
        ],
      },
    ],
    faqs: [
      {
        q: "Can I get into an IIM with 90 percentile?",
        a: IIM_AT_OR_BELOW_90.length
          ? `${IIM_AT_OR_BELOW_90.length} of the ${IIM_COUNT} IIMs we track publish a General overall minimum of 90 or below (for men, where the policy splits by gender), so 90 can make you eligible for consideration there if your sectional percentiles clear their minimums too. Interview calls usually need more, and composite scores decide who is shortlisted.`
          : "A 90 percentile clears some IIMs' published minimums, but interview calls usually need more, and composite scores decide who is shortlisted.",
      },
      {
        q: "Do IIMs look at Class 10 and 12 marks?",
        a: "Many do. Several policies score Class X, XII and graduation marks in the composite, and some set separate minimums for them. Check each IIM's policy.",
      },
      {
        q: "Is work experience required to get into an IIM?",
        a: "Not for the two-year MBA. Many IIMs give points for experience in their composite score, but freshers are admitted.",
      },
      {
        q: "Does a high CAT percentile guarantee an IIM seat?",
        a: "No. The final offer depends on the interview and written test as well as the CAT score, academics and profile, weighted as each IIM's policy sets out.",
      },
    ],
    sources: present([
      CAT_DATE?.source,
      catFact("How often it is held")?.source,
      CAT_ELIGIBILITY?.source,
      ...cutoffSources(),
    ]),
  },

  {
    path: "/mba-resources/good-cat-percentile",
    seoTitle: "What Is a Good CAT Percentile?",
    description:
      "What is a good CAT percentile? Official IIM minimums by category, why a minimum is not the cut-off, sectional minimums, and which colleges fit your band.",
    h1: "What Is a Good CAT Percentile for IIMs and Top B-Schools?",
    answer: `A good CAT percentile is one that clears the published minimums of the colleges you want, with room to spare. For a General candidate, IIM overall minimums range from ${GENERAL.min} to ${GENERAL.max}, plus sectional minimums; reserved categories have lower thresholds. A minimum only makes you eligible — interview calls usually go out at higher percentiles.`,
    cardDetail: "Official minimums by category, and why minimum is not cut-off",
    updated: UPDATED,
    sections: [
      {
        h2: "What are the minimum CAT percentiles by category?",
        paragraphs: [
          "Every IIM publishes minimum percentiles for each category in its admission policy. The range across the IIMs we track:",
        ],
        table: CATEGORY_RANGES.length
          ? {
              caption: "Lowest and highest published IIM overall minimum, by category (non-PwD, any gender)",
              head: ["Category", "Lowest overall minimum", "Highest overall minimum"],
              rows: CATEGORY_RANGES.map(({ category, range }) => [
                category,
                `${range.min} (${joinNames(range.minNames)})`,
                `${range.max} (${joinNames(range.maxNames)})`,
              ]),
            }
          : undefined,
        bullets: [
          "PwD candidates have separate, lower thresholds in each policy.",
          IIM_SHILLONG ? `${IIM_SHILLONG.shortName} sets sectional minimums only, with no overall minimum.` : "Some IIMs set sectional minimums only.",
          "Some figures are from 2026-28 policies (CAT 2025) where an IIM has not yet published its 2027-29 policy; the cut-offs page shows the batch for each.",
        ],
        links: [
          { to: MBA_PATHS.iimCutoffs, label: "Every IIM's minimums by category" },
          { to: MBA_PATHS.predictor, label: "Check your percentile against every IIM" },
        ],
      },
      {
        h2: "Is the minimum percentile the same as the cut-off?",
        paragraphs: [
          "No, and the IIMs say so themselves. A minimum decides who is considered; the percentile at which interview calls actually go out depends on the applicant pool and the composite score, and is usually higher.",
          (() => {
            const raipur = generalOverall(IIM_RAIPUR);
            const ranchi = generalOverall(IIM_RANCHI);
            const trichy = generalOverall(IIM_TRICHY);
            return raipur !== null && ranchi !== null && trichy === ranchi && ranchi > raipur
              ? `The joint admission process shows the gap: the common minimum to register was ${raipur} overall for General candidates, while ${IIM_RANCHI!.shortName} and ${IIM_TRICHY!.shortName} list ${ranchi} as the figure for interview shortlisting.`
              : "";
          })(),
        ].filter(Boolean),
        bullets: present([
          policyPoint(IIM_CALCUTTA, /may be much higher/, "") && IIM_CALCUTTA
            ? `${IIM_CALCUTTA.shortName}: “the actual section-wise and overall percentile cut-offs may be much higher than the above-mentioned minimum percentiles”.`
            : null,
          policyPoint(IIM_BANGALORE, /were higher/, "") && IIM_BANGALORE ? `${IIM_BANGALORE.shortName}: “The scores of those called for interviews were higher.”` : null,
          policyPoint(IIM_VIZAG, /not for admission offers/, "") && IIM_VIZAG
            ? `${IIM_VIZAG.shortName}: “These cut-offs are not for admission offers, but only for Phase 1 shortlist.”`
            : null,
          policyPoint(IIM_TRICHY, /necessary but not sufficient/, "") && IIM_TRICHY
            ? `${IIM_TRICHY.shortName}: achieving the cut-off percentile “is a necessary but not sufficient condition”.`
            : null,
        ]),
      },
      {
        h2: "Why do sectional percentiles matter?",
        paragraphs: present([
          "Most IIMs set a minimum for each of the three sections as well as overall. A 97 overall with one weak section can fail a sectional minimum and rule you out.",
          generalMinimumPhrase(IIMA) && IIMA ? `${IIMA.shortName}'s General minimum, for example, is ${generalMinimumPhrase(IIMA)}.` : null,
          "Many policies also require a positive score in every section. Plan your preparation so no section is left behind.",
        ]),
        links: [{ to: examPath("cat"), label: "CAT sections and pattern" }],
      },
      {
        h2: "Which colleges are realistic at your percentile?",
        paragraphs: [
          "Our percentile pages list, for each band, the institutes whose published General figure — minimum, shortlisting or previous-year final, labelled as such — is at or below it.",
        ],
        table: PUBLISHED_BANDS.length
          ? {
              caption: "Institutes in our verified data with a published General figure at or below each percentile",
              head: ["Your percentile", "Institutes with a published figure at or below it"],
              rows: PUBLISHED_BANDS.map((p) => [`${p} percentile`, String(bandCount(MBA_SNAPSHOT, p))]),
            }
          : undefined,
        links: PUBLISHED_BANDS.map((p) => ({ to: percentilePath(p), label: `MBA colleges at ${p} percentile` })),
      },
      {
        h2: "How can you estimate your percentile before results?",
        paragraphs: [
          MCQ_MARKING && TITA_MARKING
            ? `Work out your raw score first. Each correct answer earns ${MCQ_MARKING.correct} marks; a wrong multiple-choice answer costs ${Math.abs(MCQ_MARKING.incorrect)}${TITA_MARKING.incorrect === 0 ? ", and a wrong typed-in (TITA) answer costs nothing" : ""}. Percentiles then depend on how everyone else scored, so any estimate before results is only a guide.`
            : "Work out your raw score first; percentiles then depend on how everyone else scored, so any estimate before results is only a guide.",
          CAT_RESULT ? `The official result is ${CAT_RESULT.value.replace(/\s*\(no exact date published\)/, "")}.` : "",
        ].filter(Boolean),
        links: [
          { to: CAT_SCORE_CALCULATOR_PATH, label: "CAT score calculator" },
          { to: FREE_CAT_MOCK_PATH, label: "Free CAT mock test" },
        ],
      },
    ],
    faqs: [
      {
        q: "Is 90 percentile good in CAT?",
        a: IIM_AT_OR_BELOW_90.length
          ? `It clears the published General overall minimum at ${IIM_AT_OR_BELOW_90.length} of the ${IIM_COUNT} IIMs we track (for men, where the policy splits by gender), subject to sectional minimums, and many other B-schools. Interview calls at most IIMs usually need more.`
          : "It clears some IIMs' published minimums and many other B-schools' figures. Interview calls at most IIMs usually need more.",
      },
      {
        q: "What percentile do you need for IIM Ahmedabad, Bangalore or Calcutta?",
        a: [IIMA, IIM_BANGALORE, IIM_CALCUTTA].every((c) => generalMinimumPhrase(c))
          ? `Their published General minimums are ${generalMinimumPhrase(IIMA)} (${IIMA!.shortName}), ${generalMinimumPhrase(IIM_BANGALORE)} (${IIM_BANGALORE!.shortName}) and ${generalMinimumPhrase(IIM_CALCUTTA)} (${IIM_CALCUTTA!.shortName}). Those who actually get calls usually score well above these minimums.`
          : "Each publishes its minimums in its admission policy; those who get calls usually score well above them.",
      },
      {
        q: "Is a minimum percentile the same as a cut-off?",
        a: "No. A minimum makes you eligible to be considered. Shortlisting then uses a composite score, and the percentile of those actually called is usually higher.",
      },
    ],
    sources: present([...cutoffSources(), CAT_LATEST.source, CAT_RESULT?.source]),
  },

  {
    path: "/mba-resources/mba-scholarships",
    seoTitle: "MBA Scholarships in India",
    description:
      "MBA scholarships in India: institute aid, merit awards, category fee concessions and loans — what institutes' own fee documents say, and how to apply.",
    h1: "MBA Scholarships and Financial Aid in India",
    answer:
      "MBA financial aid in India comes in a few forms: institute aid — need-based grants, merit scholarships and fee concessions for some categories — government scholarship schemes, and education loans. Amounts and rules differ by institute and year, so read each college's fees-and-aid page, and do not count on aid until the institute or scheme confirms it in writing.",
    cardDetail: "Institute aid, category concessions, loans and what to check",
    updated: UPDATED,
    sections: [
      {
        h2: "What kinds of MBA financial aid are there?",
        table: {
          caption: "Types of MBA financial aid",
          head: ["Type", "Who offers it", "What to check"],
          rows: [
            ["Need-based financial aid", "The institute", "Income documents needed, when you apply, and whether it is a grant or a loan"],
            ["Merit scholarships", "The institute, alumni or sponsors", "Whether it is decided at entry or on performance in the programme, and renewal rules"],
            ["Category fee concessions", "The institute's fee rules", "Which categories qualify and which fee heads are waived"],
            ["Government scholarship schemes", "Central and state governments", "Eligibility, income limits and the official portal"],
            ["Education loans", "Banks and lenders", "Interest, collateral, moratorium and repayment period"],
          ],
        },
      },
      {
        h2: "Which institutes publish fee concessions or aid?",
        paragraphs: [
          "From the institutes' own fee documents in our data — figures are as each states them, for the batch it names:",
        ],
        bullets: [
          ...FEE_CONCESSIONS.map((x) => `${x.c.shortName}: ${x.text}`),
          ...(AID_PAGES.length
            ? [`${joinNames(AID_PAGES.map((x) => x.c.shortName))} publish financial aid or scholarship information alongside their fees; the pages are linked in the sources below.`]
            : []),
        ],
        links: [...FEE_CONCESSIONS, ...AID_PAGES].map((x) => ({ to: collegePath(x.c.slug), label: `${x.c.shortName} fees` })),
      },
      {
        h2: "How do you apply for an MBA scholarship?",
        bullets: [
          "Read the institute's fees and financial aid page as soon as you are shortlisted; some processes open only after you accept an offer.",
          "Keep the documents ready: income certificates or tax returns for need-based aid, and a valid category certificate for concessions.",
          "Note the deadlines and whether aid is reviewed each year against your academic performance.",
          "For government schemes, apply through the official portal and keep the institute informed.",
        ],
      },
      {
        h2: "Should you take an education loan for an MBA?",
        paragraphs: [
          "Many students fund an MBA partly with a loan. Size it against a realistic outcome — the median salary in the institute's own placement report, not the highest package — and against the repayment you could manage if your first job pays less than that median.",
        ],
        links: [
          { to: "/mba-resources/is-mba-worth-it", label: "Is an MBA worth it?" },
          { to: MBA_PATHS.fees, label: "MBA fees compared" },
          { to: MBA_PATHS.placements, label: "Median MBA salaries" },
        ],
      },
      {
        h2: "What should you watch out for?",
        bullets: [
          "A 'scholarship' offered by an agent in exchange for paying fees through them.",
          "Discounts off a fee that was never the official one; compare with the institute's published fee document.",
          "Aid promised verbally. Ask for the terms in writing from the institute.",
        ],
        links: [{ to: MBA_PATHS.counselling, label: "Get MBA admission guidance" }],
      },
    ],
    faqs: [
      {
        q: "Do IIMs give scholarships?",
        a: AID_PAGES.some((x) => x.c.group === "IIM")
          ? `Several IIMs publish financial aid information with their fees — for example ${joinNames(AID_PAGES.filter((x) => x.c.group === "IIM").map((x) => x.c.shortName))}. Terms are set by each institute; check its page for the current batch.`
          : "Several IIMs publish financial aid information with their fees. Terms are set by each institute; check its page for the current batch.",
      },
      {
        q: "Are there MBA fee concessions for SC and ST students?",
        a: FEE_CONCESSIONS.length
          ? `Some institutes state them in their fee documents — ${joinNames(FEE_CONCESSIONS.map((x) => x.c.shortName))}, for example. Government scholarship schemes may also apply; check eligibility on the official portal.`
          : "Some institutes state them in their fee documents, and government scholarship schemes may also apply.",
      },
      {
        q: "Can I get an MBA scholarship with a low CAT score?",
        a: "Need-based aid looks at financial need rather than your score; merit awards look at performance. Check the criteria on each institute's own page.",
      },
    ],
    sources: present([...FEE_CONCESSIONS.map((x) => feeSource(x.c)), ...AID_PAGES.map((x) => x.source)]),
  },

  {
    path: "/mba-resources/mba-interview-preparation",
    seoTitle: "MBA Interview Preparation: WAT, GD, PI",
    description:
      "MBA interview preparation: what WAT, GD and PI involve, how much each counts in official selection formulas, other formats B-schools use, how to prepare.",
    h1: "MBA Interview Preparation: WAT, GD and PI",
    answer:
      "After shortlisting, most MBA institutes test you through some mix of a Written Ability Test (WAT), Group Discussion (GD) and Personal Interview (PI). Each publishes its own format and weights; at some, the interview counts as much as the entrance score. Prepare by knowing your own profile thoroughly, reading widely, and practising structured writing and speaking.",
    cardDetail: "What each round tests, how much it counts, how to prepare",
    updated: UPDATED,
    sections: [
      {
        h2: "What are WAT, GD and PI?",
        table: {
          caption: "MBA selection rounds",
          head: ["Round", "What happens", "What it tests"],
          rows: [
            ["Written Ability Test (WAT)", "A short essay on a given topic, in a fixed time", "Structure, clarity and a reasoned point of view"],
            ["Group Discussion (GD)", "A group discusses a topic or case under observation", "Contribution, listening, logic and composure"],
            ["Personal Interview (PI)", "One-to-one or panel conversation", "Your goals, background, academics, work and awareness"],
          ],
        },
        paragraphs: ["Not every institute uses all three; the IIMs, for example, each choose their own combination of a written test and interview."],
        links: [
          { to: "/mba-resources/how-to-get-into-iim", label: "How to get into an IIM" },
          { to: "/mba-resources/mba-admission-process", label: "MBA admission process" },
        ],
      },
      {
        h2: "How much do the interview rounds count?",
        paragraphs: ["Institutes that publish their final weights show how much rests on these rounds:"],
        table: FINAL_WEIGHTS.length
          ? {
              caption: "Final selection weights (from each institute's official admission document)",
              head: ["Institute", "Rounds after shortlisting", "Published final weights"],
              rows: FINAL_WEIGHTS.map((x) => [x.c.shortName, x.rounds, x.weights]),
            }
          : undefined,
        links: FINAL_WEIGHTS.slice(0, 4).map((x) => ({ to: collegePath(x.c.slug), label: `${x.c.shortName} selection process` })),
      },
      {
        h2: "How do you prepare for the WAT?",
        bullets: [
          "Practise writing to time: a clear opening position, two or three reasoned points, a counter-view and a conclusion.",
          "Read an editorial page daily and summarise one argument in your own words.",
          "Expect abstract topics as well as current affairs; structure matters more than knowing facts.",
          "Write by hand if the institute's test is on paper; your speed changes.",
        ],
      },
      {
        h2: "How do you prepare for a group discussion?",
        bullets: [
          "Make a few substantive points rather than many short interruptions.",
          "Build on others' points by name; summarising well is a strong contribution.",
          "Practise with a group and get feedback on how often you spoke, and whether it moved the discussion.",
          "Stay calm when the group gets loud; evaluators notice composure.",
        ],
      },
      {
        h2: "How do you prepare for the personal interview?",
        bullets: [
          "Know every line of your application form; interviewers read it closely.",
          "Have a specific, honest answer to 'why an MBA, why now, why this institute'.",
          "Revise the core subjects of your degree, and be ready to explain your work in plain terms.",
          "Follow the main business and economic news of the past few months.",
          "Take at least two mock interviews with people who will be critical.",
        ],
        links: [{ to: MBA_PATHS.counselling, label: "MBA counselling with interview preparation" }],
      },
      {
        h2: "What other selection formats might you face?",
        paragraphs: OTHER_FORMATS.length
          ? ["Several institutes replace or supplement WAT-GD-PI with formats of their own, as their official admission documents describe:"]
          : ["Several institutes replace or supplement WAT-GD-PI with formats of their own; read each admission policy."],
        bullets: OTHER_FORMATS.length ? OTHER_FORMATS : undefined,
      },
      {
        h2: "When are MBA interviews held?",
        paragraphs: present([
          "Most rounds run between January and April, after entrance results. Some published windows for 2027:",
        ]),
        bullets: present([
          MDI && stageDetail(MDI, /WAT-GD-PI between February and April 2027/) ? `${MDI.shortName}: WAT-GD-PI between February and April 2027.` : null,
          IMT && stageDetail(IMT, /CTPI from 8 January 2027/) ? `${IMT.shortName}: CTPI from 8 January 2027.` : null,
          SCMHRD && stageDetail(SCMHRD, /GE-PI 30-31 Jan and 2-12 Feb 2027/) ? `${SCMHRD.shortName}: GE-PI on 30–31 January and 2–12 February 2027.` : null,
          SIBM && stageDetail(SIBM, /3-7 and 10-14 Feb 2027/) ? `${SIBM.shortName}: online GE-PI on 3–7 and 10–14 February 2027.` : null,
        ]),
        links: [{ to: MBA_PATHS.hub, label: "MBA Admission Guide 2027" }],
      },
    ],
    faqs: [
      {
        q: "What is WAT-GD-PI in MBA admission?",
        a: "Written Ability Test, Group Discussion and Personal Interview — the rounds institutes use after shortlisting on the entrance score. Each institute chooses its own combination and weights.",
      },
      {
        q: "How long should I prepare for MBA interviews?",
        a: "Start as soon as you have taken the entrance exam, before shortlists arrive. Four to six weeks of steady practice in writing, discussion and mock interviews is a reasonable plan.",
      },
      {
        q: "Do IIMs still hold group discussions?",
        a: "It varies by IIM and by year. Several use a written test and a personal interview; check the current admission policy of each IIM that shortlists you.",
      },
    ],
    sources: present([...FINAL_WEIGHTS.map((x) => x.c.selectionSource), FMS?.selectionSource, IMT?.selectionSource, GREAT_LAKES?.selectionSource, IMI?.selectionSource, SPJIMR?.selectionSource, NMIMS?.selectionSource, SCMHRD?.selectionSource, MDI?.selectionSource]),
  },

  ...CAT_PREP_GUIDES,
];

export const getGuide = (path: string): MbaGuide | undefined => MBA_GUIDES.find((g) => g.path === path);
