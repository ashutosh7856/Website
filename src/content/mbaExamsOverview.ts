/**
 * What each MBA entrance exam is, in words — no dates, fees or counts. Those
 * come only from the snapshot (cat_exam.json, exams/<id>.json) with sources.
 * These lines describe long-standing, publicly stated roles (who conducts the
 * test, what kind of institutes use it) and are reviewed by the counselling
 * team; anything that changes year to year is left to the exam's own page.
 */
export interface ExamOverview {
  id: string;
  conductedBy: string;
  usedFor: string;
  /** One line on when it is the right exam to add to your plan. */
  whenToConsider: string;
}

export const MBA_EXAM_OVERVIEW: ExamOverview[] = [
  {
    id: "cat",
    conductedBy: "The Indian Institutes of Management, with a different IIM convening it each year",
    usedFor: "Admission to the IIMs' two-year MBA programmes and to many other B-schools, including FMS Delhi, MDI Gurgaon and SPJIMR",
    whenToConsider: "Almost always: it is the one score most top Indian B-schools read.",
  },
  {
    id: "xat",
    conductedBy: "XLRI Jamshedpur, on behalf of the Xavier Association of Management Institutions (XAMI)",
    usedFor: "XLRI's programmes and the other institutes that accept XAT scores",
    whenToConsider: "If XLRI or another XAT-accepting school is on your list; its decision-making section rewards a different kind of preparation from CAT.",
  },
  {
    id: "snap",
    conductedBy: "Symbiosis International (Deemed University)",
    usedFor: "MBA admission to the Symbiosis institutes, such as SIBM Pune and SCMHRD",
    whenToConsider: "If you want a Symbiosis institute, particularly in Pune; SNAP is the only route into most of their MBA seats.",
  },
  {
    id: "nmat",
    conductedBy: "The Graduate Management Admission Council (GMAC)",
    usedFor: "NMIMS and the other schools that take part in NMAT",
    whenToConsider: "If NMIMS is a target, or you want a test you can retake within its testing window.",
  },
  {
    id: "cmat",
    conductedBy: "The National Testing Agency (NTA)",
    usedFor: "AICTE-approved MBA and PGDM programmes that accept it",
    whenToConsider: "As a back-up score for AICTE-approved institutes, many of which accept CMAT alongside CAT.",
  },
  {
    id: "mah-mba-cet",
    conductedBy: "The State Common Entrance Test Cell, Maharashtra",
    usedFor: "MBA/MMS seats in Maharashtra filled through the state's Centralised Admission Process (CAP)",
    whenToConsider: "If you want an MBA or MMS seat in Maharashtra, for example in Mumbai or Pune, through state counselling.",
  },
  {
    id: "mat",
    conductedBy: "The All India Management Association (AIMA)",
    usedFor: "Admission to many private B-schools that accept it",
    whenToConsider: "If you are applying mainly to private institutes that list MAT, or need a test held at several points in the year.",
  },
  {
    id: "gmat",
    conductedBy: "The Graduate Management Admission Council (GMAC)",
    usedFor: "Business schools worldwide, and some Indian programmes, including SPJIMR's PGDM and several one-year programmes",
    whenToConsider: "If you are also applying abroad, or to an Indian programme that lists GMAT, often with work experience.",
  },
];

export const examOverview = (id: string) => MBA_EXAM_OVERVIEW.find((e) => e.id === id);
