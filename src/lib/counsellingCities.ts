/**
 * Data + content generator for the programmatic city counselling landing pages
 * (`/counselling/:city`). Each city gets genuinely differentiated, locally
 * relevant copy (state entrance exam, notable institutes, region) so the pages
 * are useful and unique rather than thin doorway pages.
 *
 * IMPORTANT: keep this in sync with the sitemap. `COUNSELLING_CITY_SLUGS` is
 * imported by scripts/site-routes.mjs so every city is crawled + prerendered.
 */

export interface CounsellingCity {
  slug: string;
  city: string;
  /** State the city belongs to (matches counsellor `states`/`city` values). */
  state: string;
  /** Broad region, used for varied phrasing. */
  region: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  /** State-level entrance exam most relevant to this city (for local depth). */
  stateExam?: string;
  /** A couple of well-known institutes near the city (local relevance). */
  institutes: string[];
  /** Alternate spellings / nearby areas people search for. */
  aliases?: string[];
}

export const COUNSELLING_CITIES: CounsellingCity[] = [
  { slug: "delhi", city: "Delhi", state: "Delhi", region: "North", stateExam: "CUET", institutes: ["Delhi University", "IIT Delhi", "AIIMS Delhi"], aliases: ["New Delhi", "NCR"] },
  { slug: "mumbai", city: "Mumbai", state: "Maharashtra", region: "West", stateExam: "MHT-CET", institutes: ["IIT Bombay", "Grant Medical College", "VJTI"], aliases: ["Navi Mumbai", "Thane"] },
  { slug: "bangalore", city: "Bangalore", state: "Karnataka", region: "South", stateExam: "KCET", institutes: ["IISc Bangalore", "Bangalore Medical College", "RV College of Engineering"], aliases: ["Bengaluru"] },
  { slug: "pune", city: "Pune", state: "Maharashtra", region: "West", stateExam: "MHT-CET", institutes: ["COEP Pune", "BJ Medical College", "Symbiosis"], aliases: ["Pimpri-Chinchwad"] },
  { slug: "hyderabad", city: "Hyderabad", state: "Telangana", region: "South", stateExam: "TS EAMCET", institutes: ["IIT Hyderabad", "Osmania Medical College", "JNTU Hyderabad"], aliases: ["Secunderabad"] },
  { slug: "chennai", city: "Chennai", state: "Tamil Nadu", region: "South", stateExam: "TNEA", institutes: ["IIT Madras", "Madras Medical College", "Anna University"] },
  { slug: "kolkata", city: "Kolkata", state: "West Bengal", region: "East", stateExam: "WBJEE", institutes: ["Jadavpur University", "Medical College Kolkata", "IIEST Shibpur"] },
  { slug: "ahmedabad", city: "Ahmedabad", state: "Gujarat", region: "West", stateExam: "GUJCET", institutes: ["IIM Ahmedabad", "BJ Medical College Ahmedabad", "L.D. College of Engineering"] },
  { slug: "jaipur", city: "Jaipur", state: "Rajasthan", region: "North", stateExam: "REAP", institutes: ["MNIT Jaipur", "SMS Medical College", "University of Rajasthan"] },
  { slug: "lucknow", city: "Lucknow", state: "Uttar Pradesh", region: "North", stateExam: "UPCET", institutes: ["King George's Medical University", "IIM Lucknow", "AKTU"] },
  { slug: "kanpur", city: "Kanpur", state: "Uttar Pradesh", region: "North", stateExam: "UPCET", institutes: ["IIT Kanpur", "GSVM Medical College", "HBTU"] },
  { slug: "nagpur", city: "Nagpur", state: "Maharashtra", region: "Central", stateExam: "MHT-CET", institutes: ["VNIT Nagpur", "GMC Nagpur", "AIIMS Nagpur"] },
  { slug: "indore", city: "Indore", state: "Madhya Pradesh", region: "Central", stateExam: "MP DTE", institutes: ["IIT Indore", "IIM Indore", "MGM Medical College"] },
  { slug: "bhopal", city: "Bhopal", state: "Madhya Pradesh", region: "Central", stateExam: "MP DTE", institutes: ["MANIT Bhopal", "AIIMS Bhopal", "Gandhi Medical College"] },
  { slug: "patna", city: "Patna", state: "Bihar", region: "East", stateExam: "BCECE", institutes: ["IIT Patna", "AIIMS Patna", "Patna Medical College"] },
  { slug: "chandigarh", city: "Chandigarh", state: "Chandigarh", region: "North", stateExam: "PU CET", institutes: ["PGIMER", "Panjab University", "PEC Chandigarh"], aliases: ["Mohali", "Panchkula"] },
  { slug: "surat", city: "Surat", state: "Gujarat", region: "West", stateExam: "GUJCET", institutes: ["SVNIT Surat", "GMC Surat", "VNSGU"] },
  { slug: "vadodara", city: "Vadodara", state: "Gujarat", region: "West", stateExam: "GUJCET", institutes: ["MS University Baroda", "Medical College Baroda"], aliases: ["Baroda"] },
  { slug: "coimbatore", city: "Coimbatore", state: "Tamil Nadu", region: "South", stateExam: "TNEA", institutes: ["PSG College of Technology", "Coimbatore Medical College", "Amrita University"] },
  { slug: "kochi", city: "Kochi", state: "Kerala", region: "South", stateExam: "KEAM", institutes: ["CUSAT", "Government Medical College Ernakulam", "Amrita Kochi"], aliases: ["Ernakulam", "Cochin"] },
  { slug: "thiruvananthapuram", city: "Thiruvananthapuram", state: "Kerala", region: "South", stateExam: "KEAM", institutes: ["College of Engineering Trivandrum", "Government Medical College Trivandrum"], aliases: ["Trivandrum"] },
  { slug: "visakhapatnam", city: "Visakhapatnam", state: "Andhra Pradesh", region: "South", stateExam: "AP EAPCET", institutes: ["Andhra University", "Andhra Medical College", "GITAM"], aliases: ["Vizag"] },
  { slug: "bhubaneswar", city: "Bhubaneswar", state: "Odisha", region: "East", stateExam: "OJEE", institutes: ["IIT Bhubaneswar", "AIIMS Bhubaneswar", "KIIT"] },
  { slug: "guwahati", city: "Guwahati", state: "Assam", region: "Northeast", stateExam: "Assam CEE", institutes: ["IIT Guwahati", "Gauhati Medical College", "AEC Guwahati"] },
  { slug: "dehradun", city: "Dehradun", state: "Uttarakhand", region: "North", stateExam: "UKSEE", institutes: ["Doon University", "GEU", "UPES Dehradun"] },
  { slug: "ranchi", city: "Ranchi", state: "Jharkhand", region: "East", stateExam: "JCECE", institutes: ["BIT Mesra", "RIMS Ranchi"] },
  { slug: "raipur", city: "Raipur", state: "Chhattisgarh", region: "Central", stateExam: "CG PET", institutes: ["NIT Raipur", "AIIMS Raipur", "Pt. JNM Medical College"] },
  { slug: "ludhiana", city: "Ludhiana", state: "Punjab", region: "North", stateExam: "PU CET", institutes: ["DMC Ludhiana", "PAU Ludhiana"], aliases: ["Amritsar", "Jalandhar"] },
];

export const COUNSELLING_CITY_SLUGS = COUNSELLING_CITIES.map((c) => c.slug);

export function getCityBySlug(slug?: string): CounsellingCity | undefined {
  if (!slug) return undefined;
  const s = slug.trim().toLowerCase();
  return COUNSELLING_CITIES.find((c) => c.slug === s);
}

/* ------------------------------------------------------------------ */
/*  Deterministic per-city content (varied so pages aren't identical)   */
/* ------------------------------------------------------------------ */

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

export interface CityContent {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
}

export function buildCityContent(c: CounsellingCity): CityContent {
  const { city, state, stateExam } = c;
  const examLine = stateExam
    ? `Alongside national exams like JEE Main, NEET and CUET, students here also navigate ${stateExam} for state-quota seats`
    : `Students here navigate national entrance exams like JEE Main, NEET and CUET`;
  const instituteLine =
    c.institutes.length > 0
      ? `${city} and nearby areas are home to reputed institutions such as ${listToText(c.institutes)}, which makes the competition for good seats intense`
      : `Competition for good college seats in and around ${city} is intense`;

  // Two rotating intro/section variants keyed off the slug so no two pages read identically.
  const variant = hashSlug(c.slug) % 2;

  const intro =
    variant === 0
      ? `Choosing the right college and career path in ${city} shouldn't come down to guesswork or well-meaning but generic advice. ProCounsel connects students and parents in ${city}, ${state} with experienced, verified education counsellors who give personalised college admission counselling — from shortlisting colleges and understanding cut-offs to entrance-exam strategy, form filling, document verification and counselling rounds. ${examLine}, and the right guidance makes all the difference.`
      : `Every year, thousands of students across ${city} and ${state} face the same overwhelming question — which college, which course, and how to actually get in. ProCounsel gives you honest, one-on-one college admission counselling in ${city} from verified counsellors who know how admissions really work. ${instituteLine}, so having someone map a clear, realistic plan for you is invaluable.`;

  const sections: CityContent["sections"] = [
    {
      heading: `College Admission Counselling in ${city}`,
      paragraphs: [
        `Our counsellors help students in ${city} build a college shortlist that fits their marks, budget and goals — not a copy-pasted ranking list. Whether you're targeting engineering, medical (MBBS/BDS), management, law, design or studying abroad, you get a plan grounded in real cut-off data and this year's admission timeline.`,
        `${examLine}. A ProCounsel counsellor walks you through eligibility, choice-filling order, quotas and seat matrices step by step, so you don't lose a deserved seat to a filling mistake.`,
      ],
    },
    {
      heading: `Career Counselling & Guidance in ${city}`,
      paragraphs: [
        `Good career counselling in ${city} starts with a conversation, not a recommendation. Our certified career counsellors help students understand their strengths, interests and options after 10th and 12th — stream selection, course choice, and long-term career direction — so the decision genuinely fits the student.`,
        `Because ProCounsel works online, students anywhere in ${state} can connect with the best counsellors regardless of distance, on a schedule that works around school and coaching.`,
      ],
    },
    {
      heading: `Talk to Seniors From ${city}'s Top Colleges`,
      paragraphs: [
        `Beyond professional counselling, ProCounsel's ProBuddies let you talk to verified current students and recent seniors — including from colleges near ${city} such as ${listToText(c.institutes)}. They share the honest, unfiltered reality of a branch, hostel life, placements and campus culture that no brochure will tell you.`,
        `Pairing a counsellor's big-picture plan with a senior's ground reality is the fastest way to make a confident college decision.`,
      ],
    },
    {
      heading: `Study Abroad Counselling in ${city}`,
      paragraphs: [
        `Planning to study abroad from ${city}? Our study abroad counsellors help you choose the right country and university, plan for standardised tests, budget realistically, and understand scholarships and visa processes — starting from your goals rather than a fixed destination list.`,
        `From application essays to shortlisting, you get structured guidance so families in ${city} can make an informed, confident decision about an education overseas.`,
      ],
    },
  ];

  const faqs: CityContent["faqs"] = [
    {
      question: `How can I get college admission counselling in ${city}?`,
      answer: `On ProCounsel you can browse verified education counsellors serving ${city} and ${state}, view their experience, specialisation and fees, and book a one-on-one online session. They guide you through college shortlisting, cut-offs, entrance-exam strategy and the full counselling process.`,
    },
    {
      question: `Is career counselling in ${city} available online?`,
      answer: `Yes. All ProCounsel counselling is available online, so students in ${city} can connect with experienced counsellors and seniors from anywhere, using the same one-on-one sessions and assessments as an in-person meeting — with far more flexibility.`,
    },
    {
      question: `Which entrance exams do counsellors in ${city} help with?`,
      answer: stateExam
        ? `Counsellors help with national exams like JEE Main, NEET and CUET as well as the ${stateExam} state entrance exam relevant to ${state} — including eligibility, choice filling, quotas and counselling rounds.`
        : `Counsellors help with national entrance exams like JEE Main, NEET and CUET, as well as relevant state-level entrance exams — covering eligibility, choice filling and counselling rounds.`,
    },
    {
      question: `Can I talk to students from colleges in ${city}?`,
      answer: `Yes — through ProCounsel's ProBuddies you can connect with verified current students and recent seniors from colleges in and around ${city}, and ask them honestly about branches, placements, hostels and campus life before you decide.`,
    },
    {
      question: `How much does counselling in ${city} cost?`,
      answer: `Fees vary by counsellor and the depth of guidance you need. Each counsellor's rates are listed transparently on their ProCounsel profile, and many offer an initial session so you can decide before committing.`,
    },
  ];

  return {
    metaTitle: `College Admission Counselling in ${city} – Career & Study Abroad Guidance`,
    metaDescription: `Get expert college admission & career counselling in ${city}, ${state}. Connect with verified counsellors and college seniors for JEE, NEET${stateExam ? `, ${stateExam}` : ""}, CUET, study abroad and course selection — online, one-on-one.`,
    keywords: [
      `college admission counselling in ${city}`,
      `career counselling in ${city}`,
      `career counsellor in ${city}`,
      `education consultant in ${city}`,
      `study abroad consultant in ${city}`,
      `${city} college admission guidance`,
      `best counsellor in ${city}`,
      stateExam ? `${stateExam} counselling ${city}` : "",
    ]
      .filter(Boolean)
      .join(", "),
    h1: `College Admission Counselling in ${city}`,
    intro,
    sections,
    faqs,
  };
}

function listToText(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
