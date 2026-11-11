import type { SeoSection, SeoFaqItem } from "@/components/SEO/SeoArticle";
import { COUNSELLING_EXAMS } from "@/lib/counsellingExams";

/**
 * Data + copy for the category counselling landing pages
 * (`/engineering-counselling`, `/mba-counselling`, ...).
 *
 * These are the site's commercial-intent pages: someone searching "MBA
 * counselling" wants to talk to a counsellor, not read a blog. Each page
 * therefore serves ONE primary search intent and covers its related keywords
 * inside that single page — deliberately not one thin page per keyword, which
 * is what got the site flagged for thin content in the first place.
 *
 * URL choice: top-level `/mba-counselling`, not `/counselling/mba`.
 * `/counselling/:city` already owns that namespace, exact-match keyword URLs
 * are what the category leaders (Shiksha, CollegeDunia) use, and it leaves
 * `/mba-counselling/pune` free for the city expansion once demand is validated.
 *
 * `expertise` is the contract with the counsellor listing: the values must
 * match the counsellor records' `expertise` array exactly, because the "Get
 * counselling" CTA deep-links to /counsellor-listing with that filter applied.
 *
 * Copy in `sections`/`faqs` is the SEO team's final content for all five
 * categories. Keep it specific and honest — no invented fees, cut-offs,
 * rankings or success-rate claims. Inaccurate content is punished harder
 * than thin content.
 */

export interface CategoryExam {
  /** Short name people search for, e.g. "CAT". */
  name: string;
  /** Expanded name, used once for clarity. */
  full: string;
}

export interface CounsellingCategory {
  slug: string;
  /** Display name and the head keyword, e.g. "MBA Counselling". */
  name: string;
  /** The single search intent this page serves. One page, one intent. */
  primaryIntent: string;
  /**
   * Counsellor `expertise` values this category maps to. Drives the listing
   * filter — must match the values in the counsellor records.
   */
  expertise: string[];
  /** Commercial support keywords, covered naturally in the body copy. */
  supportKeywords: string[];
  /** Entrance exams covered as sections on this page, not as separate pages. */
  exams: CategoryExam[];
  /** Lead magnet offered alongside the primary CTA. */
  leadOffer: string;
  /** Existing tools on the site that serve this intent. */
  tools: { label: string; to: string }[];
  /** City slugs for the later `/x-counselling/:city` expansion. */
  cities: string[];
  /** Whether this category is validated enough to push hard. */
  priority: "core" | "growth";

  /* ---- SEO copy (SEO team owns everything below) ---- */
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
}

export const COUNSELLING_CATEGORIES: CounsellingCategory[] = [
  {
    slug: "engineering-counselling",
    name: "Engineering Counselling",
    primaryIntent:
      "Find and talk to an engineering admission counsellor about branch, college choice and choice filling",
    expertise: ["Engineering", "Diploma in Engineering", "Polytechnic"],
    supportKeywords: [
      "engineering admission counselling",
      "engineering career counselling",
      "counselling for b tech colleges",
      "career counselling for engineering students",
      "counselling for admission in engineering colleges",
    ],
    exams: [
      { name: "JEE Main", full: "Joint Entrance Examination (Main)" },
      { name: "JEE Advanced", full: "Joint Entrance Examination (Advanced)" },
      { name: "MHT-CET", full: "Maharashtra Common Entrance Test" },
      { name: "KCET", full: "Karnataka Common Entrance Test" },
      { name: "AP EAPCET", full: "Andhra Pradesh Engineering, Agriculture and Pharmacy Common Entrance Test" },
      { name: "CUET", full: "Common University Entrance Test" },
    ],
    leadOffer: "Free branch-and-college shortlist based on your rank",
    tools: [
      { label: "JEE Rank Predictor", to: "/jee-rank-predictor" },
      { label: "JEE College Predictor", to: "/jee-college-predictor" },
      { label: "MHT-CET College Predictor", to: "/mhtcet-college-predictor" },
      { label: "MHT-CET Option Form Filling", to: "/mhtcet-option-form-filling" },
    ],
    cities: ["pune", "mumbai", "delhi", "bangalore", "hyderabad"],
    priority: "core",
    title: "Engineering Counselling & Admission Guidance | ProCounsel",
    description:
      "Get expert engineering counselling and admission guidance to choose the right BTech college, course and branch based on your rank, preferences and career goals.",
    h1: "Engineering Counselling & Admission Guidance",
    intro:
      "You finally got your entrance exam rank. For a few minutes, it feels like the stressful part is over. Then someone asks, “So, which college are you taking?” And suddenly, the confusion starts again. You have a rank, but now you have to figure out what to do with it.",
    sections: [
      {
        heading: "A rank is only the first step",
        paragraphs: [
          "Which colleges can you realistically get? Which branch should you choose? Should you put CSE above everything else? What if you get a better college but a branch you weren't planning to take? How many choices should you fill? Should you wait for another counselling round?",
          "And somewhere in the middle of all this, you may still be thinking: “What should I actually choose?”",
          "This is where engineering admission decisions can become difficult. Getting a rank is one thing. Turning that rank into a sensible college and branch choice is another.",
          "ProCounsel helps students and parents make these decisions with personalised engineering counselling, college exploration, admission guidance and career-related support. The aim isn't to tell every student, “Take this college.” It's to understand your situation first, then help you look at your options more clearly.",
        ],
      },
      {
        heading: "Education, admission & career counselling",
        paragraphs: [
          "Engineering admission isn't really one decision. There are at least three decisions sitting together: What should I study? Where should I study? What do I want to do after that?",
          "Students sometimes look at only one of these. They may choose a college because it has a strong reputation without checking whether the branch suits them. Or they may choose CSE simply because everyone around them is choosing it, without thinking about whether they actually enjoy the subjects involved. Neither approach is necessarily wrong for every student. But neither should be automatic.",
          "Your entrance rank matters. Your interests matter. Your preferred branch matters. Fees matter. Location matters. Your career plans matter. Sometimes the most useful counselling conversation starts with a very simple question: “What are you actually looking for from your engineering degree?” The answer can change the entire college search.",
        ],
      },
      {
        heading: "Education counselling services",
        paragraphs: [
          "For an engineering aspirant, education counselling is not about telling you that engineering is automatically the right choice. It starts with understanding whether the field, course and possible pathways make sense for you.",
          "Maybe you have always wanted to become an engineer. Maybe your parents suggested engineering because you are good at Maths and Physics. Maybe you are interested in technology but aren't sure which BTech program fits. Or maybe you are preparing for engineering entrance exams simply because you didn't know what else to do. These are very different situations.",
          "There is also no rule saying that every good engineering student has to choose the same branch. CSE may be right for one student. ECE may make more sense for another. Someone else may genuinely enjoy Mechanical, Civil, Electrical or Chemical. The point isn't to find the “most popular” option. It's to find an option that makes sense for you.",
        ],
        bullets: [
          "Your academic performance and entrance exam rank",
          "Subjects you enjoy and your strengths",
          "Career interests and preferred engineering branches",
          "Budget, preferred location and college expectations",
          "Plans for higher studies",
          "Alternative options if engineering turns out not to be the right fit",
        ],
      },
      {
        heading: "Admission counselling services",
        paragraphs: [
          "This is usually where things get serious. You have your rank. You have a list of colleges. You have heard what your friends are doing. Now comes the choice filling — and this is where many students start second-guessing themselves.",
          "“Should I put this college first?” “What if I don't get my first choice?” “Should I keep more backup options?” “If I get a lower branch in a better college, should I take it?” “What happens if I don't get anything in the first round?”",
          "One important thing to understand is that a predictor is a starting point, not a final answer. ProCounsel's MHT-CET predictor states that its predictions are based on previous counselling data and that actual allotment depends on factors such as current cut-offs, seat availability and the choices made by other candidates.",
          "That's an important distinction. No honest counsellor can promise, “You will definitely get this college.” What they can do is help you build a more sensible list of possibilities.",
        ],
        bullets: [
          "Understanding eligibility and realistic college options",
          "Application timelines and counselling rounds",
          "Seat allotment, preference order and upgrades",
          "Documents, deadlines and possible backup choices",
        ],
      },
      {
        heading: "Career counselling services",
        paragraphs: [
          "Getting into an engineering college is not the end of the decision. Then comes another question: which branch?",
          "This is where students often hear the same advice from everyone. “Take CSE.” “CSE has the most scope.” “Don't take Mechanical.” There may be some truth behind individual opinions, but none of these statements should automatically decide your future.",
          "So the better question isn't “Which branch is the best?” Try asking: “Which branch makes the most sense for me?” If you enjoy coding and problem-solving, computer-related programs may naturally interest you. If you're fascinated by circuits and communication systems, ECE could be worth exploring. If machines, manufacturing and design genuinely interest you, Mechanical deserves a proper look.",
          "The idea is not to predict exactly what job you will have at 25. Nobody can honestly do that. Instead, career counselling for engineering students can help you understand what different branches involve, what skills they typically require and what career directions are possible.",
        ],
        bullets: [
          "Computer Science Engineering and Information Technology",
          "Electronics & Communication Engineering and Electrical Engineering",
          "Mechanical, Civil and Chemical Engineering",
          "Aerospace Engineering and Biotechnology",
          "Artificial Intelligence, Machine Learning and Data Science",
        ],
      },
      {
        heading: "College & university selection",
        paragraphs: [
          "A famous college is not automatically the right college for every student. College reputation matters, but it isn't the only thing that matters.",
          "Suppose you have two options. College A has a stronger name, but the branch you would get there is not something you are interested in. College B may be less famous, but it offers the branch you genuinely want, fits your budget and is in a location that works for your family. Which one should you choose? There isn't a universal answer.",
          "And don't look at placement numbers without context. Ask what the placement situation looks like for your branch, not just the college as a whole. A college can have an impressive placement figure and still not be the best fit for your particular goals.",
        ],
        bullets: [
          "Accreditation, recognition and course curriculum",
          "Faculty and infrastructure",
          "Placement information for your branch specifically",
          "Internship opportunities and industry exposure",
          "Fees, location and campus environment",
          "Alumni network and opportunities for higher studies",
        ],
      },
      {
        heading: "Course selection guidance",
        paragraphs: [
          "Let's talk about CSE for a minute. A lot of students choose it because everyone around them is choosing it. You ask a friend what branch they're taking. “CSE.” Another friend? “CSE.” A relative? “Beta, CSE le lo.” After hearing it enough times, it can start feeling like there is no other sensible choice.",
          "But pause for a second. Do you actually enjoy the things you'll be studying? Do you like programming? Do you enjoy mathematics and logical problem-solving? Or are you choosing CSE mainly because you are afraid that another branch won't have enough opportunities?",
          "The point isn't to convince you to choose a less popular branch. It's to make sure popularity isn't making the decision for you. A sensible approach to BTech course selection usually balances four things: interest, ability, career direction and opportunity. You don't need to have everything figured out — but you should at least understand what you're choosing and why.",
        ],
      },
      {
        heading: "A personalised counselling process",
        paragraphs: [
          "There isn't one fixed formula that works for every engineering aspirant. A student with a very specific branch preference needs different guidance from a student who says, “I just want a good college.”",
          "Finally, the decision belongs to you and your family. Good counselling doesn't remove your responsibility. It removes some of the unnecessary confusion around it.",
        ],
        bullets: [
          "Understand the student — Class 12 background, entrance exam, rank, subjects, interests and current worries",
          "Understand the goal — a particular branch, college, city, fee range or career direction",
          "Explore college and branch options using predictors, college information and previous cut-off trends",
          "Compare options — college versus branch, fees versus location, dream versus realistic choices",
          "Plan preferences — don't fill randomly, don't copy a friend's list",
          "Make an informed decision",
        ],
      },
      {
        heading: "Why choose ProCounsel",
        paragraphs: [
          "Choosing a counsellor for something as important as engineering admission is a serious decision. You should be able to ask questions without feeling that someone is simply trying to push you towards a particular college.",
          "ProCounsel's platform focuses on personalised admission guidance, college exploration and practical tools that students can use while planning their choices — JEE rank and college predictors, MHT-CET college prediction, MHT-CET option-form support, college profiles, admission deadlines, college shortlisting and ProBuddies who connect students with college seniors.",
          "ProCounsel has guided 10,000+ students, has 15+ years of experience, and is trusted by 50,000+ families, with 300+ ProBuddies and 850+ mentee connections. Those numbers are useful context, but they shouldn't be the reason you choose a counselling platform. The more important question is whether the guidance actually helps you understand your options.",
          "Engineering admission doesn't stop when you get a seat. You still have a degree to complete, skills to build, internships to find and career choices to make. The college decision is important, but it is still one part of a much longer journey.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is engineering counselling?",
        answer:
          "Engineering counselling is guidance that helps students understand their engineering college, branch and admission options based on factors such as rank, interests, preferences, budget and career goals.",
      },
      {
        question: "What does engineering admission counselling include?",
        answer:
          "It can include understanding your entrance rank, exploring realistic colleges, comparing branches, checking admission requirements and timelines, planning preferences, understanding counselling rounds and thinking through backup options.",
      },
      {
        question: "When should I take engineering counselling?",
        answer:
          "Ideally, before you start finalising your college and branch choices. Counselling can also be useful after receiving your rank, when you have actual options to compare.",
      },
      {
        question: "Can counselling help me choose the right BTech college?",
        answer:
          "Yes. Good counselling can help you compare colleges using factors such as branch, fees, location, curriculum, placements, internships and your own career plans. It cannot guarantee a particular college.",
      },
      {
        question: "How do I choose between college and branch?",
        answer:
          "Start by asking what matters more to you and why. If you're considering a better-known college with a branch you don't want, compare the actual course, career possibilities and your willingness to study that branch before deciding.",
      },
      {
        question: "Is CSE always the best engineering branch?",
        answer:
          "No. CSE can be an excellent choice for students interested in computing and related fields, but it isn't automatically the right branch for everyone. Your interests, strengths and career direction should also be considered.",
      },
      {
        question: "Can engineering career counselling help me choose a branch?",
        answer:
          "Yes. Engineering career counselling can help you understand what different branches involve, the skills they develop, possible career directions and higher-study options. The final choice should still reflect your own interests and goals.",
      },
      {
        question: "What is counselling for BTech colleges?",
        answer:
          "Counselling for BTech colleges means getting guidance while comparing and shortlisting engineering colleges and programs. It may include looking at your rank, branch preference, college options, admission process and choice-filling strategy.",
      },
      {
        question: "Can ProCounsel help with engineering college choice filling?",
        answer:
          "ProCounsel provides choice-filling support, including MHT-CET option-form assistance, along with college predictors and admission guidance.",
      },
      {
        question: "How can I get counselling for admission in engineering colleges?",
        answer:
          "You can explore the admission counselling and engineering-related tools available on the ProCounsel website and connect with its counsellors for guidance relevant to your admission situation.",
      },
    ],
  },

  {
    slug: "medical-counselling",
    name: "Medical Counselling",
    primaryIntent:
      "Find and talk to a medical admission counsellor about NEET rank, MBBS college choice and choice filling",
    expertise: ["Medical", "Dental", "Nursing", "Pharmacy", "Veterinary Sciences"],
    supportKeywords: [
      "mbbs admission counselling",
      "neet counselling",
      "mbbs counselling",
      "medical admission counselling",
      "counselor for mbbs admission",
    ],
    exams: [
      { name: "NEET UG", full: "National Eligibility cum Entrance Test (Undergraduate)" },
      { name: "NEET PG", full: "National Eligibility cum Entrance Test (Postgraduate)" },
      { name: "INI CET", full: "Institute of National Importance Combined Entrance Test" },
    ],
    leadOffer: "Free NEET college shortlist for your score and category",
    tools: [
      { label: "NEET Rank Predictor", to: "/neet-rank-predictor" },
      { label: "NEET College Predictor", to: "/neet-college-predictor" },
      { label: "NEET Cutoffs (Round-wise)", to: "/neet-cutoffs" },
      { label: "State NEET Counselling", to: "/neet-counselling" },
      { label: "MBBS Colleges in India", to: "/mbbs-colleges" },
    ],
    cities: ["delhi", "mumbai", "bangalore", "pune", "lucknow"],
    priority: "core",
    title: "Medical Counselling & MBBS Admission Guidance | ProCounsel",
    description:
      "Get expert medical counselling and admission guidance for MBBS and other medical courses. Get help with NEET counselling, college selection, choice filling and admission.",
    h1: "Medical Counselling & MBBS Admission Guidance",
    intro:
      "You've spent months preparing for NEET. Classes. Mock tests. Revision. More revision. And probably quite a few days when you wondered whether your preparation was actually enough. Then the exam is over, the result comes out, and you finally know your score and rank. You might think, “Okay, now at least I know what happens next.” But that's often when a different kind of confusion starts.",
    sections: [
      {
        heading: "Where the real confusion begins",
        paragraphs: [
          "Which MBBS colleges can you get? Should you consider government colleges, private colleges or both? Which counselling should you register for? How should you arrange your choices? What if you don't get your first preference? Should you wait for another round?",
          "And if the score isn't what you hoped for, there's another question: “What are my options now?”",
          "These are not small decisions. For students and parents, choosing a medical college involves years of study, a significant financial commitment and a lot of expectations. Getting a NEET score is an achievement. Knowing how to use that score wisely is the next challenge.",
          "ProCounsel provides education and admission guidance to help students understand their medical college options, explore NEET-related resources and approach important admission decisions with more clarity. The idea isn't to tell every student the same thing. It's to first understand where you stand, what you want and what choices are realistically available.",
        ],
      },
      {
        heading: "Education, Admission & Career Counselling",
        paragraphs: [
          "Choosing medicine isn't just about getting an MBBS seat. There are three questions sitting behind the decision: What should I study? Where should I study? What kind of career do I want to build?",
          "It is easy to focus only on the first one. A student spends years preparing for NEET because they want to become a doctor. Once the result comes out, the entire focus shifts to getting a seat. College name, fees, location, hospital exposure and the actual learning environment can sometimes become secondary.",
          "But those things matter too. Imagine getting an MBBS seat in a college that is financially difficult for your family. Or choosing a college simply because someone recommended it without checking the course, facilities or clinical exposure properly. The admission decision deserves a little more thought than that.",
          "That doesn't mean planning your entire life at 18. It simply means asking better questions before making a very big decision.",
        ],
      },
      {
        heading: "Education counselling services",
        paragraphs: [
          "Medical education can look like one straightforward path from the outside. NEET → MBBS → doctor. But students soon discover that there are many details in between: different types of institutions, different admission routes, different costs and different education pathways.",
          "That is why medical counselling should begin with the student's situation rather than a standard recommendation. Your NEET score and rank matter, of course. But so do your preferences. Maybe you are only interested in MBBS. Maybe you're open to other healthcare courses. Maybe you have a strict budget. Maybe studying in your home state is important to your family.",
          "The purpose isn't to convince a student to choose medicine. It's to help them understand what choosing medicine actually means. And if MBBS doesn't work out, counselling shouldn't stop there.",
        ],
        bullets: [
          "Medical education pathways, and what each one actually involves",
          "MBBS and other healthcare courses",
          "Eligibility requirements and NEET-related admission routes",
          "Different types of medical colleges",
          "College and course options for your rank and category",
          "Higher education possibilities and alternative healthcare pathways",
        ],
      },
      {
        heading: "Admission counselling services",
        paragraphs: [
          "This is usually the stage where parents start asking a lot of questions. “Which college can we get?” “Should we register for this counselling?” “How many choices should we fill?” “If we don't get the first choice, what happens?”",
          "Honestly, the NEET admission process can be confusing when you're looking at it for the first time. There are registrations, eligibility requirements, counselling rounds, choice filling, seat allotment, reporting and, depending on the counselling route, further rounds or opportunities to upgrade. The exact process and rules can vary, so students should always check the current official counselling instructions for the relevant authority before making a final decision.",
          "A predictor can help you explore possibilities. It shouldn't replace careful counselling or official admission rules. That distinction is important — medical admission counselling is not about promising a seat. It is about helping students understand their choices before they submit them.",
        ],
        bullets: [
          "What colleges are realistic for this rank",
          "Which options fit the student's preferences and budget",
          "Which choices should be considered carefully, and what to keep as a backup",
          "How preferences should be arranged",
          "What happens after seat allotment, and which documents and deadlines need attention",
          "Whether it is worth considering another counselling round",
        ],
      },
      {
        heading: "Career counselling services",
        paragraphs: [
          "There is another conversation that often gets forgotten during NEET counselling: “Do I actually want to become a doctor?”",
          "For some students the answer is an immediate yes. For others it is more complicated. Maybe you've always liked Biology but aren't sure what life as a doctor actually looks like. Maybe you like healthcare but aren't certain that MBBS is the only path. Maybe your family has always expected you to become a doctor, and you've never really stopped to think about what you want.",
          "MBBS counselling should not be limited to getting a seat. It can also include understanding what comes after the degree and whether the path fits the student's expectations. The aim isn't to predict your salary or guarantee a particular career. It is to help you understand the road before you start walking down it.",
        ],
        bullets: [
          "MBBS and clinical practice",
          "Postgraduate medical education and clinical specialisations",
          "Medical research and public health",
          "Healthcare management and academic roles",
          "Medical technology and other healthcare professions",
        ],
      },
      {
        heading: "College & university selection",
        paragraphs: [
          "Let's say you have a few MBBS college options. The natural reaction is to ask, “Which one is more famous?” But that's not always the most useful question. A better question is: “Which one makes sense for me and my family?”",
          "Clinical exposure deserves particular attention in medical education. A student isn't only choosing classrooms. They are also choosing the environment in which they will gradually learn how medicine works in real situations.",
          "Fees matter too. A college may look attractive on paper, but if the financial commitment creates significant pressure for the family, that needs to be part of the discussion. The same applies to location — some students are comfortable moving across the country, others may prefer staying closer to home. Neither choice is automatically better.",
        ],
        bullets: [
          "Recognition and accreditation",
          "Academic environment and faculty",
          "Hospital facilities, clinical exposure and patient exposure",
          "Infrastructure, hostel facilities and campus environment",
          "Fees and the total financial commitment",
          "Location, internship opportunities and options for further study",
        ],
      },
      {
        heading: "Course selection guidance",
        paragraphs: [
          "What happens if MBBS doesn't work out? This is a question many students are afraid to ask. But asking it doesn't mean you've given up. It means you're thinking ahead.",
          "Students interested in healthcare may explore different educational pathways depending on their eligibility, interests and admission options. These courses are not interchangeable — they have different eligibility requirements, course structures, responsibilities and career directions.",
          "So the decision shouldn't be “I didn't get MBBS, so I'll take anything related to healthcare.” Instead, ask: what kind of healthcare work actually interests me? And if MBBS is still your first choice, that's completely fine too. The point of counselling is not to push you towards an alternative. It is to make sure you know what those alternatives actually mean before deciding.",
        ],
        bullets: [
          "MBBS",
          "BDS",
          "AYUSH-related courses",
          "Nursing",
          "Physiotherapy",
          "Pharmacy",
          "Allied health sciences",
        ],
      },
      {
        heading: "A personalised counselling process",
        paragraphs: [
          "There is no single formula for every NEET student. Someone with a very high rank and a very specific college preference will need a different conversation from a student who is unsure about both college and course. Still, the process can begin quite simply.",
          "At the end, the decision belongs to the student and family. Counselling isn't about taking that responsibility away. It's about making sure the decision isn't being made in panic, under family pressure or because of something someone said in a WhatsApp group.",
        ],
        bullets: [
          "Understand the student — NEET score or rank, academic background, preferred course, location, budget and family considerations",
          "Understand the options — realistic MBBS colleges and other relevant medical education routes",
          "Shortlist colleges — narrow a huge list down to the ones genuinely worth considering",
          "Compare choices — fees, location, academic environment, clinical exposure, facilities and internships",
          "Plan counselling preferences — think about what you would genuinely be comfortable accepting",
          "Make an informed decision, without panic or guesswork",
        ],
      },
      {
        heading: "Why choose ProCounsel",
        paragraphs: [
          "Medical admission is too important to approach with random advice. Your friend may have a different rank. Your cousin may have gone through a different counselling process. A YouTube video may be talking about last year's cut-offs. And a college list found online may not take your category, quota, state or personal preferences into account.",
          "ProCounsel brings admission resources and counselling support together so students can spend less time jumping between different sources and more time understanding their actual options. The platform includes a NEET Rank Predictor, NEET College Predictor, NEET cut-off resources, NEET counselling information, MBBS college information and access to admission counsellors, along with ProBuddies who connect students with college seniors.",
          "ProCounsel has guided 10,000+ students, has 15+ years of experience, and is trusted by 50,000+ families. Those numbers may give you some context, but they shouldn't be the only reason you choose a counsellor. What matters more is whether you get guidance that is relevant to your situation.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is medical counselling?",
        answer:
          "Medical counselling is guidance that helps students understand medical education and admission options based on their NEET performance, preferences, eligibility, budget and future plans.",
      },
      {
        question: "What is MBBS admission counselling?",
        answer:
          "MBBS admission counselling helps students understand the admission journey after NEET, including college options, eligibility, counselling rounds, choice filling, seat allotment, reporting and possible backup choices.",
      },
      {
        question: "How does NEET counselling work?",
        answer:
          "NEET counselling generally involves registration, verification or eligibility checks, choice filling, seat allotment and reporting, depending on the applicable counselling authority and admission route. The exact rules and schedule can change, so students should always check the current official information.",
      },
      {
        question: "When should I take NEET counselling?",
        answer:
          "It can be useful as soon as you have your NEET result, or when you start preparing for the counselling process. Getting guidance before filling choices can help you understand your options more carefully.",
      },
      {
        question: "Can counselling help me choose an MBBS college?",
        answer:
          "Yes. Counselling can help you compare realistic colleges based on factors such as rank, eligibility, fees, location, clinical exposure, academic environment and personal preferences. It cannot guarantee a particular college.",
      },
      {
        question: "What is MBBS counselling?",
        answer:
          "MBBS counselling refers to the guidance and admission process involved in selecting and securing an MBBS seat through the relevant counselling route. It can involve understanding college options, preferences, choice filling, allotment and reporting.",
      },
      {
        question: "How can a counselor for MBBS admission help students?",
        answer:
          "A counselor for MBBS admission can help students understand their available options, compare colleges, think through preferences and make sense of the admission process. Good guidance should be based on the student's actual situation rather than a standard college list.",
      },
      {
        question: "Can counselling help with NEET choice filling?",
        answer:
          "Yes. Counselling can help students think through their preference order and understand the options they are considering before submitting their choices. Students should still follow the current official counselling rules and deadlines.",
      },
      {
        question: "How do I choose between government and private medical colleges?",
        answer:
          "Start with more than the college label. Compare fees, location, academic environment, hospital and clinical exposure, facilities, future plans and what your family can realistically manage. The right choice depends on your individual circumstances.",
      },
      {
        question: "Can ProCounsel help me with medical admission guidance?",
        answer:
          "ProCounsel offers NEET-related tools including a NEET Rank Predictor and NEET College Predictor, along with NEET counselling and MBBS college resources and access to admission counsellors.",
      },
    ],
  },

  {
    slug: "mba-counselling",
    name: "MBA Counselling",
    primaryIntent:
      "Get MBA admission counselling: which entrance exams to take, which colleges to apply to after CAT, XAT, SNAP, NMAT, CMAT or MAH-CET, and how direct admission at private colleges works",
    expertise: ["MBA", "BBA", "Banking and Finance"],
    supportKeywords: [
      "mba admission counselling",
      "mba admission guidance",
      "mba college selection",
      "mba counselling after cat",
      "mba direct admission guidance",
      "mba admission consultants",
      "admission consultants for mba",
    ],
    exams: [
      { name: "CAT", full: "Common Admission Test" },
      { name: "XAT", full: "Xavier Aptitude Test" },
      { name: "SNAP", full: "Symbiosis National Aptitude Test" },
      { name: "NMAT", full: "NMAT by GMAC" },
      { name: "CMAT", full: "Common Management Admission Test" },
      { name: "MAH-CET", full: "Maharashtra MBA/MMS Common Entrance Test" },
    ],
    leadOffer: "Free MBA college shortlist based on your score, profile and budget",
    tools: [
      { label: "CAT College Predictor", to: "/cat-college-predictor" },
      { label: "MBA Admission Guide 2027", to: "/mba-admission-2027" },
      { label: "Best MBA Colleges in India", to: "/mba-colleges" },
      { label: "IIM CAT Cut-offs", to: "/mba-colleges/iim-cutoffs" },
      { label: "MBA Entrance Exams", to: "/mba-entrance-exams" },
      { label: "MBA Without CAT", to: "/mba-without-cat" },
    ],
    cities: ["pune", "mumbai"],
    priority: "growth",
    title: "MBA Admission Counselling 2027 | ProCounsel",
    description:
      "MBA admission counselling for CAT, XAT, SNAP, NMAT, CMAT and MAH-CET: college selection, applications, interviews and direct-admission guidance.",
    h1: "MBA Admission Counselling 2027",
    intro:
      "ProCounsel's MBA admission counselling helps you decide which entrance exams to take, which colleges to apply to with your CAT, XAT, SNAP, NMAT, CMAT or MAH-CET score, and how to handle applications, interviews and offers. We also explain direct-admission routes at private colleges. We guide the decision; admission is always the institute's call.",
    sections: [
      {
        heading: "What does MBA admission counselling at ProCounsel include?",
        paragraphs: [
          "Two things, done properly: choosing where to apply, and getting through the admission process at those colleges. We do not sell coaching, and we do not sell seats.",
          "A counsellor starts with your entrance score or expected score, your Class X, XII and graduation marks, any work experience, your budget and the cities you would study in. From that, you build a shortlist of colleges where your profile is realistic, plan the applications and deadlines, and prepare for the written tests, group discussions and interviews each college uses.",
        ],
        bullets: [
          "Exam planning: which of CAT, XAT, SNAP, NMAT, CMAT and MAH-CET your target colleges use",
          "College selection after the result: a shortlist split into reach, match and safe options",
          "Applications and deadlines for each college on that shortlist",
          "WAT, GD and personal-interview preparation",
          "Comparing offers, waitlists and fees when results come in",
          "Direct-admission guidance at private colleges, explained honestly",
        ],
      },
      {
        heading: "Which entrance exams do we counsel for?",
        paragraphs: [
          "CAT is the exam the IIMs and most top B-schools use, so most plans start there. XAT leads to XLRI and other institutes that accept it; SNAP is the route into the Symbiosis institutes; NMAT is used by NMIMS and other participating schools; CMAT is accepted by many AICTE-approved institutes; and MAH-CET fills MBA/MMS seats in Maharashtra through the state's Centralised Admission Process.",
          "Each exam has its own pattern, calendar and set of colleges. Counselling helps you take the two or three that match the colleges you would actually join, instead of spreading your preparation across all of them.",
        ],
      },
      {
        heading: "How do we help you choose MBA colleges after CAT?",
        paragraphs: [
          "Once your percentile is out, the question becomes where to apply. Every IIM publishes minimum CAT percentiles by category, and several other institutes publish minimums or shortlisting cut-offs too. We use those official figures — not forum guesses — to sort your options.",
          "A college is a reach if your score is near or below what it usually shortlists at, a match if you clear its minimums comfortably, and a safe option if you clear them by a wide margin and would still be glad to join. A good shortlist has all three, so one result never decides your year.",
          "We then look at the things a percentile does not tell you: the median salary in the institute's own placement report, the total fee and what it covers, batch size, specialisations actually offered and location.",
        ],
      },
      {
        heading: "What about MAH-CET and Maharashtra CAP admissions?",
        paragraphs: [
          "MBA and MMS seats in Maharashtra's state-approved institutes are filled through the Centralised Admission Process run by the State CET Cell, using MAH-CET scores and, for some seats, CAT and other national exams. Students lose good options here by filling the option form carelessly or misreading which seat types they are eligible for.",
          "Counselling covers CAP registration, reading the official closing percentiles of earlier rounds (which are MAH-CET percentiles, not CAT), ordering your option form and deciding what to do after each round.",
        ],
      },
      {
        heading: "What is direct admission, and how do we guide it?",
        paragraphs: [
          "Some private and deemed-university B-schools fill part of their intake through their own process: an application, the institute's own test or interview, and often a minimum score in a national exam. When that follows the institute's published admission policy, it is a legitimate route — sometimes the right one for a student whose entrance score did not go as planned.",
          "We help you find which private colleges run such a process, check the programme's approval and the fee in the institute's own documents, and apply through the institute. We will tell you plainly when an offer looks wrong: any 'guaranteed seat' for a payment outside the institute's official fee receipt is a warning sign, and we do not take part in it.",
        ],
      },
      {
        heading: "How do we prepare you for WAT, GD and interviews?",
        paragraphs: [
          "Shortlisted candidates face a written ability test, a group discussion, a personal interview, or some mix of these. Each institute weighs them differently, and the final merit list re-weights everything, so this stage often decides the outcome.",
          "Preparation covers a clear, specific answer to 'why an MBA and why now', your academic and work story, current business topics, and practice interviews with feedback. The goal is that you sound like yourself, only better prepared.",
        ],
      },
      {
        heading: "What does MBA counselling not do?",
        paragraphs: [
          "No honest counsellor can promise you admission, a particular college, a placement or a salary, and we do not. Institutes make their own admission decisions on their own published criteria.",
          "We also do not write your applications or statements for you, and we do not claim inside access to any admissions office. What we do is help you choose well, prepare well and avoid avoidable mistakes.",
        ],
      },
      {
        heading: "How does the counselling process work?",
        paragraphs: [
          "It starts with a free call. You share your score or expected score, academics, work experience, budget and preferences; the counsellor explains your realistic options and what to do next. If you want continued support through applications, CAP rounds and interviews, the counsellor explains how that works before you commit to anything.",
          "Everything we discuss is checked against each college's own documents — its admission policy, fee notice and placement report — which we link on our MBA pages so you can verify them yourself.",
        ],
      },
      {
        heading: "Why talk to ProCounsel about MBA admission?",
        paragraphs: [
          "Because the information is everywhere and the clarity is not. Our MBA pages publish only official figures, with sources: IIM minimum percentiles by category, published cut-offs of other B-schools, fees, median salaries, exam patterns and Maharashtra's CAP closing percentiles. Counselling puts those figures to work on your profile.",
          "If you are looking for MBA admission consultants, ask any of them the same questions: which official documents is this advice based on, and what exactly will you do for me? We are happy to be held to that standard.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is MBA admission counselling?",
        answer:
          "Help choosing which entrance exams to take and which colleges to apply to with your score, followed by support through applications, written tests, group discussions, interviews and offers.",
      },
      {
        question: "Which exams does ProCounsel's MBA counselling cover?",
        answer:
          "CAT, XAT, SNAP, NMAT, CMAT and MAH-CET, including Maharashtra's CAP admissions for MBA/MMS seats.",
      },
      {
        question: "Can you help me choose MBA colleges after my CAT result?",
        answer:
          "Yes. We use each institute's officially published minimum percentiles or cut-offs, plus its fees and placement report, to build a shortlist of reach, match and safe colleges for your profile.",
      },
      {
        question: "Do you offer direct admission in MBA colleges?",
        answer:
          "We guide you through direct-admission routes that private colleges run under their own published admission policy, and help you check approvals and fees. We do not sell seats, and we advise against any offer that bypasses the institute's official process.",
      },
      {
        question: "Does ProCounsel guarantee MBA admission?",
        answer:
          "No. Admission decisions belong to each institute. We help you choose well and prepare well; no counsellor can honestly promise a seat, a placement or a salary.",
      },
      {
        question: "When should I start MBA admission counselling?",
        answer:
          "Ideally before you register for exams, so you take the right ones, and again when results arrive, when the college shortlist and applications matter most. It is still useful during interview season and CAP rounds.",
      },
      {
        question: "Can you help with MAH-CET CAP option form filling?",
        answer:
          "Yes. We explain the seat types you are eligible for, use the official closing percentiles of earlier rounds to order your options, and help you decide what to do after each round.",
      },
      {
        question: "Do you help with MBA interviews and group discussions?",
        answer:
          "Yes. Preparation covers your 'why MBA' story, academics and work experience, current business topics and practice interviews with feedback.",
      },
      {
        question: "Is the first MBA counselling call free?",
        answer:
          "Yes. The first call to understand your profile and options is free, and there is no obligation to continue.",
      },
    ],
  },

  {
    slug: "law-counselling",
    name: "Law Counselling",
    primaryIntent:
      "Find and talk to a law admission counsellor about LLB course choice, entrance scores and law college selection",
    expertise: ["Law"],
    supportKeywords: [
      "counselling for law",
      "llb counselling",
      "online law counselling",
      "law admission counselling",
      "law counselling",
      "career counselling for law students",
    ],
    exams: [
      { name: "CLAT", full: "Common Law Admission Test" },
      { name: "AILET", full: "All India Law Entrance Test" },
      { name: "LSAT India", full: "Law School Admission Test \u2014 India" },
      { name: "MH CET Law", full: "Maharashtra Common Entrance Test for Law" },
      { name: "CUET", full: "Common University Entrance Test" },
    ],
    leadOffer: "Free law college shortlist based on your rank and category",
    tools: [],
    cities: ["delhi", "mumbai", "bangalore", "pune"],
    priority: "growth",
    title: "Law Counselling & Admission Guidance | ProCounsel",
    description:
      "Get expert law counselling and admission guidance to choose the right LLB college, course and career path. Get personalised guidance for law admissions.",
    h1: "Law Counselling & Admission Guidance",
    intro:
      "\u201cI want to study law. But I have no idea where to start.\u201d If that sounds familiar, you are in good company. Law is one of those fields almost everyone has an opinion about and very few people can explain properly. You have probably heard that you need to crack CLAT. You may have heard that only the National Law Universities are worth attending. Someone has probably told you that law means standing in a courtroom arguing cases. Some of that is partly true. Most of it is incomplete.",
    sections: [
      {
        heading: "Where the real confusion begins",
        paragraphs: [
          "Should you take the five-year integrated course after class 12 or finish a bachelor's degree first? Which entrance exam should you prepare for? Is CLAT the only option? What happens if your rank is not high enough for a National Law University? Which private or state law colleges are actually worth considering? And what kind of career does a law degree even lead to?",
          "These questions do not have one correct answer. They have an answer that depends on you \u2014 where you are in your education right now, what you can realistically prepare for, what your family can manage, and what kind of work you would like to do afterwards.",
          "That is what counselling for law is for. Not to hand you a ranked list of colleges, but to help you understand the choices in front of you before you commit five years and a significant amount of money to one of them.",
          "ProCounsel helps students and parents explore law courses, understand admission routes, compare colleges and think about career direction \u2014 based on the student's own situation rather than a standard recommendation.",
        ],
      },
      {
        heading: "Education, admission & career counselling",
        paragraphs: [
          "A law admission decision is really three decisions sitting together. What course should I take? Which college should I take it at? And what do I want to do with the degree afterwards?",
          "Students often focus on only the middle one. They chase a college name without checking whether the course structure, the specialisations offered or the practical exposure suit what they actually want. Others go the opposite way and pick a course without thinking about whether the institution will give them moot courts, internships and a peer group that pushes them.",
          "None of these questions mean you are confused. They are normal questions, and they are much easier to answer before an admission deadline than during one.",
        ],
      },
      {
        heading: "Education counselling services",
        paragraphs: [
          "A lot of students assume law counselling means someone looks at your entrance rank and tells you which college to take. It should be more than that. Your rank is important, but it does not tell the whole story.",
          "Maybe you are certain about law. Maybe you are considering it alongside other options and want to understand it properly first. Maybe you want to stay in your home state. Maybe your family has a specific budget. Maybe you are interested in corporate practice rather than litigation and want a college with the right exposure for that.",
          "Good LLB counselling starts with understanding the student. The conversation can cover your academic background, entrance preparation, interests, location preferences, budget, eligibility and what you actually want from a law degree. Sometimes the most useful thing a counsellor can do is ask a question you had not thought about yet.",
        ],
      },
      {
        heading: "Admission counselling services",
        paragraphs: [
          "This is usually where students and parents start feeling overwhelmed. Different law colleges run different admission routes, and the calendar for them does not line up neatly. Law admission counselling can help you keep track of what each route actually asks for:",
        ],
        bullets: [
          "Which entrance exams to target \u2014 CLAT, AILET, LSAT India, state-level tests such as MH CET Law, or CUET for some universities",
          "Eligibility for the five-year integrated LLB and the three-year LLB",
          "Registration, application deadlines and admission rounds for each college",
          "How preference or choice filling works in the counselling processes that use it",
          "Seat allotment, upgradation rounds, documents and reporting",
          "Backup options if the first round does not go the way you hoped",
        ],
      },
      {
        heading: "Preference order deserves real thought",
        paragraphs: [
          "In the counselling processes that use a preference list, the order you submit interacts with your rank and category to decide where you are allotted. It should not be treated like filling in a random form, and it should not be copied from a friend or a message forwarded in a group.",
          "Understand why you are putting each option where it is. You do not want to look back later and think, \u201cI wish I had understood this before submitting my choices.\u201d",
          "And be careful with promises. No honest counsellor can guarantee you a particular college or seat. Your actual options depend on your rank, category, eligibility, available seats and the rules of the relevant admission process.",
        ],
      },
      {
        heading: "Career counselling services",
        paragraphs: [
          "Here is a question worth asking early: what do you actually want to do with a law degree?",
          "Many students picture litigation \u2014 courtrooms, arguments, cross-examination. That is one path, and for some people it is the right one. But a law degree also leads to corporate and transactional practice, in-house legal teams, the judiciary, civil services, compliance and regulatory work, policy and research, intellectual property, legal journalism, academia and postgraduate study.",
          "These are genuinely different working lives, with different daily routines, different skills and different starting points. Career counselling for law students is about understanding those differences before you specialise, not after.",
          "It is also useful in the other direction. If you are not sure law is right for you, that is worth talking through honestly rather than discovering it in your third year.",
        ],
      },
      {
        heading: "College & university selection",
        paragraphs: [
          "When students compare law colleges, the first question is usually which one is better. A more useful question is which one is better for you.",
        ],
        bullets: [
          "Recognition, approval and the college's standing with the profession",
          "Faculty, curriculum and the specialisations actually taught",
          "Moot court culture, legal aid clinics and practical training",
          "Internship support and the firms, chambers and organisations students actually reach",
          "Alumni network, peer group and academic environment",
          "Fees, hostel, location and what your family can realistically manage",
        ],
      },
      {
        heading: "Look past the name of the college",
        paragraphs: [
          "Do not ignore the financial side. Families sometimes stretch for an expensive college on the assumption that any law degree from a well-known name will pay for itself. Your family's financial comfort matters too, and a five-year course is a long commitment.",
          "Similarly, one student may prefer staying close to home while another is perfectly comfortable moving to another state. There is not one perfect law college for every student. The right choice depends on the person making it.",
        ],
      },
      {
        heading: "Course selection guidance",
        paragraphs: [
          "The first real fork is the five-year integrated LLB against the three-year LLB. The integrated route is taken directly after class 12 and combines a bachelor's degree \u2014 BA, BBA, BCom or BSc, depending on the college \u2014 with law. The three-year LLB is taken after graduation.",
          "Neither is inherently better. They suit different starting points. If you are certain about law at the end of class 12, the integrated route gets you there sooner. If you are not certain, or you want a different bachelor's subject first, the three-year LLB after graduation is a perfectly normal path into the profession.",
          "Beyond that, colleges differ in the honours streams and electives they offer \u2014 constitutional law, corporate law, criminal law, international law, intellectual property and others. Those choices shape your internships and, often, your first job. They are worth understanding before you pick a college, not after.",
        ],
      },
      {
        heading: "A personalised counselling process",
        paragraphs: [
          "Counselling should feel like a conversation, not an interview where someone ticks boxes.",
          "It starts with you \u2014 your class 12 or graduation background, your entrance preparation or score, your preferences, budget and concerns. From there you look at the courses and colleges that are genuinely relevant to your situation, and build a sensible shortlist rather than a screen full of a hundred names.",
          "Then you compare them properly on fees, practical exposure, location, faculty and academic environment, and work through the admission and preference process so you understand why each option sits where it does on your list.",
          "The final decision belongs to you and your family. A counsellor's job is not to make it for you. It is to help you make it with your eyes open.",
        ],
      },
      {
        heading: "Why choose ProCounsel",
        paragraphs: [
          "Once results are out, advice seems to come from everywhere. A friend has a college suggestion. A relative knows someone who studied there. A group chat has a predicted cut-off. Someone online says something completely different. And after listening to everyone, you still do not know what applies to your situation.",
          "That is where having one place for college information, admission resources and counselling support can be useful. ProCounsel focuses on personalised counselling, admission guidance and college exploration so students can compare their options properly instead of collecting opinions.",
          "Online law counselling also makes this easier to access. Most of these conversations do not need to happen in person, so students outside the big cities can still talk to a counsellor about their profile, college choices and admission questions.",
          "There should not be promises like \u201cwe will get you this college.\u201d Nobody can honestly promise that. What good counselling can do is help you understand your choices, spot things you may have missed, and avoid making an important decision simply because everyone around you is saying something different.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is law counselling?",
        answer:
          "Law counselling helps students understand law courses, colleges and admission options based on their entrance result, eligibility, preferences and career goals.",
      },
      {
        question: "What is LLB counselling?",
        answer:
          "LLB counselling is guidance around choosing and applying to an LLB programme \u2014 including whether the five-year integrated course or the three-year LLB suits you, which colleges to consider, and how each admission process works.",
      },
      {
        question: "What does law admission counselling include?",
        answer:
          "It can include entrance exam selection, eligibility checks, college shortlisting, application deadlines, preference or choice filling, seat allotment, documents and reporting.",
      },
      {
        question: "When should I take counselling for law?",
        answer:
          "You can seek guidance while deciding whether to study law, while choosing which entrance exam to prepare for, or once your result is out and you need to compare colleges. Earlier usually means fewer rushed decisions later.",
      },
      {
        question: "Can counselling help me choose a law college?",
        answer:
          "Yes. It can help you compare colleges on your rank and category, fees, practical exposure, internships, location, faculty and academic environment rather than on reputation alone.",
      },
      {
        question: "Should I take the five-year integrated LLB or a three-year LLB?",
        answer:
          "If you are certain about law at the end of class 12, the five-year integrated route gets you there sooner. If you are not certain, or you want a different bachelor's subject first, the three-year LLB after graduation is a perfectly normal path into the profession.",
      },
      {
        question: "Is CLAT the only way into law?",
        answer:
          "No. AILET is a separate test for NLU Delhi, LSAT India is accepted by a number of private universities, several states run their own law entrance tests such as MH CET Law, and some universities admit through CUET. Which ones are worth taking depends on where you are willing to study.",
      },
      {
        question: "Is online law counselling useful?",
        answer:
          "Yes. Most counselling conversations can happen online, which means students outside the larger cities can still discuss their profile, college options and admission questions with a counsellor.",
      },
      {
        question: "How can career counselling for law students help?",
        answer:
          "A law degree can lead to litigation, corporate practice, in-house legal roles, the judiciary, civil services, policy, intellectual property, academia and postgraduate study. Career counselling helps you understand those paths before you choose your specialisation and internships.",
      },
      {
        question: "Can ProCounsel help with law admission guidance?",
        answer:
          "ProCounsel provides college information, admission resources and counselling support for students exploring law courses and law college options.",
      },
    ],
  },

  {
    slug: "career-counselling",
    name: "Career Counselling",
    primaryIntent:
      "Find and talk to a counsellor about course, college and career direction after Class 10 or 12",
    expertise: ["HSC", "B.Sc", "B.A.", "B.Com", "M.Sc", "M.A.", "M.Com", "B.Ed", "M.Ed", "Psychology", "Others"],
    supportKeywords: [
      "education counselling services",
      "admission counselling",
      "college admissions counselor",
      "career guidance service",
      "higher education counseling",
      "career counselling after 12th",
      "best choice after 12th",
      "choosing a career path",
      "career options based on interests",
      "how to choose a right career for yourself",
    ],
    exams: [
      { name: "CUET", full: "Common University Entrance Test" },
      { name: "Board exams", full: "Class 10 and Class 12 board examinations" },
    ],
    leadOffer: "Free course and career-fit discussion",
    tools: [
      { label: "Mettle Career Test", to: "/mettle" },
      { label: "All Predictors", to: "/predictors" },
    ],
    cities: ["delhi", "mumbai", "pune", "bangalore"],
    priority: "core",
    title: "Education, Admission & Career Counselling Services | ProCounsel",
    description:
      "Get expert education, admission and career counselling to choose the right course, college and career path. Get personalised guidance from ProCounsel counsellors.",
    h1: "Education, Admission & Career Counselling",
    intro:
      "You finish Class 12, open Google, and search: “Which course should I choose?” Within minutes, you have hundreds of answers. One person says engineering has the best scope. Someone else says medicine is the safest option. Your friend is preparing for management. A relative recommends a particular college. Your parents have their own suggestions. And somehow, after all that research, you are even more confused.",
    sections: [
      {
        heading: "The problem isn't information — it's relevance",
        paragraphs: [
          "Students today usually don't lack information. There is plenty of it. The difficult part is figuring out which information actually makes sense for you.",
          "That is where personalised guidance can make a difference. ProCounsel brings together education, admission and career guidance to help students and parents make more informed decisions about courses, colleges, admissions and future plans.",
          "The idea is simple: before making a big education decision, take some time to understand your options properly.",
        ],
      },
      {
        heading: "Education counselling services",
        paragraphs: [
          "Education counselling services are not simply about giving a student a list of courses or colleges. Good education counselling starts with the student.",
          "What have you studied so far? Which subjects do you actually enjoy? What are your marks and entrance-exam plans? What kind of career are you considering? What is your budget? Do you want to study close to home or are you open to another city?",
          "These questions matter because two students with similar marks may need completely different advice. For example, a student interested in computers could consider engineering, computer applications, data-related programs or other technology-focused courses. Another student with the same academic background may be more interested in business, design or research.",
          "Sometimes, what a student needs is not another 50-college list. They need someone to ask the right questions first.",
        ],
        bullets: [
          "Understanding your academic background and interests",
          "Exploring suitable education pathways and comparing courses",
          "Identifying realistic college options",
          "Understanding what different courses can lead to",
          "Looking at alternatives instead of relying on one option",
          "Discussing concerns students and parents may not know how to evaluate alone",
        ],
      },
      {
        heading: "Admission",
        paragraphs: [
          "College admission can look straightforward from the outside. Then the forms open. Suddenly there are entrance exams, eligibility requirements, registration dates, cut-offs, counselling rounds, choice filling, document verification and seat allotment. Different colleges and states can follow different processes, which makes things harder to keep track of.",
          "A student may know which college they like but still be unsure about how realistic the option is. Another may have a good rank but not know how to arrange their choices. And sometimes the biggest mistake is simply missing an important deadline.",
          "Admission guidance can help students understand the bigger picture instead of treating every form, deadline or counselling round as a separate task. The goal isn't to make the decision for you. It is to help you understand your choices before you submit them.",
        ],
      },
      {
        heading: "Counselling services",
        paragraphs: [
          "Not every student needs the same kind of counselling. One student may need help deciding between two courses. Another may already know the course but have no idea which colleges to shortlist. Someone else may need help understanding admission rounds after receiving an entrance-exam result.",
          "The right recommendation can depend on several things — marks, interests, goals, budget, location, preferred course, entrance-exam performance and even what kind of work you see yourself doing later. There isn't one answer that works for everyone.",
          "A good counselling conversation gives you space to ask questions, challenge assumptions and understand why a particular option may or may not suit you.",
        ],
        bullets: [
          "Academic planning and course selection",
          "Career guidance and college selection",
          "Admission guidance and application planning",
          "Entrance-exam-related decisions",
          "Higher education planning and future study options",
        ],
      },
      {
        heading: "Career counselling services",
        paragraphs: [
          "Career decisions often become serious around Class 10 and Class 12. And this is also when students hear the most opinions. “Engineering kar lo, scope hai.” “Medical is better.” “B.Com ke baad CA kar lena.” “Law has a lot of opportunities.”",
          "The problem isn't that these suggestions are necessarily wrong. The problem is that they may not be right for you. Maybe you have good marks but don't know what you enjoy. Maybe you are interested in several fields. Maybe your parents and your own preferences don't match.",
          "Career counselling helps students step back and look at the bigger picture — their strengths, interests, possible career directions, suitable courses and the skills those paths may require. A useful career guidance service should not simply say, “Choose this career.” It should help you understand why a particular direction could fit, what the path looks like and what alternatives you have.",
          "Career counselling services are particularly useful when a student feels stuck between several possibilities. You don't need to have your entire future figured out before asking for guidance.",
        ],
      },
      {
        heading: "College & university selection",
        paragraphs: [
          "Choosing a college is about more than asking, “Which college has the highest ranking?” Rankings can be useful. But they are only one part of the decision.",
          "The “best college” on the internet may not be the best college for your particular situation. That can be especially useful to remember when you have a long list of colleges and need to narrow it down to choices that actually make sense.",
        ],
        bullets: [
          "Does the college offer the course or specialisation you want?",
          "What does the curriculum look like, and how are the faculty and learning environment?",
          "What are the fees and other costs, and is the location practical for you?",
          "What internship and industry exposure opportunities are available?",
          "What placement information is available?",
          "Is the institution appropriately recognised or accredited for the course?",
          "Does the college fit your longer-term plans?",
        ],
      },
      {
        heading: "Course selection guidance",
        paragraphs: [
          "Choosing a course because everyone else is choosing it can feel safe — until you realise a few months later that you don't enjoy the subject.",
          "These questions can prevent a very common mistake: choosing a course based only on popularity, marks, family pressure or what friends are doing. It doesn't mean there is one “perfect” course waiting to be discovered. Sometimes the better outcome is simply understanding your options well enough to choose one consciously.",
        ],
        bullets: [
          "Do I actually enjoy learning about this subject?",
          "What kind of careers can this course lead to?",
          "What skills will I develop, and what can I study afterwards?",
          "What does the day-to-day work in related careers look like?",
          "Does the course fit my strengths, and what alternatives do I have?",
        ],
      },
      {
        heading: "A personalised counselling process",
        paragraphs: [
          "Counselling should feel like a conversation, not like filling out a form and receiving a random recommendation. Every student's journey can be slightly different, but a useful process generally looks something like this.",
          "The final decision should still belong to the student and family. The purpose of counselling is to make that decision more informed and less driven by pressure or guesswork.",
        ],
        bullets: [
          "Understand the student — academic background, interests, goals and current concerns",
          "Identify suitable options — courses, colleges and career paths that could fit",
          "Compare choices — course content, college, fees, location, admission requirements and career direction",
          "Get expert guidance — ask the questions that are hard to answer through online searches",
          "Create an action plan — what to research, which deadlines to track, which colleges to shortlist",
          "Move forward with confidence",
        ],
      },
      {
        heading: "When parents want IIT or MBBS and you want something else",
        paragraphs: [
          "\u201cBeta, IIT ka try karo.\u201d \u201cMBBS kar lo, life set ho jayegi.\u201d For a lot of Indian students that conversation starts long before the Class 12 results do. You may be curious about design, psychology, computers, finance, research or law. And then someone asks how your JEE preparation is going, and suddenly choosing a career stops feeling like your decision.",
          "Parents are usually not trying to control anyone. Most of the time they are worried. Many of them grew up when the list of understandable careers was much shorter \u2014 engineering, medicine, government service, teaching, CA \u2014 so they recommend what they know, and they associate those paths with security. The career world today is much wider: analytics, cybersecurity, UX design, biotechnology, clinical research, product management, sustainability. The problem is rarely that parents do not care. Often they simply have less information about the alternatives.",
          "So who should decide? Honestly, neither side alone. Choosing a career path works best when parents guide, students participate, and the final choice belongs to the person who will actually live that career for the next twenty years.",
        ],
      },
      {
        heading: "Career counselling after 12th starts with you, not a college",
        paragraphs: [
          "One of the biggest mistakes students make is starting with colleges. Which IIT should I target? Which medical college can I get? Those questions matter eventually, but they are not the first ones. The first question is what kind of career suits you \u2014 and that is what career counselling after 12th is actually for.",
          "Ask which subjects genuinely make you curious, not which subjects give you the highest marks. There is a difference. You might score well in mathematics and still hate spending hours on it. You might get average marks in biology and still spend your evenings watching things about anatomy and medical research. Marks give you information. Interest gives you direction.",
          "And you do not need your whole life mapped at 17. Not knowing yet does not mean you are behind; it means you need time to explore properly rather than guessing under pressure.",
        ],
      },
      {
        heading: "Career options based on interests, not just labels",
        paragraphs: [
          "This is where the conversation gets more interesting, because most interests open several doors rather than one.",
          "If you like technology but not coding all day, there is UX and UI design, product management, technology consulting, digital marketing, business analytics and technical writing. If you like biology but do not want to be a doctor, there is biotechnology, clinical research, nutrition, pharmaceutical sciences, microbiology and genetics. If you enjoy numbers and business, look at finance, accounting, economics, investment analysis and data analytics. If you like talking to people and solving their problems, consider psychology, human resources, counselling, public relations, teaching or customer success.",
          "Looking at career options based on interests is usually far more useful than picking whichever course is popular this year. The goal is not to find one magical career. It is to find a few paths worth exploring seriously.",
        ],
      },
      {
        heading: "How to choose a right career for yourself",
        bullets: [
          "Interest \u2014 what actually holds your attention when nobody is marking you.",
          "Ability \u2014 what you are good at, or could realistically become good at.",
          "Personality \u2014 whether you prefer people, numbers, technology, ideas, machines or creative work.",
          "Reality \u2014 what the job actually involves day to day, what it requires, and what the opportunities and difficulties are.",
        ],
        paragraphs: [
          "That last one gets skipped most often. Do not choose a career because social media made it look exciting. Talk to people doing the work, read real job descriptions, look at the skills employers ask for and try a small project. That is a much better way to work out how to choose a right career for yourself than any single aptitude score.",
          "And remember that a good career and a good career for you are not the same thing. Engineering is an excellent career. It is not the right career for every student. A \u20b910,000 pair of shoes is not useful if it does not fit your feet, and prestige works the same way.",
        ],
      },
      {
        heading: "The best choice after 12th is not the same for everyone",
        paragraphs: [
          "For one student it is IIT. For another, MBBS. For someone else it is computer science, design, psychology or biotechnology. There is no universal best choice after 12th \u2014 the best choice is the one where your interests, abilities, opportunities, finances and long-term goals make sense together.",
          "That is why copying someone else\u2019s path rarely works. Your friend getting into IIT does not mean you should. Your cousin becoming a doctor does not mean you should. And your first degree matters, but it is not a life sentence: people move from engineering into finance, from biology into management, from IT into starting something of their own. Instead of asking what you will do for the rest of your life, ask what the best next direction is right now. That question is much easier to answer.",
          "If you and your parents disagree, do not turn it into \u201cyou don\u2019t understand me\u201d. Come prepared. Research the course, the entrance requirements, the job roles, the earnings and the growth. Then explain your reasoning calmly. \u201cI have explored these options and here is why this path fits me\u201d is a very different conversation from \u201cI don\u2019t want IIT\u201d \u2014 and it is far more likely to work.",
        ],
      },
      {
        heading: "Why choose ProCounsel",
        paragraphs: [
          "There are plenty of websites where you can search for colleges. So why consider a counselling platform? One reason is that education decisions rarely happen in isolation. You may need to understand a course, compare colleges, check your admission possibilities, follow deadlines and decide how to arrange your choices — all around the same time.",
          "ProCounsel brings several of these pieces together: personalised admission guidance, experienced admission counsellors, college and course exploration, JEE and NEET rank and college predictors, MHT-CET college prediction and option-form support, admission deadlines, college profiles for shortlisting, and ProBuddies connecting students with college seniors.",
          "ProCounsel has guided 10,000+ students, has 15+ years of experience, and is trusted by 50,000+ families. The platform also supports later stages such as internships, placements and further studies — because getting into college is not the only decision students will make.",
          "The point of guidance is not to tell every student to follow the same path. It is to help each student understand their own options more clearly.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is education counselling?",
        answer:
          "Education counselling is guidance that helps students understand and compare education options based on their academic background, interests, goals and practical circumstances. It can include course selection, college selection, admission planning and higher education decisions.",
      },
      {
        question: "When should a student take career counselling?",
        answer:
          "There is no single “right” time. Students may benefit from career counselling after Class 10, after Class 12, during college or when they are considering a change in direction. It can be especially useful when there are several options but no clear preference.",
      },
      {
        question: "What does an admission counsellor do?",
        answer:
          "An admission counsellor helps students understand the admission process, including relevant colleges, courses, eligibility, applications, deadlines, entrance exams and counselling or choice-filling stages.",
      },
      {
        question: "How can a college admissions counselor help me?",
        answer:
          "A college admissions counselor can help you understand and compare college options, identify questions you should ask before applying and make sense of different parts of the admission process. The exact guidance depends on your course, exam, college and admission route.",
      },
      {
        question: "How does career counselling help students after Class 12?",
        answer:
          "It gives students a structured way to think about their interests, strengths, possible careers and education pathways. Instead of choosing a course only because it is popular, students can compare options based on what actually fits them.",
      },
      {
        question: "Can counselling help me choose the right course?",
        answer:
          "Yes, counselling can help you compare courses by looking at your interests, academic background, career goals, skills and future study options. It cannot predict your future, but it can help you make a more informed choice.",
      },
      {
        question: "Can ProCounsel help me shortlist colleges?",
        answer:
          "ProCounsel provides college profiles, college predictors and admission guidance to help students explore and shortlist options. The website also includes tools for JEE, NEET and MHT-CET-related college and rank planning.",
      },
      {
        question: "What is higher education counseling?",
        answer:
          "Higher education counseling refers to guidance around education choices after school or during later stages of study. It can involve selecting undergraduate or postgraduate courses, comparing institutions, planning admissions and understanding future study pathways.",
      },
      {
        question: "Is career counselling only for students who are confused?",
        answer:
          "No. Even students who have a fairly clear goal can use counselling to test their assumptions, understand alternatives and create a more practical education plan.",
      },
      {
        question: "How can I get expert counselling from ProCounsel?",
        answer:
          "You can explore the counselling and admission resources available through the ProCounsel website and choose the type of guidance relevant to your situation.",
      },
    ],
  },
];

export const COUNSELLING_CATEGORY_SLUGS = COUNSELLING_CATEGORIES.map((c) => c.slug);

/**
 * Resolves a slug to its page record.
 *
 * Looks through the exam pages too (`/jee-counselling`, `/cat-counselling`, …),
 * which share this shape so that one page component, one schema block and one
 * CTA path serve both tiers. Imported lazily-by-reference rather than at the
 * top of the file to keep the dependency one-way: exams know about categories,
 * not the other way round.
 */
export function getCategoryBySlug(slug?: string): CounsellingCategory | undefined {
  if (!slug) return undefined;
  const s = slug.toLowerCase();
  return (
    COUNSELLING_CATEGORIES.find((c) => c.slug === s) ??
    COUNSELLING_EXAMS.find((c) => c.slug === s)
  );
}

/**
 * The listing URL the "Get counselling" CTA sends people to: the counsellor
 * list pre-filtered to this category's expertise, with the originating page
 * recorded so the lead captured at login knows where it came from.
 */
export function categoryListingUrl(category: CounsellingCategory): string {
  const params = new URLSearchParams({
    expertise: category.expertise.join(","),
    from: category.slug,
  });
  return `/counsellor-listing?${params.toString()}`;
}
