import type { SeoFaqItem, SeoSection } from "./SeoArticle";

/**
 * The home page's long-form SEO section and FAQ, kept apart from the rest.
 *
 * `Admissions` is the one route AppRoutes loads eagerly, so anything it imports
 * lands in the entry chunk that every visitor downloads. Keeping the home copy
 * here (and out of `seoContent.ts`, which belongs to lazily-loaded pages) keeps
 * that chunk small.
 *
 * The copy reflects what ProCounsel focuses on: admissions to colleges in
 * India, study abroad, MBA, our partner colleges, and the free predictors.
 * Claims stay factual — no rankings, success rates or student counts that we
 * cannot point to.
 */

export const homeContent: { title: string; intro: string; sections: SeoSection[] } = {
  title: "Admissions in India, Study Abroad and MBA: Guidance That Starts From Your Situation",
  intro:
    "Students rarely lack information. They lack a way to filter it. Cut-offs, counselling rounds, college lists, entrance exams and deadlines all arrive at once, and most of the advice around them is generic. ProCounsel works on four things: admissions to colleges in India, study abroad, MBA admissions, and the free predictors that help you see where you stand before you decide.",
  sections: [
    {
      heading: "Study in India: counselling for your stream and your exam",
      paragraphs: [
        "Admission in India is decided exam by exam and round by round. A JEE Main rank goes through JoSAA and CSAB, an MHT-CET percentile through the Maharashtra CAP rounds, a NEET score through the all-India and state quota counselling. Each process has its own registration, choice filling and document rules.",
        "Our counselling pages for engineering, medical, law and career counselling explain how each process works, and the exam pages for JEE, MHT-CET, COMEDK, WBJEE and others go into the specific rounds. When you want a person to look at your options, you can talk to a counsellor who works on that stream.",
      ],
    },
    {
      heading: "Partner colleges",
      paragraphs: [
        "Our partner colleges are institutes ProCounsel works with directly. Each has a profile listing its programs, location and admission details. Being a partner is not a ranking, so compare them against the other colleges on your list. A counsellor can help you do that and explain how to apply.",
      ],
    },
    {
      heading: "Study abroad",
      paragraphs: [
        "Choosing a country and university depends on your marks, budget, course, English test and intake, not on what is popular this year. The free study abroad university predictor gives you an AI-assisted shortlist of countries and universities from those inputs, and our study abroad counsellors help with university selection, applications and visa guidance.",
        "Treat any shortlist as a research starting point: verify course availability, entry requirements and deadlines on each university's official site before you apply.",
      ],
    },
    {
      heading: "MBA admissions",
      paragraphs: [
        "MBA admission is a sequence: an entrance score such as CAT, a shortlist of colleges whose published cut-offs fit that score, applications, and then written ability tests and interviews. The MBA Admission 2027 guide brings that together, the CAT college predictor shows which colleges your percentile can target, and MBA counselling helps you decide where to apply and prepare for WAT and PI.",
      ],
    },
    {
      heading: "Free predictors, no login",
      paragraphs: [
        "The CAT college predictor, JEE rank and college predictors, MHT-CET college predictor, NEET rank and college predictors and study abroad university predictor are free and show your full results without logging in. Rank and college estimates are based on previous years' cut-offs and marks-versus-rank data, so they are a guide rather than a guarantee. Always confirm with the official counselling authority before you act.",
      ],
    },
  ],
};

/** Shown in the home FAQ and published as its FAQPage schema — one source. */
export const homeFaqs: SeoFaqItem[] = [
  {
    question: "What does ProCounsel help with?",
    answer:
      "ProCounsel offers admission counselling for colleges in India (engineering, medical, law and other streams), study abroad counselling, and MBA admission counselling. We also run free college and rank predictors for CAT, JEE Main, MHT-CET and NEET, and a study abroad university predictor.",
  },
  {
    question: "Are the predictors free, and do I need to log in?",
    answer:
      "All predictors are free and show your full results without logging in. If you would like help, you can leave your number on the results and a counsellor will call you to go through them. Downloading a NEET college list as a PDF needs a free login.",
  },
  {
    question: "How accurate are the rank and college predictors?",
    answer:
      "They are estimates built on previous years' cut-offs and marks-versus-rank data. Your actual rank and allotment depend on this year's candidates, paper difficulty, seat matrix and counselling rounds, so use the results as a guide and verify them with the official counselling authority.",
  },
  {
    question: "What are ProCounsel's partner colleges?",
    answer:
      "Partner colleges are institutes ProCounsel works with directly. Their profiles list programs, location and admission details. Partner status is not a ranking, and a counsellor can help you compare them with the other colleges you are considering.",
  },
  {
    question: "Which exams and streams do you cover for admissions in India?",
    answer:
      "Engineering (JEE Main, JEE Advanced, MHT-CET, COMEDK, WBJEE and others), medical (NEET UG and NEET PG), law (CLAT, AILET and others), MBA (CAT, XAT and others), and career counselling for students choosing a stream after Class 10 or Class 12.",
  },
  {
    question: "Can ProCounsel help me study abroad?",
    answer:
      "Yes. Our study abroad counsellors help with choosing countries and universities, applications and visa guidance. You can start with the free study abroad university predictor, which suggests countries and universities from your marks, budget, course and intake.",
  },
  {
    question: "Do you help with MBA admissions?",
    answer:
      "Yes. MBA counselling covers shortlisting colleges for your CAT or other entrance score, applications, and preparing for written ability tests and interviews. The MBA Admission 2027 guide and the CAT college predictor are free to use.",
  },
  {
    question: "How do I talk to a counsellor?",
    answer:
      "Browse counsellors on ProCounsel and book a session, or leave your number on any counselling or predictor page and a counsellor will call you back.",
  },
];
