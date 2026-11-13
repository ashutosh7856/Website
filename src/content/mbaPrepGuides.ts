import type { OfficialSource, Source } from "@/api/mba";
import type { ExamInfo } from "@/data/mbaSnapshotTypes";
import type { GuideSection, GuideTable, MbaGuide } from "@/content/mbaGuides";
import {
  CAT_2025_MEDIA_RELEASE,
  CAT_2026_KEY_DATES,
  CAT_EXAM,
  CAT_LATEST,
  CAT_MARKING_SOURCE,
  examInfo,
} from "@/lib/mbaPublic";
import { MBA_PATHS, examPath, percentilePath } from "@/lib/mbaRoutes.mjs";

/**
 * CAT and MBA exam preparation guides. Exam facts (sections, timing, marking,
 * dates) come only from the official snapshot — cat_exam.json and
 * exams/<id>.json — and are cited in each guide's Sources; the study advice is
 * ProCounsel's own explanation. Nothing here uses ProCounsel's question banks,
 * promises a score or percentile, or quotes anyone.
 *
 * Listed in MBA_GUIDES (mbaGuides.ts) after the admission guides, in the same
 * order as their paths in MBA_GUIDE_PATHS.
 */

const UPDATED = "2026-11-13";

// ── Official facts, phrased once ──────────────────────────────────────────────

const present = <T,>(xs: (T | null | undefined)[]): T[] => xs.filter((x): x is T => x !== null && x !== undefined);
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const YEAR = CAT_LATEST.year;
const MCQ = CAT_LATEST.marking.find((m) => m.type === "MCQ");
const TITA = CAT_LATEST.marking.find((m) => m.type === "TITA");
const PER_SECTION = CAT_LATEST.sections[0]?.durationMinutes ?? null;
const SAME_SECTION_TIME = CAT_LATEST.sections.every((s) => s.durationMinutes === PER_SECTION);
const SECTION_ORDER = CAT_LATEST.sections.map((s) => s.id).join(", then ");
/** Latest CAT year whose question counts are published (counts come out after the exam). */
const COUNTED = CAT_EXAM.versions.find((v) => v.sections.every((s) => s.questionCount !== null));
const COUNTED_TOTAL = COUNTED ? COUNTED.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0) : null;
const countOf = (sid: string) => COUNTED?.sections.find((s) => s.id === sid)?.questionCount ?? null;
const CAT_DATE = CAT_2026_KEY_DATES.find((d) => d.label === "Exam date");
const CAT_ADMIT = CAT_2026_KEY_DATES.find((d) => d.label === "Admit card download");
const CAT_RESULT = CAT_2026_KEY_DATES.find((d) => d.label === "Result");
const CAT_INFO = examInfo("cat");
const CAT_PWD_160 = Boolean(CAT_INFO?.patternNotes?.includes("160 minutes"));

const markingLine = (): string =>
  MCQ && TITA
    ? `A correct answer earns ${MCQ.correct} marks. A wrong multiple-choice (MCQ) answer costs ${Math.abs(MCQ.incorrect)} mark${TITA.incorrect === 0 ? "; a wrong type-in (TITA) answer costs nothing" : ""}, and an unanswered question scores 0.`
    : "The CAT Centre's documents give the marks for correct and wrong answers; check the latest notice before the exam.";

/** Consecutive CAT years with the same total questions and total time, oldest first (official media releases). */
const PATTERN_ERAS = (() => {
  const eras: { from: number; to: number; questions: number; minutes: number }[] = [];
  for (const v of [...CAT_EXAM.versions].reverse()) {
    if (!v.sections.every((s) => s.questionCount !== null)) continue;
    const questions = v.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0);
    const last = eras[eras.length - 1];
    if (last && last.questions === questions && last.minutes === v.totalDurationMinutes) last.to = v.year;
    else eras.push({ from: v.year, to: v.year, questions, minutes: v.totalDurationMinutes });
  }
  return eras;
})();

const CAT_PATTERN_TABLE: GuideTable = {
  caption: `CAT ${YEAR} sections and timing (official)`,
  head: ["Order", "Section", "Time", COUNTED ? `Questions in CAT ${COUNTED.year}` : "Questions"],
  rows: CAT_LATEST.sections.map((s, i) => [
    String(i + 1),
    `${s.name} (${s.id})`,
    s.durationMinutes !== null ? `${s.durationMinutes} min` : "Not stated",
    countOf(s.id) !== null ? String(countOf(s.id)) : "Announced after the exam",
  ]),
};

const CAT_ERA_TABLE: GuideTable | undefined =
  PATTERN_ERAS.length > 1
    ? {
        caption: "How the CAT pattern has changed (official media releases)",
        head: ["Years", "Questions", "Total time"],
        rows: [...PATTERN_ERAS].reverse().map((e) => [e.from === e.to ? String(e.from) : `${e.from}–${e.to}`, String(e.questions), `${e.minutes} min`]),
      }
    : undefined;

const catSources = (): (OfficialSource | Source)[] => present([CAT_LATEST.source, COUNTED?.source, CAT_MARKING_SOURCE, ...(CAT_INFO?.sources ?? [])]);

// Other exams (exams/<id>.json)
const XAT = examInfo("xat");
const SNAP = examInfo("snap");
const NMAT = examInfo("nmat");

const examDate = (e: ExamInfo | undefined, label: RegExp) => e?.dates.find((d) => label.test(d.label)) ?? null;
const examFact = (e: ExamInfo | undefined, label: string) => e?.facts.find((f) => f.label === label) ?? null;
const examSources = (e: ExamInfo | undefined): OfficialSource[] => present([e?.patternSource, ...(e?.sources ?? [])]);
const examQuestions = (e: ExamInfo | undefined) =>
  e && e.sections.every((s) => s.questionCount !== null) ? e.sections.reduce((n, s) => n + (s.questionCount ?? 0), 0) : null;

const examTable = (e: ExamInfo | undefined, caption: string): GuideTable | undefined =>
  e && e.sections.length
    ? {
        caption,
        head: ["Section", "Questions", "Time"],
        rows: [
          ...e.sections.map((s) => [
            s.name,
            s.questionCount !== null ? String(s.questionCount) : "Not stated",
            s.durationMinutes !== null ? `${s.durationMinutes} min` : "Shared time",
          ]),
          ...(e.totalDurationMinutes !== null ? [["Total", examQuestions(e) !== null ? String(examQuestions(e)) : "—", `${e.totalDurationMinutes} min`]] : []),
        ],
      }
    : undefined;

const XAT_DATE = examDate(XAT, /exam/i);
const XAT_REG_CLOSE = examDate(XAT, /registration closes/i);
const XAT_GK = XAT?.sections.find((s) => /General Knowledge/i.test(s.name));
const XAT_DM = XAT?.sections.find((s) => /Decision Making/i.test(s.name));
const XAT_PART1_MIN = XAT && XAT.totalDurationMinutes !== null && XAT_GK?.durationMinutes ? XAT.totalDurationMinutes - XAT_GK.durationMinutes : null;
/** Part 1: +1 / −0.25, and −0.10 per unattempted question beyond 12 (XAT 2027 bulletin wording). */
const XAT_MARKING_KNOWN = Boolean(XAT?.markingText?.includes("-0.25") && XAT.markingText.includes("-0.10") && XAT.markingText.includes("after 12"));
const XAT_FIVE_OPTIONS = Boolean(examFact(XAT, "Mode")?.value.includes("five options"));

const SNAP_TESTS = SNAP?.dates.filter((d) => /^SNAP 0\d/.test(d.label)) ?? [];
const SNAP_RESULT = examDate(SNAP, /result/i);
const SNAP_REG_CLOSE = examDate(SNAP, /registration/i);
const SNAP_Q = examQuestions(SNAP);
const SNAP_BEST_SCORE = Boolean(examFact(SNAP, "How often it is held")?.value.includes("higher score"));
const SNAP_QUARTER_NEGATIVE = Boolean(SNAP?.markingText?.includes("25% negative"));
const SNAP_FOUR_OPTIONS = Boolean(SNAP?.patternNotes?.includes("four responses"));
const SNAP_MERIT = Boolean(SNAP?.resultAndCounselling?.includes("SNAP score scaled to 50, GE 10, PI 40"));

const NMAT_Q = examQuestions(NMAT);
const NMAT_WINDOW_OPEN = examDate(NMAT, /delivery window opens/i);
const NMAT_WINDOW_CLOSE = examDate(NMAT, /delivery window closes/i);
const NMAT_NO_NEGATIVE = Boolean(NMAT?.markingText?.includes("no negative marking"));
const NMAT_ATTEMPTS = Boolean(examFact(NMAT, "How often it is held")?.value.includes("three attempts"));
const NMAT_ORDER = Boolean(NMAT?.patternNotes?.includes("picks the order") && NMAT.patternNotes.includes("cannot return"));
const secondsPerQuestion = (s: { questionCount: number | null; durationMinutes: number | null }) =>
  s.questionCount && s.durationMinutes ? Math.round((s.durationMinutes * 60) / s.questionCount) : null;

// ── Links every guide carries ─────────────────────────────────────────────────

const L = {
  predictor: { to: MBA_PATHS.predictor, label: "CAT college predictor" },
  score: { to: MBA_PATHS.scoreCalculator, label: "CAT score calculator" },
  mocks: { to: MBA_PATHS.freeMocks, label: "Free CAT mock tests" },
  pyq: { to: MBA_PATHS.pyqPapers, label: "CAT previous year papers" },
  cutoffs: { to: MBA_PATHS.iimCutoffs, label: "IIM cut-offs" },
  band90: { to: percentilePath(90), label: "MBA colleges at 90 percentile" },
  band80: { to: percentilePath(80), label: "MBA colleges at 80 percentile" },
  catPattern: { to: examPath("cat"), label: `CAT ${YEAR} exam pattern` },
  deadlines: { to: MBA_PATHS.deadlines, label: "MBA admission deadlines" },
  compare: { to: MBA_PATHS.compare, label: "Compare MBA colleges" },
  goodPercentile: { to: "/mba-resources/good-cat-percentile", label: "What is a good CAT percentile?" },
  examsCompared: { to: "/mba-resources/cat-vs-xat-vs-snap-vs-nmat", label: "CAT vs XAT vs SNAP vs NMAT" },
  strategy: { to: "/mba-resources/cat-preparation-strategy", label: "CAT preparation strategy" },
  syllabus: { to: "/mba-resources/cat-syllabus", label: "CAT syllabus" },
  varc: { to: "/mba-resources/cat-varc-preparation", label: "CAT VARC preparation" },
  dilr: { to: "/mba-resources/cat-dilr-preparation", label: "CAT DILR preparation" },
  quant: { to: "/mba-resources/cat-quant-preparation", label: "CAT quant preparation" },
  examDay: { to: "/mba-resources/cat-exam-day-strategy", label: "CAT exam-day strategy" },
  interview: { to: "/mba-resources/mba-interview-preparation", label: "MBA interview preparation" },
};

/** The "check where you stand" section every CAT guide ends its body with. */
const toolsSection = (h2 = "Which free tools help you track where you stand?"): GuideSection => ({
  h2,
  paragraphs: [
    "Mocks tell you how you are preparing; the official figures tell you what you are preparing for. Use both: take timed mocks and actual past papers in the app, work out raw scores the way the CAT Centre marks them, and check any percentile — from a mock or the real result — against the minimums the IIMs publish.",
  ],
  links: [L.mocks, L.pyq, L.score, L.predictor, L.cutoffs, L.band90],
});

// ── The guides ────────────────────────────────────────────────────────────────

export const CAT_PREP_GUIDES: MbaGuide[] = [
  {
    path: "/mba-resources/cat-preparation-strategy",
    group: "prep",
    seoTitle: "CAT Preparation Strategy: 12, 6 & 3-Month Plans",
    description:
      "A CAT preparation strategy that works: what to do in 12, 6 or 3 months, how to split time across VARC, DILR and Quant, and when to start mocks.",
    h1: "CAT Preparation Strategy: 12-Month, 6-Month and 3-Month Plans",
    answer: `Prepare for CAT in three phases: build concepts in all three sections, practise timed sets, then take full mocks and review them hard. With 12 months you can go slowly and fix basics; with 6 you overlap the phases; with 3 you lean on mocks and your strongest areas. CAT gives ${PER_SECTION ?? 40} minutes per section, so speed matters in every section.`,
    cardDetail: "Phase-by-phase plans for 12, 6 and 3 months",
    updated: UPDATED,
    takeaways: [
      "Every plan has the same three phases: concepts, timed practice, full mocks with review. Only the length of each phase changes.",
      `CAT has ${CAT_LATEST.sections.length} sections with ${SAME_SECTION_TIME && PER_SECTION ? `${PER_SECTION} minutes each` : "their own timers"} and a fixed order, so no section can be ignored.`,
      "Most IIMs set sectional minimums as well as an overall one; a balanced score beats a lopsided one.",
      "A mock is only as useful as the review after it. Plan at least as much review time as test time.",
    ],
    sections: [
      {
        h2: "What does CAT test, and how is it timed?",
        paragraphs: [
          `CAT ${YEAR} has ${CAT_LATEST.sections.length} sections in a fixed order (${SECTION_ORDER})${SAME_SECTION_TIME && PER_SECTION ? `, ${PER_SECTION} minutes each` : ""}, ${CAT_LATEST.totalDurationMinutes} minutes in all${CAT_LATEST.sectionOrderLocked ? ", and you cannot move between sections" : ""}. ${markingLine()}`,
          COUNTED && COUNTED_TOTAL ? `The CAT Centre announces question counts only after the exam; CAT ${COUNTED.year} had ${COUNTED_TOTAL} questions.` : "",
        ].filter(Boolean),
        table: CAT_PATTERN_TABLE,
        links: [L.catPattern, L.syllabus],
      },
      {
        h2: "What is the 12-month CAT plan?",
        paragraphs: ["Twelve months is enough to learn every topic properly, including the ones you skipped at school. Use the time to build habits, not to cram."],
        table: {
          caption: "A 12-month CAT plan",
          head: ["Months", "Focus", "What a week looks like"],
          rows: [
            ["1–4", "Concepts in all three sections", "Quant topics one at a time; daily reading of long-form articles; 2–3 DILR sets a week to learn set types"],
            ["5–8", "Timed sectional practice", "Timed RC passages and DILR sets; mixed Quant practice; one sectional test a week"],
            ["9–10", "Full mocks begin", "One full mock every week or two, with a full review; fix the weakest topic between mocks"],
            ["11–12", "Mock-led revision", "One or two full mocks a week; revise formulas and error notes; settle a section strategy"],
          ],
        },
        links: [L.varc, L.dilr, L.quant],
      },
      {
        h2: "What is the 6-month CAT plan?",
        paragraphs: [
          "Six months means overlapping the phases. Spend the first two months on concepts while doing timed sets from week one, start sectional tests in month three and full mocks in month four.",
        ],
        bullets: [
          "Months 1–2: Quant fundamentals (arithmetic, algebra, geometry, numbers); one RC passage and two DILR sets a day.",
          "Months 3–4: sectional tests twice a week; the first full mocks; keep a mistake log by topic.",
          "Months 5–6: a full mock every three or four days, each followed by a review as long as the test; revise weak topics only.",
        ],
      },
      {
        h2: "What is the 3-month CAT plan?",
        paragraphs: [
          "Three months is tight but workable if you are honest about priorities. Do not try to cover everything; make sure you can attempt the questions you are most likely to get right, in every section.",
        ],
        bullets: [
          "Weeks 1–4: the highest-return Quant topics for you (usually arithmetic first), RC every day, and DILR set selection practice.",
          "Weeks 5–8: two sectional tests and one full mock a week; review each one the same day.",
          "Weeks 9–12: a full mock every two or three days; no new topics in the last two weeks.",
          "Throughout: sleep and a fixed study slot matter more than extra hours.",
        ],
      },
      {
        h2: "How should you split time across VARC, DILR and Quant?",
        paragraphs: [
          "Start with roughly equal time and shift it towards your weakest section once your first sectional tests show where you lose marks. Because most IIMs publish a minimum for every section, the aim is to lift the weakest section above a safe level before polishing the strongest.",
        ],
        links: [L.cutoffs, L.goodPercentile],
      },
      {
        h2: "When should you start mocks, and how many should you take?",
        paragraphs: [
          "Take a first full mock early, even before you feel ready, to see the format. Regular mocks start once most concepts are done. The number matters less than the review: for each mock, note attempts, accuracy and time per section, and the reason behind every wrong or skipped question.",
        ],
        links: [L.mocks, L.pyq],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: "Is 6 months enough for CAT preparation?",
        a: "For most people, yes, if the time is used consistently: a fixed daily slot, every topic covered once, and regular mocks from the fourth month. Whether it is enough for a particular percentile depends on your starting point, which no plan can promise.",
      },
      {
        q: "How many hours a day should I study for CAT?",
        a: "There is no official or universal figure. Two to three focused hours on weekdays and longer sessions at weekends is a common pattern for people with jobs or college; full-time aspirants often do more. Consistency over months matters more than long single days.",
      },
      {
        q: "Should I start with my strong or weak section?",
        a: "Begin with concepts in all three, then give extra time to the weakest. Sectional minimums at most IIMs mean a weak section can rule you out even with a high overall score.",
      },
      {
        q: "Can I prepare for CAT in 3 months?",
        a: "You can prepare meaningfully in three months by prioritising: high-return topics, daily reading, set selection in DILR and frequent mocks with review. Covering every topic in depth is unlikely in that time, so choose deliberately.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-syllabus",
    group: "prep",
    seoTitle: `CAT Syllabus ${YEAR}: Section-wise Topics`,
    description: `CAT syllabus ${YEAR}: the three official sections, their timing and marking, and the topics to prepare in VARC, DILR and Quantitative Ability.`,
    h1: `CAT Syllabus ${YEAR}: Section-wise Topics for VARC, DILR and Quant`,
    answer: `The CAT Centre publishes no detailed syllabus — its documents name only the three sections: Verbal Ability and Reading Comprehension, Data Interpretation and Logical Reasoning, and Quantitative Ability. Below are the topics those sections draw on, the ${YEAR} timing and marking from the official notice, and how to plan your preparation around them.`,
    cardDetail: "Sections, timing and the topics to prepare",
    updated: UPDATED,
    takeaways: [
      "There is no official topic-wise CAT syllabus; the official documents name the three sections only.",
      "Quant is roughly Class 8–10 mathematics applied fast: arithmetic, algebra, geometry and numbers.",
      "VARC is mostly reading comprehension, with a smaller verbal ability part.",
      "DILR has no formulas to learn; it is practised through sets.",
    ],
    sections: [
      {
        h2: "Is there an official CAT syllabus?",
        paragraphs: [
          `No. The CAT ${YEAR} notice describes the three sections, their timing and the test format, but no topic list. The topics below are what the section names cover in practice; treat them as a preparation checklist, not an official list.`,
        ],
        table: CAT_PATTERN_TABLE,
        links: [L.catPattern],
      },
      {
        h2: "What is in the VARC syllabus?",
        bullets: [
          "Reading comprehension: passages on economics, society, science, philosophy, history, art and culture, each with several questions on the main idea, inference, tone, the author's view and specific detail.",
          "Para jumbles: arranging sentences into a coherent paragraph (often typed in, so no negative mark).",
          "Para summary: choosing the option that best captures a paragraph.",
          "Odd sentence out and sentence placement: finding the sentence that does not fit, or where a sentence belongs.",
        ],
        links: [L.varc],
      },
      {
        h2: "What is in the DILR syllabus?",
        bullets: [
          "Data interpretation: tables, bar and line charts, pie charts, caselets, data with missing values.",
          "Logical reasoning: arrangements (linear, circular, matrix), scheduling, selections and groups, tournaments and rankings, networks and routes, games and puzzles, Venn-style overlaps.",
          "Mixed sets: data and logic together, where you must reason out values that are not given directly.",
        ],
        links: [L.dilr],
      },
      {
        h2: "What is in the Quantitative Ability syllabus?",
        table: {
          caption: "CAT Quant topics to prepare",
          head: ["Area", "Topics"],
          rows: [
            ["Arithmetic", "Percentages, profit and loss, simple and compound interest, ratio and proportion, mixtures and alligation, averages, time and work, time, speed and distance"],
            ["Algebra", "Linear and quadratic equations, inequalities, functions and graphs, logarithms, sequences and series (AP, GP), polynomials"],
            ["Geometry and mensuration", "Lines and angles, triangles, circles, polygons, coordinate geometry, areas and volumes"],
            ["Number system", "Divisibility, HCF and LCM, remainders, factors, base systems, digits"],
            ["Modern maths", "Permutations and combinations, probability, set theory"],
          ],
        },
        links: [L.quant],
      },
      {
        h2: "How is CAT marked?",
        paragraphs: [markingLine(), "Questions are a mix of multiple choice and type-in-the-answer (TITA). There is no published question-type split for the coming exam."],
        links: [L.score],
      },
      {
        h2: "How has the CAT pattern changed?",
        paragraphs: ["Topics have stayed broadly the same; the number of questions and the time have not. Older papers are still good topic practice, but time yourself to the current pattern."],
        table: CAT_ERA_TABLE,
        links: [L.pyq, L.mocks],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: `Has the CAT ${YEAR} syllabus changed?`,
        a: `The CAT ${YEAR} notice keeps the same three sections${SAME_SECTION_TIME && PER_SECTION ? ` with ${PER_SECTION} minutes each` : ""}. Since there is no official topic list, there is nothing official to change; question counts for ${YEAR} come out only after the exam.`,
      },
      {
        q: "Is CAT Quant based on Class 10 or Class 12 maths?",
        a: "Mostly concepts up to Class 10, with a few Class 11–12 ideas such as logarithms, sequences, permutations and probability. The difficulty comes from applying them quickly and combining them, not from advanced theory.",
      },
      {
        q: "Is grammar tested in CAT VARC?",
        a: "Not as standalone grammar questions in recent papers. Good grammar still helps with reading speed and with para jumbles and summaries.",
      },
    ],
    sources: [...catSources(), ...CAT_EXAM.versions.map((v) => v.source)],
  },

  {
    path: "/mba-resources/cat-varc-preparation",
    group: "prep",
    seoTitle: "How to Prepare for CAT VARC",
    description:
      "How to prepare for CAT VARC: building reading speed, a method for RC passages, para jumbles and summaries, and how to practise under the section timer.",
    h1: "CAT VARC Preparation: Reading Comprehension and Verbal Ability",
    answer: `Prepare for CAT VARC by reading every day, practising timed reading comprehension, and learning a method for para jumbles, summaries and odd-one-out questions. Reading comprehension is most of the section, so comprehension speed matters more than vocabulary lists. You get ${PER_SECTION ?? 40} minutes, with negative marks only on multiple-choice questions.`,
    cardDetail: "Reading habit, RC method, verbal question types",
    updated: UPDATED,
    takeaways: [
      "Reading comprehension is the larger part of VARC; build reading stamina before chasing tricks.",
      "Read unfamiliar subjects — philosophy, economics, science — not only what you enjoy.",
      "For each RC answer, find the line in the passage that supports it.",
      "Type-in verbal questions carry no negative mark, so attempt them.",
    ],
    sections: [
      {
        h2: "What does CAT VARC test?",
        paragraphs: [
          `VARC is the first section of CAT${PER_SECTION ? `, with ${PER_SECTION} minutes` : ""}. ${countOf("VARC") !== null && COUNTED ? `CAT ${COUNTED.year} had ${countOf("VARC")} VARC questions. ` : ""}It is mostly reading comprehension, plus verbal ability questions: para jumbles, para summaries, odd sentence out and sentence placement.`,
        ],
        links: [L.syllabus, L.catPattern],
      },
      {
        h2: "How do you build reading speed for CAT?",
        bullets: [
          "Read 30–45 minutes of long-form writing daily: essays, opinion pieces, magazine features, book reviews.",
          "Deliberately read subjects you find dull. CAT passages range widely, and the uncomfortable ones cost the most time.",
          "After each article, write its main point in one sentence and the author's attitude in one word. This is exactly what RC questions ask.",
          "Track time per passage in practice; speed comes from comprehension, not skimming.",
        ],
      },
      {
        h2: "What is a good method for RC passages?",
        bullets: [
          "Read the passage once, actively: note the main idea of each paragraph and where the author's view shows.",
          "For each question, go back to the passage. Choose the option the passage supports, not the one that sounds true.",
          "Watch for extreme words (always, never, only) and options that are true but do not answer the question.",
          "Choose passages: if one is dense and unfamiliar, attempt an easier one first and come back if time allows.",
        ],
      },
      {
        h2: "How do you approach verbal ability questions?",
        bullets: [
          "Para jumbles: find the opening sentence (one that introduces, not one that refers back), then link pairs by pronouns, connectors and chronology.",
          "Para summary: the right option covers the whole paragraph's point without adding anything; eliminate options that are too narrow or too broad.",
          "Odd sentence out: find the theme the other sentences share and the one that drifts.",
          TITA && TITA.incorrect === 0 ? "Where a verbal question is type-in, a wrong answer costs nothing, so always enter your best answer." : "Read the marking for each question type before guessing.",
        ],
      },
      {
        h2: "How should you practise VARC under time?",
        paragraphs: [
          `Move from untimed passages to timed ones within a few weeks, then take the full ${PER_SECTION ?? 40}-minute section. In each sectional test, note how long each passage took and which question types you got wrong. A pattern across tests (for example inference questions, or one kind of passage) is what to work on.`,
        ],
        links: [L.mocks, L.pyq],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: "How can I improve my CAT VARC score quickly?",
        a: "Pick the right passages and attempt every type-in verbal question. Accuracy gains come from checking each answer against the passage. Reading speed improves only with weeks of daily reading, so start that regardless of your timeline.",
      },
      {
        q: "Do I need to learn vocabulary lists for CAT?",
        a: "Not in isolation. Recent CAT papers have no standalone vocabulary questions; words you meet while reading widely are enough, and context usually makes meanings clear.",
      },
      {
        q: "Should I attempt all RC passages?",
        a: "Not necessarily. Selecting passages you can answer accurately often scores more than rushing through all of them. Decide in the first few minutes based on readability.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-dilr-preparation",
    group: "prep",
    seoTitle: "How to Prepare for CAT DILR",
    description:
      "How to prepare for CAT DILR: the set types to learn, how to choose sets in the exam, a solving method and a daily practice plan.",
    h1: "CAT DILR Preparation: Set Types, Set Selection and Practice",
    answer: `Prepare for CAT DILR by solving sets every day, learning the common set types, and practising set selection — choosing which sets to attempt in the first minutes of the section. DILR has no formulas to memorise; scores come from organising information quickly and accurately. The section is timed at ${PER_SECTION ?? 40} minutes.`,
    cardDetail: "Set types, choosing sets, practice method",
    updated: UPDATED,
    takeaways: [
      "DILR is practised through sets, not theory. Aim for a few sets every day.",
      "Set selection — which sets to attempt — matters as much as solving.",
      "Draw a clean table or diagram before answering anything.",
      "Solving one set fully beats half-solving two.",
    ],
    sections: [
      {
        h2: "What does CAT DILR test?",
        paragraphs: [
          `DILR is the second section${PER_SECTION ? ` (${PER_SECTION} minutes)` : ""}. ${countOf("DILR") !== null && COUNTED ? `CAT ${COUNTED.year} had ${countOf("DILR")} DILR questions, asked in sets that share one piece of information. ` : "Questions come in sets that share one piece of information. "}Some sets are mostly numbers (tables, charts), some are mostly logic (arrangements, schedules, tournaments), and many mix the two.`,
        ],
        links: [L.syllabus, L.catPattern],
      },
      {
        h2: "Which set types should you learn?",
        bullets: [
          "Tables and charts with derived values (growth, shares, averages).",
          "Arrangements: linear, circular, matrix and floor-wise.",
          "Scheduling and selection: who does what, when, under constraints.",
          "Tournaments and rankings: matches, points, positions.",
          "Routes and networks: flows, paths and minimum costs.",
          "Games and puzzles with rules, and Venn-style overlaps.",
        ],
      },
      {
        h2: "How do you choose sets in the exam?",
        bullets: [
          "Spend the first few minutes reading every set's setup briefly. Do not start solving the first one by default.",
          "Prefer sets with clear rules, few variables and direct questions. Avoid long sets with many conditions unless they are a type you are strong in.",
          "If a set is not resolving after a few minutes, move on and come back only if time remains.",
          "A set where the questions can be answered independently of each other is lower risk.",
        ],
      },
      {
        h2: "What is a good method for solving a set?",
        bullets: [
          "Write down every condition in short form before you start.",
          "Build one table or diagram that holds all of the information; fill certainties first.",
          "When stuck, try cases: assume one possibility and check whether it breaks a condition.",
          "Read each question carefully: 'must be true' and 'could be true' need different checks.",
        ],
      },
      {
        h2: "How should you practise DILR?",
        paragraphs: [
          "Solve two to four sets a day, timed, across different types. After each, compare your method with the solution: was there a faster way to organise the data? Once a week, do a full timed section to practise selection under pressure. Older CAT sets are good practice for set types even though the pattern has changed.",
        ],
        links: [L.pyq, L.mocks],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: "How can I improve at DILR if I am weak in it?",
        a: "Start untimed with simpler sets of each type, then add a timer. Focus on building clean tables and on choosing sets; many students improve more from better selection than from faster solving.",
      },
      {
        q: "How many DILR sets should I attempt in CAT?",
        a: "There is no correct number; it depends on the paper and your accuracy. Solving fewer sets fully and correctly is usually better than attempting many partially.",
      },
      {
        q: "Does DILR need maths?",
        a: "Data interpretation needs quick arithmetic: percentages, ratios and averages. Logical reasoning needs very little maths but careful reading.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-quant-preparation",
    group: "prep",
    seoTitle: "CAT Quant Preparation: Topics and Formulas",
    description:
      "CAT quant preparation: the topics in arithmetic, algebra, geometry, numbers and modern maths, key formulas to know, and how to practise for speed.",
    h1: "CAT Quant Preparation: Topics, Key Formulas and a Practice Plan",
    answer: `Prepare for CAT Quantitative Ability topic by topic — arithmetic, algebra, geometry, number system and modern maths — then practise mixed, timed questions. Most of it is school mathematics used quickly, so learn the core formulas, practise mental arithmetic, and get comfortable with type-in questions where guessing is not possible. The section gets ${PER_SECTION ?? 40} minutes.`,
    cardDetail: "Topic list, key formulas, practice method",
    updated: UPDATED,
    takeaways: [
      "Arithmetic and algebra are the backbone of CAT Quant; start there.",
      "Learn formulas by using them, not by reading lists.",
      "Mixed timed practice is what builds exam speed.",
      "Skip a question that is not opening up in a minute or so; come back if time remains.",
    ],
    sections: [
      {
        h2: "What does CAT Quant cover?",
        paragraphs: [
          `Quantitative Ability is the third section${PER_SECTION ? ` (${PER_SECTION} minutes)` : ""}. ${countOf("QA") !== null && COUNTED ? `CAT ${COUNTED.year} had ${countOf("QA")} questions. ` : ""}It draws on arithmetic, algebra, geometry and mensuration, the number system and modern maths (permutations, probability, sets).`,
        ],
        links: [L.syllabus, L.catPattern],
      },
      {
        h2: "Which arithmetic formulas should you know?",
        bullets: [
          "Percentage change = (new − old) ÷ old × 100. Two successive changes of a% and b% give a net change of a + b + ab/100 %.",
          "Profit % = (selling price − cost price) ÷ cost price × 100. A discount is calculated on the marked price.",
          "Simple interest = P × R × T ÷ 100. Compound amount = P × (1 + R/100)^T.",
          "Alligation: mixing quantities at prices (or concentrations) c1 and c2 to get m gives the ratio (c2 − m) : (m − c1).",
          "Speed = distance ÷ time. Relative speed is the sum (opposite directions) or difference (same direction). Average speed for equal distances at u and v = 2uv ÷ (u + v).",
          "Time and work: if A finishes in a days and B in b days, together they take ab ÷ (a + b) days.",
        ],
      },
      {
        h2: "Which algebra and number formulas should you know?",
        bullets: [
          "Quadratic ax² + bx + c = 0: sum of roots = −b/a, product = c/a; roots are real when b² − 4ac ≥ 0.",
          "AP: nth term = a + (n − 1)d; sum = n/2 × (2a + (n − 1)d). GP: nth term = arⁿ⁻¹; sum of an infinite GP with |r| < 1 = a ÷ (1 − r).",
          "Logs: log(ab) = log a + log b; log(aⁿ) = n log a; logₐb = log b ÷ log a.",
          "Factors: if N = pᵃ × qᵇ × rᶜ, N has (a + 1)(b + 1)(c + 1) factors. HCF × LCM = product of two numbers.",
          "Remainders: work with small remainders and cycles of last digits; (a × b) mod n = ((a mod n) × (b mod n)) mod n.",
          "Counting: nPr = n! ÷ (n − r)!, nCr = n! ÷ (r!(n − r)!). Probability = favourable outcomes ÷ total outcomes.",
        ],
      },
      {
        h2: "Which geometry formulas should you know?",
        bullets: [
          "Triangle area = ½ × base × height; Heron's formula √(s(s − a)(s − b)(s − c)) with s the semi-perimeter.",
          "Pythagoras a² + b² = c²; common triplets 3-4-5, 5-12-13, 8-15-17, 7-24-25.",
          "Equilateral triangle of side a: area = (√3/4)a², height = (√3/2)a.",
          "Circle: area πr², circumference 2πr; the angle at the centre is twice the angle at the circumference on the same arc.",
          "Sum of interior angles of an n-sided polygon = (n − 2) × 180°.",
          "Coordinate geometry: distance √((x₂ − x₁)² + (y₂ − y₁)²); slope (y₂ − y₁) ÷ (x₂ − x₁).",
        ],
      },
      {
        h2: "How should you practise Quant for speed?",
        bullets: [
          "Learn one topic at a time with easy questions, then medium ones, before mixing.",
          "Practise mental calculation: squares to 30, cubes to 15, fraction-percentage equivalents, multiplication shortcuts.",
          "Use options when a question is multiple choice: substitute, estimate or eliminate.",
          TITA && TITA.incorrect === 0 ? "Type-in questions have no negative mark but no options either, so practise solving fully to a number." : "Type-in questions have no options, so practise solving fully to a number.",
          "In mixed practice, do a first pass for questions you can solve quickly and a second for the rest.",
        ],
        links: [L.mocks, L.pyq],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: "Which Quant topics should I start with for CAT?",
        a: "Arithmetic (percentages, ratios, time-speed-distance, time and work) and algebra (equations, inequalities, functions) first, because they also help in DILR. Then geometry, numbers and modern maths.",
      },
      {
        q: "I am from a non-maths background. Can I do well in CAT Quant?",
        a: "Yes, many candidates from commerce and humanities do. Start from basics with easier questions and build up; the concepts are mostly school level, and regular practice matters more than background.",
      },
      {
        q: "Is a formula list enough to prepare?",
        a: "No. Formulas help only when you know when to apply them. Use each one on several questions until you recognise where it fits.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-preparation-for-working-professionals",
    group: "prep",
    seoTitle: "CAT Preparation for Working Professionals",
    description:
      "How to prepare for CAT with a full-time job: a weekly timetable, what to do on weekdays and weekends, using short breaks, and planning mocks around work.",
    h1: "CAT Preparation for Working Professionals: A Plan That Fits a Job",
    answer: `Prepare for CAT alongside a job by fixing a short daily slot on weekdays for concepts and reading, and using weekends for longer timed practice and mocks. Consistency matters more than long hours. Plan backwards from the exam date${CAT_DATE ? ` (${CAT_DATE.value.split(",").slice(0, 2).join(",").trim()})` : ""}, and keep the last month mostly for mocks and review.`,
    cardDetail: "Weekday and weekend plan around a full-time job",
    updated: UPDATED,
    takeaways: [
      "Weekdays: one to two focused hours on concepts, sets and reading. Weekends: timed sections and full mocks.",
      "Protect one fixed study slot; morning slots survive busy workdays better.",
      "Use commutes and breaks for reading and formula revision.",
      "Work experience counts in many IIM composite scores, so your job is part of your application too.",
    ],
    sections: [
      {
        h2: "How much time do you need with a job?",
        paragraphs: [
          "There is no official figure, but many working candidates prepare over 6 to 12 months with one to two hours on weekdays and four to six hours at weekends. Starting earlier lets you keep sessions short; starting late forces long weekends, which are harder to sustain.",
        ],
      },
      {
        h2: "What does a weekly timetable look like?",
        table: {
          caption: "A sample week for a working CAT aspirant",
          head: ["Day", "Session", "Focus"],
          rows: [
            ["Mon", "1–1.5 h", "Quant concept + 15 practice questions"],
            ["Tue", "1–1.5 h", "Two RC passages + one verbal set"],
            ["Wed", "1–1.5 h", "Two DILR sets, timed"],
            ["Thu", "1–1.5 h", "Quant mixed practice"],
            ["Fri", "Light", "Reading and formula revision"],
            ["Sat", "3–4 h", "Sectional test or full mock, then review"],
            ["Sun", "2–3 h", "Review of the week's mistakes; weak topic"],
          ],
        },
      },
      {
        h2: "How do you stay consistent through busy weeks?",
        bullets: [
          "Keep a minimum version of your plan (one RC passage, one DILR set) for days when work runs late.",
          "Read on the commute: long articles build VARC speed and need nothing else.",
          "Block mock-test time in your calendar like a meeting.",
          "Plan leave around the last two weeks before CAT if you can, for full mocks at your exam slot's time.",
        ],
      },
      {
        h2: "Does work experience help in IIM admissions?",
        paragraphs: [
          "Many IIMs give marks for work experience in their composite score, with their own rules on how many months count; each IIM's admission policy has the details. That makes your job part of the application, not just a constraint on preparation.",
        ],
        links: [L.cutoffs, { to: "/mba-resources/how-to-get-into-iim", label: "How to get into an IIM" }],
      },
      toolsSection(),
    ],
    faqs: [
      {
        q: "Can I crack CAT while working full time?",
        a: "Many candidates prepare while working; what it takes is a steady routine over months. No plan guarantees a particular percentile, but a job is not a barrier in itself.",
      },
      {
        q: "Should I quit my job to prepare for CAT?",
        a: "Usually not needed. Quitting removes income and the work experience that many IIM composite scores reward. Consider it only if your job leaves no time at all, and talk it through before deciding.",
      },
      {
        q: "How early should a working professional start CAT preparation?",
        a: "Ideally 8 to 12 months before the exam, so that weekday sessions can stay short. With less time, rely on weekends for timed practice and focus on your strongest areas.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-preparation-without-coaching",
    group: "prep",
    seoTitle: "CAT Preparation Without Coaching",
    description:
      "Can you prepare for CAT without coaching? What self-study needs, a plan, free resources including timed mocks and past papers, and when guidance helps.",
    h1: "CAT Preparation Without Coaching: A Self-Study Plan",
    answer: "Yes, you can prepare for CAT without coaching if you have a plan, good practice material and a way to review your mistakes. Self-study needs discipline more than money: learn concepts from standard books, practise daily, take timed mocks and analyse them. Coaching mainly adds structure and doubt-solving, which you can partly replace.",
    cardDetail: "Self-study plan and the free tools that help",
    updated: UPDATED,
    takeaways: [
      "Self-study works when it has a plan, timed practice and honest review.",
      "Free timed mocks and actual past CAT papers are the most important practice material.",
      "A mistake log replaces much of what a coaching class corrects.",
      "Get help where you are stuck: doubt forums, peers or a counsellor for application decisions.",
    ],
    sections: [
      {
        h2: "What does coaching give that you need to replace?",
        bullets: [
          "Structure: a syllabus order and deadlines. Replace with a written plan by week.",
          "Practice material: graded questions and mocks. Replace with free mocks, past papers and topic practice.",
          "Feedback: someone pointing out errors. Replace with a mistake log and mock analysis.",
          "Doubt-solving: replace with solutions, doubt forums and study partners.",
        ],
      },
      {
        h2: "What does a self-study plan look like?",
        paragraphs: [
          "Follow the same three phases as any plan — concepts, timed sectional practice, full mocks with review — and decide in advance how many weeks each gets. Review your plan every month against your mock results and change it if one section is falling behind.",
        ],
        links: [L.strategy, L.varc, L.dilr, L.quant],
      },
      {
        h2: "Which free tools does ProCounsel offer?",
        paragraphs: [
          "ProCounsel is not a coaching institute and does not run classes. The free app (sign-in needed so your work is saved) has tools that cover the practice side of self-study:",
        ],
        bullets: [
          "Full-length and sectional CAT mocks with the real section timer and step-by-step solutions.",
          "Actual past CAT papers as timed tests, each with its own year's timing.",
          "A mistake notebook, a daily challenge, and topic practice.",
          "A study planner and a community for doubts.",
          "Public tools with no login: CAT score calculator, CAT college predictor, IIM cut-offs and colleges by percentile.",
        ],
        links: [L.mocks, L.pyq, L.score, L.predictor],
      },
      {
        h2: "How do you analyse a mock on your own?",
        bullets: [
          "Record attempts, accuracy and time for each section.",
          "For every wrong, skipped or slow question, write why: concept, misreading, calculation or poor choice.",
          "Re-solve wrong questions after two days without looking at the solution.",
          "Choose one fix to work on before the next mock.",
        ],
      },
      {
        h2: "When is outside help worth it?",
        paragraphs: [
          "If one section is stuck after months of practice, targeted help for that section can be worth more than a full course. After the exam, choosing where to apply and preparing for interviews are areas where an experienced counsellor can help; ProCounsel's MBA counselling call is free.",
        ],
        links: [L.interview, L.goodPercentile],
      },
    ],
    faqs: [
      {
        q: "Can I crack CAT without coaching?",
        a: "Many candidates prepare on their own. Success depends on consistent practice and review, not on coaching itself, though no method can guarantee a percentile.",
      },
      {
        q: "What are the best free resources for CAT?",
        a: "Actual past CAT papers, timed mocks, and daily reading of long-form articles. ProCounsel's app has free mocks and past papers as timed tests; the CAT Centre's own website has the official notices and pattern.",
      },
      {
        q: "How do I stay motivated studying alone?",
        a: "Set weekly targets you can check, take a mock on a fixed day, and study with a partner or community. Progress you can measure in mock analysis keeps self-study going.",
      },
    ],
    sources: catSources(),
  },

  {
    path: "/mba-resources/cat-exam-day-strategy",
    group: "prep",
    seoTitle: "CAT Exam Day and Section-wise Strategy",
    description: `CAT exam day strategy: the last week, the day itself, how negative marking should shape attempts, and a section-wise plan for VARC, DILR and Quant.`,
    h1: "CAT Exam Day Strategy and Section-wise Attempt Strategy",
    answer: `On CAT day, follow a plan you have already tested in mocks: a first pass for questions you can solve, a second for the rest, and no blind guessing on multiple-choice questions. ${MCQ && TITA ? `A wrong MCQ costs ${Math.abs(MCQ.incorrect)} mark while a wrong type-in answer costs ${TITA.incorrect === 0 ? "nothing" : Math.abs(TITA.incorrect)}, ` : "Negative marking differs by question type, "}so attempt type-in questions and be selective with MCQs. Each section has its own ${PER_SECTION ?? 40}-minute timer.`,
    cardDetail: "Last week, the day itself, and attempt strategy",
    updated: UPDATED,
    takeaways: [
      "Do not try anything new on the day; use the plan your mocks proved.",
      MCQ && TITA ? `Marking: ${signed(MCQ.correct)} correct, ${signed(MCQ.incorrect)} wrong MCQ, ${TITA.incorrect} wrong TITA, 0 unanswered.` : "Know the marking scheme before you walk in.",
      "With four choices, a blind MCQ guess gains nothing on average; eliminating one option tips it in your favour.",
      `Sections are locked: unused time in one does not carry over${SAME_SECTION_TIME && PER_SECTION ? ` — you get ${PER_SECTION} minutes for each` : ""}.`,
    ],
    sections: [
      {
        h2: `When is CAT ${YEAR} and what are the key dates?`,
        table: {
          caption: `CAT ${YEAR} key dates (official)`,
          head: ["Event", "Date"],
          rows: CAT_2026_KEY_DATES.map((d) => [d.label, d.value]),
        },
        paragraphs: present([
          CAT_ADMIT ? `Download the admit card in the window (${CAT_ADMIT.value}) and read its instructions in full: they say what to carry, reporting time and what is not allowed.` : null,
          CAT_PWD_160 ? "PwD candidates get 160 minutes in total, as stated in the CAT Centre's media release." : null,
        ]),
        links: [L.catPattern],
      },
      {
        h2: "What should you do in the last week?",
        bullets: [
          "Take one or two full mocks at the same time of day as your slot, not more.",
          "Revise your mistake log and formula notes; no new topics.",
          "Read your admit card instructions, plan the route to the centre and the time you will leave.",
          "Sleep at your exam-day time for the last few nights.",
        ],
      },
      {
        h2: "How should negative marking shape your attempts?",
        paragraphs: present([
          markingLine(),
          MCQ && MCQ.correct === 3 && MCQ.incorrect === -1
            ? "With four answer choices, a blind guess is right one time in four: on average 0.25 × 3 − 0.75 × 1 = 0 marks, so it gains nothing and adds risk. If you can rule out one option, the average becomes 1/3 × 3 − 2/3 × 1 = +1/3 mark, so an educated guess is worth it."
            : null,
          TITA && TITA.incorrect === 0 ? "A type-in answer costs nothing when wrong, so never leave one blank if you have worked towards an answer." : null,
        ]),
        links: [L.score],
      },
      {
        h2: "What is a good section-wise attempt strategy?",
        table: {
          caption: "Section-wise approach",
          head: ["Section", "First minutes", "Main approach"],
          rows: [
            ["VARC", "Scan passages for readability", "Attempt type-in verbal questions; choose RC passages you can read quickly; check every answer against the passage"],
            ["DILR", "Read every set's setup briefly", "Pick the two or three clearest sets and solve them fully; switch if a set is not resolving"],
            ["Quant", "First pass through all questions", "Solve quick ones first, mark the rest for a second pass; leave questions that are not opening up"],
          ],
        },
        paragraphs: [
          "No fixed number of attempts is right for everyone; it depends on the paper and on your accuracy. A target that keeps accuracy high in your mocks is the one to use.",
        ],
      },
      {
        h2: "What if a section goes badly?",
        paragraphs: [
          "Leave it behind when the timer moves on. Percentiles depend on how everyone did, and a section that felt hard was probably hard for others too. The next section is a fresh 40 minutes.",
        ],
      },
      {
        h2: "What should you do after the exam?",
        paragraphs: present([
          "When the response sheet and answer key are released, count your answers and work out your raw score. Then plan applications: other exams, college shortlists and interview preparation.",
          CAT_RESULT ? `The official result is ${CAT_RESULT.value.replace(/\s*\(no exact date published\)/, "")}.` : null,
        ]),
        links: [L.score, L.predictor, L.band90, L.deadlines, L.interview],
      },
    ],
    faqs: [
      {
        q: "Should I guess in CAT?",
        a: MCQ && MCQ.incorrect === -1
          ? "Not blindly on multiple-choice questions: with four options a pure guess averages zero marks. Guess when you can eliminate at least one option, and always enter an answer on type-in questions, which carry no negative mark."
          : "Check the marking scheme: guess on question types without negative marking, and only educated guesses elsewhere.",
      },
      {
        q: "How many questions should I attempt in CAT?",
        a: "There is no official or safe number. Attempt as many as you can while keeping accuracy high; your mock results show the balance that works for you.",
      },
      {
        q: "Can I switch between sections in CAT?",
        a: CAT_LATEST.sectionOrderLocked
          ? `No. The sections come in a fixed order, each with its own ${PER_SECTION ?? 40}-minute timer, and you cannot go back to a section once its time is over.`
          : "Check the latest CAT notice for section rules.",
      },
      {
        q: "What should I carry to the CAT exam centre?",
        a: "Exactly what your admit card's instructions list; they include the printed admit card and an accepted photo ID. Read them a few days before so there is time to arrange anything missing.",
      },
    ],
    sources: present([...catSources(), CAT_PWD_160 ? CAT_2025_MEDIA_RELEASE : null, ...CAT_2026_KEY_DATES.map((d) => d.source)]),
  },

  {
    path: "/mba-resources/xat-preparation",
    group: "prep",
    leadExam: "XAT",
    seoTitle: "XAT Preparation: Pattern and Decision Making",
    description: `How to prepare for XAT: the official pattern${XAT_DM ? " including decision making" : ""}, marking with its unattempted-question penalty, GK, and a plan alongside CAT.`,
    h1: "XAT Preparation: Pattern, Decision Making and Strategy",
    answer: `Prepare for XAT on top of your CAT preparation, adding three things: decision-making practice, more reading of critical-reasoning passages, and general knowledge for the separate GK part. XAT's marking${XAT_MARKING_KNOWN ? " also penalises leaving more than 12 questions unattempted" : " has its own rules"}, which changes how you should attempt.${XAT_DATE ? ` XAT is on ${XAT_DATE.value}.` : ""}`,
    cardDetail: "Pattern, decision making, GK and marking",
    updated: UPDATED,
    takeaways: present([
      XAT_DM ? `Decision making (${XAT_DM.questionCount ?? "about 20"} questions) has no CAT equivalent — practise it separately.` : null,
      XAT_PART1_MIN ? `Part 1 has ${XAT_PART1_MIN} minutes with no sectional time limits, so you choose how to split time.` : null,
      XAT_MARKING_KNOWN ? "Beyond 12 unattempted questions, each one left blank costs 0.10 marks." : null,
      "GK is scored separately and used by XLRI in its final selection.",
    ]),
    sections: [
      {
        h2: "What is the XAT exam pattern?",
        table: examTable(XAT, "XAT pattern (official)"),
        paragraphs: present([
          XAT_PART1_MIN && XAT_GK?.durationMinutes ? `Part 1 shares ${XAT_PART1_MIN} minutes across its three sections with no sectional time limits; Part 2 (GK) has ${XAT_GK.durationMinutes} minutes. The official overview gives question counts as approximate.` : null,
          XAT_FIVE_OPTIONS ? "Questions are multiple choice with five options." : null,
        ]),
        links: [{ to: examPath("xat"), label: "XAT exam page" }, L.examsCompared],
      },
      {
        h2: "How is XAT marked, and what does it mean for attempts?",
        paragraphs: present([
          XAT?.markingText ? `The official scheme: ${XAT.markingText}` : null,
          XAT_MARKING_KNOWN && XAT_FIVE_OPTIONS
            ? "With five options, a blind guess averages 0.2 × 1 − 0.8 × 0.25 = 0 marks, while a blank beyond the twelfth costs 0.10. So once you have left 12 questions, an educated guess on the rest beats leaving them, and even a blind guess is better on average than the penalty."
            : null,
        ]),
      },
      {
        h2: "How do you prepare for decision making?",
        bullets: [
          "Read each case for the people affected, the constraints and what the decision-maker actually controls.",
          "The best option usually solves the stated problem fairly and practically, without breaking rules or ignoring stakeholders.",
          "Eliminate options that are extreme, unethical, illegal, or that avoid the decision.",
          "Some cases are numerical (allocation, scheduling); treat them like small DILR sets.",
          "Practise a few cases daily and read the reasoning behind each answer, not just the key.",
        ],
      },
      {
        h2: "How is VA & LR different from CAT VARC?",
        paragraphs: [
          "XAT's verbal section includes reading comprehension (including poems and short passages), critical reasoning, vocabulary and grammar-based questions, which CAT tests less. Add grammar and critical-reasoning practice to your CAT reading routine.",
        ],
        links: [L.varc],
      },
      {
        h2: "How should you prepare for XAT GK and QA & DI?",
        bullets: [
          XAT_GK ? `GK has ${XAT_GK.questionCount ?? 20} questions in ${XAT_GK.durationMinutes ?? 10} minutes and covers static GK and current affairs. Read the news daily from about six months before the exam.` : "Read the news daily for the GK part.",
          "QA & DI follows CAT Quant closely; XAT questions can be longer, so practise time management across sections.",
        ],
        links: [L.quant],
      },
      {
        h2: "When is XAT and how does it fit with CAT?",
        paragraphs: present([
          XAT_REG_CLOSE ? `Registration closes on ${XAT_REG_CLOSE.value}.` : null,
          XAT_DATE ? `The exam is on ${XAT_DATE.value}, after CAT, so most of your preparation overlaps. Use the weeks after CAT for decision-making practice, GK revision and XAT-style mocks.` : null,
        ]),
        links: [L.deadlines, L.mocks],
      },
    ],
    faqs: [
      {
        q: "Is XAT tougher than CAT?",
        a: "It is different rather than simply harder: decision making, a GK part and a penalty for too many unattempted questions have no CAT equivalent, while XAT has no sectional time limits. Your comfort with each format matters more than a general ranking.",
      },
      {
        q: "Does XAT GK count?",
        a: "GK is scored separately. XLRI uses it in its final selection; other institutes decide for themselves whether to use it.",
      },
      {
        q: "How long does XAT preparation take if I am preparing for CAT?",
        a: "Most of it overlaps. Add regular decision-making and GK practice for a couple of months, and take XAT-pattern mocks in the weeks after CAT.",
      },
    ],
    sources: examSources(XAT),
  },

  {
    path: "/mba-resources/snap-preparation",
    group: "prep",
    leadExam: "SNAP",
    seoTitle: "SNAP Preparation: Pattern and Strategy",
    description: `How to prepare for SNAP: the official pattern${SNAP_Q ? ` (${SNAP_Q} questions${SNAP?.totalDurationMinutes ? ` in ${SNAP.totalDurationMinutes} minutes` : ""})` : ""}, negative marking, speed, multiple attempts and the GE-PI stage.`,
    h1: "SNAP Preparation: Pattern, Speed and Strategy",
    answer: `SNAP is a speed test${SNAP_Q && SNAP?.totalDurationMinutes ? ` — ${SNAP_Q} questions in ${SNAP.totalDurationMinutes} minutes` : ""} — for the Symbiosis institutes. Prepare with your CAT basics, then practise answering quickly and accurately under SNAP timing. ${SNAP_TESTS.length > 1 && SNAP_BEST_SCORE ? `You can take up to ${SNAP_TESTS.length} tests and the higher score counts. ` : ""}The SNAP score is only part of the final merit, which also includes a group exercise and an interview.`,
    cardDetail: "Pattern, speed, attempts and GE-PI",
    updated: UPDATED,
    takeaways: present([
      SNAP_Q && SNAP?.totalDurationMinutes ? `${SNAP_Q} questions in ${SNAP.totalDurationMinutes} minutes: about ${Math.round((SNAP.totalDurationMinutes * 60) / SNAP_Q)} seconds a question.` : null,
      SNAP_QUARTER_NEGATIVE ? "Each wrong answer costs a quarter of a mark." : null,
      SNAP_TESTS.length > 1 && SNAP_BEST_SCORE ? `Up to ${SNAP_TESTS.length} attempts; the higher score counts.` : null,
      SNAP_MERIT ? "Final merit: SNAP scaled to 50, group exercise 10, personal interaction 40." : null,
    ]),
    sections: [
      {
        h2: "What is the SNAP exam pattern?",
        table: examTable(SNAP, "SNAP pattern (official)"),
        paragraphs: present([SNAP?.markingText ? `Marking (official): ${SNAP.markingText}` : null, "There are no sectional time limits; you can attempt sections in any order."]),
        links: [{ to: examPath("snap"), label: "SNAP exam page" }, L.examsCompared],
      },
      {
        h2: "How do you prepare for SNAP's speed?",
        bullets: [
          "Practise in short, strict timed blocks: for example 20 questions in 20 minutes.",
          "Take a first pass for questions you can answer immediately; skip the rest without hesitation.",
          "Keep calculation tricks sharp (percentages, ratios, squares) — there is little time to work long sums.",
          SNAP_QUARTER_NEGATIVE && SNAP_FOUR_OPTIONS
            ? "With a quarter-mark penalty and four options, a blind guess is slightly positive on average (0.25 × 1 − 0.75 × 0.25 = +0.06), and clearly so once one option is eliminated. Guess only when you have narrowed it down if you prefer to keep risk low."
            : "Check the marking before guessing.",
        ],
      },
      {
        h2: "What should you practise for each SNAP section?",
        bullets: [
          "General English: short reading comprehension, vocabulary, grammar and sentence correction.",
          "Analytical and logical reasoning: puzzles, arrangements, syllogisms, series and critical reasoning — the largest share alongside Quant.",
          "Quantitative, DI and data sufficiency: CAT arithmetic and algebra at speed, plus data sufficiency, which CAT rarely tests.",
          "Ethics, morality and values: situational questions; choose fair, practical and responsible options.",
        ],
        links: [L.quant, L.dilr],
      },
      {
        h2: "How do SNAP attempts and dates work?",
        table: SNAP_TESTS.length
          ? { caption: "SNAP test dates (official)", head: ["Test", "Date"], rows: SNAP_TESTS.map((d) => [d.label, d.value]) }
          : undefined,
        paragraphs: present([
          SNAP_REG_CLOSE ? `Registration and payment close on ${SNAP_REG_CLOSE.value}.` : null,
          SNAP_BEST_SCORE ? "If you take more than one test, the higher score is used for your percentile." : null,
          SNAP_RESULT ? `The result is announced on ${SNAP_RESULT.value}.` : null,
        ]),
        links: [L.deadlines],
      },
      {
        h2: "What happens after the SNAP result?",
        paragraphs: present([
          "Each Symbiosis institute shortlists for its group exercise and personal interaction (GE-PI) on the overall SNAP percentile, with its own cut-off for each programme. You must have registered for each programme separately.",
          SNAP_MERIT ? "The final merit list is out of 100: SNAP score scaled to 50, group exercise 10 and personal interaction 40 — so interview preparation matters as much as the test." : null,
        ]),
        links: [L.interview],
      },
    ],
    faqs: [
      {
        q: "Is SNAP easier than CAT?",
        a: "SNAP questions are often more direct, but the time pressure is much higher. Speed and accuracy decide SNAP scores more than depth.",
      },
      {
        q: "Can I take SNAP more than once?",
        a: SNAP_BEST_SCORE && SNAP_TESTS.length > 1 ? `Yes, up to ${SNAP_TESTS.length} times in the cycle, and the higher score counts. Each test is registered and paid for separately.` : "Check the SNAP bulletin for the number of tests in the current cycle.",
      },
      {
        q: "Which colleges accept SNAP?",
        a: "Only the Symbiosis International (Deemed University) institutes, for their programmes. The SNAP exam page lists them from the bulletin.",
      },
    ],
    sources: examSources(SNAP),
  },

  {
    path: "/mba-resources/nmat-preparation",
    group: "prep",
    leadExam: "NMAT",
    seoTitle: "NMAT Preparation: Pattern and Strategy",
    description: `How to prepare for NMAT by GMAC: the official pattern${NMAT_Q ? ` (${NMAT_Q} questions)` : ""}, sectional timing, no negative marking, choosing section order and retakes.`,
    h1: "NMAT Preparation: Pattern, Section Order and Strategy",
    answer: `NMAT by GMAC is a computer-adaptive test${NMAT_Q && NMAT?.totalDurationMinutes ? ` of ${NMAT_Q} questions in ${NMAT.totalDurationMinutes} minutes` : ""} with ${NMAT_NO_NEGATIVE ? "no negative marking" : "its own marking"}, so answer every question. Prepare with your CAT basics, then practise each section's tight timing and decide your section order in advance. ${NMAT_ATTEMPTS ? "You can take it up to three times in a testing year." : ""}`,
    cardDetail: "Pattern, timing per section, order and retakes",
    updated: UPDATED,
    takeaways: present([
      NMAT_NO_NEGATIVE ? "No negative marking: never leave a question blank." : null,
      NMAT_ORDER ? "You choose the order of sections, but cannot return to a section once you leave it." : null,
      "Each section has its own timer; unused time does not carry over.",
      NMAT_ATTEMPTS ? "Up to three attempts in a testing year." : null,
    ]),
    sections: [
      {
        h2: "What is the NMAT exam pattern?",
        table: NMAT
          ? {
              caption: "NMAT pattern (official)",
              head: ["Section", "Questions", "Time", "Time per question"],
              rows: NMAT.sections.map((s) => [
                s.name,
                s.questionCount !== null ? String(s.questionCount) : "Not stated",
                s.durationMinutes !== null ? `${s.durationMinutes} min` : "Not stated",
                secondsPerQuestion(s) !== null ? `about ${secondsPerQuestion(s)} s` : "—",
              ]),
            }
          : undefined,
        paragraphs: present([NMAT?.markingText ? `Scoring (official): ${NMAT.markingText}` : null]),
        links: [{ to: examPath("nmat"), label: "NMAT exam page" }, L.examsCompared],
      },
      {
        h2: "How should you choose your section order?",
        paragraphs: [
          "Start with the section you are most confident in, to settle in, or with the one that needs you freshest — try both orders in mocks and keep the one that scores better. Decide before the test so the three minutes for choosing are not spent deliberating.",
        ],
      },
      {
        h2: "How do you prepare for each NMAT section?",
        bullets: [
          "Language Skills: short reading comprehension, para forming, error identification, prepositions, sentence completion and analogies — at well under a minute a question.",
          "Quantitative Skills: arithmetic, number properties, algebra and probability, plus data interpretation and data sufficiency.",
          "Logical Reasoning: critical reasoning (assumptions, inferences, arguments) and analytical puzzles such as arrangements and syllogisms.",
        ],
        links: [L.quant, L.varc],
      },
      {
        h2: "What does no negative marking change?",
        paragraphs: [
          "Every question should get an answer, even a guess, before a section's time runs out. Keep an eye on the clock and leave the last minute of each section for filling in any remaining answers.",
        ],
      },
      {
        h2: "When can you take NMAT, and how do retakes work?",
        paragraphs: present([
          NMAT_WINDOW_OPEN && NMAT_WINDOW_CLOSE ? `In India the exam window runs from ${NMAT_WINDOW_OPEN.value} to ${NMAT_WINDOW_CLOSE.value}.` : null,
          examFact(NMAT, "How often it is held")?.value ?? null,
        ]),
        links: [L.deadlines],
      },
    ],
    faqs: [
      {
        q: "Is NMAT easier than CAT?",
        a: "NMAT questions are generally shorter and there is no negative marking, but timing per question is tight. Many candidates find it less pressured because retakes are allowed.",
      },
      {
        q: "Is there negative marking in NMAT?",
        a: NMAT_NO_NEGATIVE ? "No. No marks are deducted for wrong or unanswered questions, so answer every question." : "Check the latest GMAC terms for marking.",
      },
      {
        q: "Which colleges accept NMAT?",
        a: "NMIMS and a list of other schools that GMAC publishes; the NMAT exam page lists those in the official list. Check each school's own admission page for its cut-off and process.",
      },
    ],
    sources: examSources(NMAT),
  },
];
