import type { SeoSection, SeoFaqItem } from "./SeoArticle";

/**
 * Long-form, keyword-rich page content sourced from the ProCounsel SEO brief.
 * Rendered via <SeoArticle /> to give each page real content depth for SEO
 * and ad-network review.
 */

export const counsellorsContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  faqs: [
    {
      question: "What does a career consultant actually do?",
      answer:
        "A career consultant helps you understand your strengths, interests and goals, then maps them to realistic education and career options. Instead of handing you a generic ranking list, a good career consultant asks the right questions and helps you make a decision that fits you — not just what worked for someone else.",
    },
    {
      question: "How is a certified career coach different from general advice?",
      answer:
        "Advice is quick and usually tells you what someone else would do. A certified career coach goes deeper — exploring your aptitude, motivations and long-term direction so you build confidence in your own decisions rather than depending on others for answers.",
    },
    {
      question: "When should a student speak to a professional career coach?",
      answer:
        "Any major decision point is a good time — after 10th, after 12th, during graduation, or when switching paths. If you feel stuck choosing a stream, college or career, a professional career coach can turn that confusion into a clear, step-by-step plan.",
    },
    {
      question: "Is online career counselling as effective as in-person?",
      answer:
        "Yes. Career counselling online gives you access to experienced mentors and the best career consultants regardless of where you live, using the same assessments and one-on-one conversations. For most students the convenience makes it easier to follow through.",
    },
  ],
  title: "Why Students Often Need More Than Just Advice",
  intro:
    "Most students don't struggle because information is hard to find — if anything, the opposite is true. Open YouTube, Instagram, Google or any student forum and you'll find thousands of opinions about careers, colleges, courses and future opportunities. The problem is figuring out which answer actually applies to you.",
  sections: [
    {
      paragraphs: [
        "We've spoken with students who spent weeks watching videos about career options but still felt stuck when it came time to make a decision — not because they lacked information, but because none of it felt personal. That's where a career consultant can make a real difference. A good conversation often reveals things students haven't considered before: a hidden interest, an overlooked strength, or simply a different way of looking at their options.",
        "One thing we've noticed over the years is that students often ask the wrong question. Instead of asking, \"Which course is best?\" they should ask, \"Which course is best for me?\" That small change in thinking can completely transform the decision-making process. This is one reason students increasingly look for the best career consultant rather than relying solely on online advice.",
        "A professional career coach doesn't begin with recommendations. They begin with understanding the student. What excites them? What motivates them? What kind of environment helps them perform at their best? The answers are rarely identical — and that's exactly why personalised guidance matters.",
      ],
    },
    {
      heading: "The Difference Between Advice, Guidance, and Career Coaching",
      paragraphs: [
        "People often use the words advice, counselling, mentoring and coaching as if they mean the same thing. In practice, they're very different. Advice is usually quick — someone tells you what they think you should do. Guidance goes a little deeper, helping you explore options and understand consequences. Career coaching is different again.",
        "A professional career coach focuses less on giving answers and more on helping students think through important decisions themselves. We've seen students who were academically strong but had no idea which direction to pursue, and students with a clear dream but no understanding of how to get there. In both situations, the solution wasn't more information. It was perspective.",
        "A certified career coach helps students look beyond immediate concerns such as college admissions or entrance exams and think about the bigger picture: What kind of career do they want? What skills should they develop? What opportunities might exist five or ten years from now? These aren't questions answered through a quick internet search — they require conversation and reflection.",
        "The best coaching sessions rarely end with a single answer. Instead, students leave with a clearer understanding of their options and greater confidence in the decisions they make. A career consultant cannot predict the future, but they can help students avoid decisions based purely on pressure, assumptions or trends.",
      ],
    },
  ],
};

export const probuddiesContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "ProBuddies: Honest College Guidance From Students Who've Been There",
  intro:
    "Brochures and rankings only tell you so much. What students really want to know — what the hostel food is actually like, whether a branch lives up to its reputation, how placements really work, what daily campus life feels like — rarely makes it into an official prospectus. ProBuddies connects you with verified college seniors who answer exactly those questions, honestly, from real experience.",
  sections: [
    {
      heading: "Real Insider Perspective",
      paragraphs: [
        "A ProBuddy is a current student or recent senior from the college you're considering. Because they're living the experience right now, they can tell you the things that matter most: the strengths and weaknesses of a branch, the quality of teaching, the social and hostel life, and the unwritten realities that shape your years on campus.",
        "This kind of perspective is hard to find online, where information is often outdated, exaggerated, or written to sell a college rather than describe it honestly.",
      ],
    },
    {
      heading: "Know Before You Go",
      paragraphs: [
        "Choosing a college is one of the biggest decisions a student makes — and one of the hardest to reverse. Talking to someone who actually studies there helps you picture what the next few years will really look like before you commit, so there are fewer surprises and far less regret later.",
        "A short, honest conversation often clears doubts that weeks of online research could not.",
      ],
    },
    {
      heading: "Peer-to-Peer Admission Help",
      paragraphs: [
        "Beyond campus life, ProBuddies guide you through the practical side of admissions — entrance exams, document verification, counselling rounds and interviews — from the point of view of someone who recently went through the exact same process.",
        "It feels less like getting advice from a stranger and more like having an elder sibling who genuinely wants you to make the right call.",
      ],
    },
    {
      heading: "Become a ProBuddy",
      paragraphs: [
        "If you're already in college, your experience is valuable to thousands of students figuring out their next step. As a ProBuddy you can mentor juniors, share what you wish you'd known, and earn while helping others — all on your own schedule.",
        "It's a simple way to give back, build your communication skills, and stay connected with aspiring students from your field.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is a ProBuddy?",
      answer:
        "A ProBuddy is a verified college senior or current student who shares honest, first-hand guidance about their college — covering campus life, branches, hostels, placements and the admission process — so aspiring students can decide with confidence.",
    },
    {
      question: "How is a ProBuddy different from a career counsellor?",
      answer:
        "A career counsellor offers professional guidance on careers and strategy. A ProBuddy offers peer-to-peer, lived experience of a specific college or course. Many students use both — a counsellor for the big-picture plan and a ProBuddy for the ground reality of a particular campus.",
    },
    {
      question: "Can a ProBuddy help with the admission process?",
      answer:
        "Yes. ProBuddies can walk you through entrance exams, document verification, counselling rounds and interviews based on their own recent experience, so you know what to expect at each step.",
    },
    {
      question: "How do I become a ProBuddy?",
      answer:
        "If you're a current college student, you can register as a ProBuddy to mentor aspiring students, share insights from your campus and course, and earn while helping others — on a schedule that suits you.",
    },
  ],
};

export const aboutContent: { title: string; intro: string; sections: SeoSection[] } = {
  title: "ProCounsel Overview — Expert Career Guidance and Counselling for Ambitious Students",
  intro:
    "ProCounsel connects determined students with seasoned education counsellors who deliver exceptional career guidance and counselling. We stand out as one of the best abroad education consultants in India, featuring top study abroad consultants in India who provide the best counselling for abroad studies in India.",
  sections: [
    {
      heading: "Our Core Purpose",
      paragraphs: [
        "Through our established career counselling website, we showcase professionals from the top 10 educational consultants in India, helping you chart a clear path through higher education and professional growth. As the best site for career guidance, ProCounsel ensures every student receives accessible, high-quality career guidance and counselling tailored to their goals.",
      ],
    },
    {
      heading: "What We Offer",
      subheading: "Student Services",
      bullets: [
        "Detailed insights into Indian colleges, courses and exams on our reliable career counselling website, recognised as the best site for career guidance.",
        "Thorough counsellor profiles from top study abroad consultants in India, covering experience, expertise and scheduling for personalised career guidance and counselling.",
        "Direct booking with the best abroad education consultants in India and key players among the top 10 educational consultants in India.",
        "Subscription options for sustained best counselling for abroad studies in India and comprehensive career guidance and counselling.",
        "Private, secure communication channels.",
      ],
    },
    {
      subheading: "Counsellor Opportunities",
      bullets: [
        "Create standout profiles positioning you within the top 10 educational consultants in India and as the best site for career guidance.",
        "Streamline appointment management while offering specialised career guidance and counselling.",
        "Engage students actively seeking the best abroad education consultants in India and top study abroad consultants in India.",
        "Implement subscription models for ongoing best counselling for abroad studies in India.",
        "Build meaningful, long-term partnerships via consistent career guidance and counselling.",
      ],
    },
    {
      heading: "Platform Highlights",
      paragraphs: [
        "💰 ProCoins Payment System — Efficient transactions using ProCoins (₹1 = 1 ProCoin), secured by Razorpay and streamlined for work with top study abroad consultants in India.",
        "🔒 Privacy First — Advanced security measures protect all career guidance and counselling exchanges with the best abroad education consultants in India.",
        "📚 Comprehensive Resources — An extensive database covering colleges, exams and admissions, drawing from the top 10 educational consultants in India and leaders in best counselling for abroad studies in India.",
      ],
    },
    {
      heading: "Company Background",
      paragraphs: [
        "Operated by CATALYSTAI TECHNOLOGY PRIVATE LIMITED, focused on technology-enabled education solutions. Subject to Indian regulations, with exclusive jurisdiction in Pune, Maharashtra.",
      ],
    },
    {
      heading: "Our Vision",
      paragraphs: [
        "To become India's most trusted platform for education counselling, where every student can access personalised guidance to unlock their full potential.",
      ],
    },
  ],
};

export const neetCutoffContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "NEET 2026 Cutoff: Round-wise Closing Ranks for Every MBBS College in India",
  intro:
    "Every year, lakhs of NEET aspirants ask the same question — 'With my rank, which MBBS college can I actually get, and in which counselling round?' The answer lives in the round-wise closing ranks. This free tool lets you look up the real NEET closing rank and closing score for any medical or dental college across all counselling rounds, for both All India Quota (AIQ) and state quota. It uses the latest completed NEET 2025 counselling data (plus 2024, 2023 and 2022) so you can plan your NEET 2026 MCC and state choice-filling with confidence instead of guesswork — and we update it as NEET 2026 rounds are announced.",
  sections: [
    {
      heading: "What 'round-wise cutoff' actually means",
      paragraphs: [
        "NEET UG counselling happens in multiple rounds — Round 1, Round 2, Round 3 (Mop-up) and a Stray Vacancy round for MCC, plus parallel rounds in each state's counselling. In every round, seats are allotted in order of merit, so the closing rank (the rank of the last student allotted a seat) drifts higher as later rounds open up more seats and candidates upgrade or drop out.",
        "That means a college that closed at rank 15,000 in Round 1 might close near 22,000 by the Mop-up round. Looking only at the Round 1 cutoff badly underestimates your real chances. Our analyzer shows you the closing rank for each round side by side, so you can see exactly how far a college opens up as counselling progresses.",
      ],
    },
    {
      heading: "AIQ vs State Quota cutoffs",
      paragraphs: [
        "15% of government seats go through the All India Quota (AIQ), open to candidates from every state, while 85% are filled through each state's own counselling under the state quota (SQ), usually reserved for domicile candidates. Cutoffs for the same college can differ sharply between AIQ and SQ — state quota often closes at a higher (easier) rank for local students.",
        "Use the Quota filter to switch between AIQ, State Quota, Management and NRI quotas, and the Category filter for General, EWS, OBC, SC, ST and PwD reservations, so the closing ranks you see match your exact counselling pool.",
      ],
    },
    {
      heading: "How to use the cutoffs to build a safe choice list",
      paragraphs: [
        "A smart NEET choice list mixes three kinds of colleges: ambitious (last round closing rank slightly better than your rank), realistic (closing rank close to your rank) and safe (closing rank comfortably worse than your rank). Read the round-wise columns to judge which bucket each college falls into for you.",
        "Once you have a shortlist, the hard part is ordering your preferences and understanding fees, bonds and campus life. That is where talking to someone who has been through it helps — ProCounsel connects you with verified seniors from these exact colleges and with counsellors who guide your MCC and state choice-filling end to end.",
      ],
    },
    {
      heading: "Data, accuracy and disclaimer",
      paragraphs: [
        "Closing ranks shown here are compiled from the latest published MCC and state counselling result sheets (2022–2025). They are an excellent guide to where a college is likely to close, but the exact cutoff each year depends on the number of candidates, paper difficulty, seat-matrix changes and reservation rules. Treat these numbers as planning guidance, not a guarantee of admission.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the NEET closing rank for MBBS in government colleges?",
      answer:
        "It varies widely by college, quota and category. Top central and state government colleges under General AIQ often close between roughly 1,000 and 20,000 in the later rounds, while many state government colleges under state quota close well beyond that for domicile candidates. Search a specific college above to see its exact round-wise closing rank for 2025 and earlier years.",
    },
    {
      question: "Does the NEET cutoff go up or down in later rounds?",
      answer:
        "The closing rank generally goes up (becomes easier) in later rounds, because more seats open through upgrades, resignations and mop-up. So if a college closed at rank X in Round 1, it may allot seats to higher ranks by Round 2, Round 3 or the stray-vacancy round.",
    },
    {
      question: "What is the difference between AIQ and state quota cutoffs?",
      answer:
        "All India Quota (15% of government seats) is open to everyone nationwide and usually has tighter cutoffs. State quota (85%) is mostly for domicile candidates of that state and often closes at an easier rank for locals. Use the Quota filter to compare both for any college.",
    },
    {
      question: "Can I predict my MBBS college from these cutoffs?",
      answer:
        "Yes — compare your NEET rank against the round-wise closing ranks for your category and quota. For an automatic, ranked list of colleges you can realistically get with an admission-probability score for each, use the ProCounsel NEET College Predictor.",
    },
    {
      question: "Are these NEET cutoffs official?",
      answer:
        "They are compiled from official MCC and state counselling result sheets published after each round (2022–2025). They are a reliable planning guide, but the current year's exact cutoff always depends on that year's candidates, difficulty and seat matrix.",
    },
  ],
};

export const coursesContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "Courses, Test Series & Live Classes for Every Exam and Goal",
  intro:
    "Learning doesn't fit into one mould, and neither do our courses. ProCounsel is an open platform where verified counsellors and educators publish courses across every stage of a student's journey — entrance exam preparation, board exams, foundation programs, skill-building and career readiness. Whether you're aiming for engineering, medical, management, design, law or a specific skill, you can find structured online courses, mock test series and live classes that match your goal.",
  sections: [
    {
      heading: "One Platform, Every Kind of Course",
      paragraphs: [
        "Instead of locking you into a single exam, ProCounsel brings a wide range of courses together in one place. You'll find preparation for national and state entrance exams such as JEE, NEET, MHT-CET and CUET, alongside board exam support, Class 11 and 12 programs, and early foundation courses for younger students.",
        "Beyond exams, counsellors also offer skill and career-focused courses — from coding and data skills to communication, aptitude and interview preparation — so learning continues well past a single admission season. The scope is intentionally broad: if it helps a student grow, it belongs here.",
      ],
    },
    {
      heading: "Learn From Verified Counsellors and Educators",
      paragraphs: [
        "Every course is created by counsellors and educators on the platform, each with their own teaching style, experience and specialisation. That means students can choose not just a subject, but a mentor whose approach actually works for them.",
        "For educators, ProCounsel is a place to package their expertise into courses, test series and live sessions, reach motivated students, and build a lasting reputation — without worrying about the technology behind delivery, payments or scheduling.",
      ],
    },
    {
      heading: "Test Series and Mock Tests That Show You Where You Stand",
      paragraphs: [
        "Practice is what turns knowledge into results. Across exams, you'll find full-length mock tests and topic-wise test series that build exam temperament — time management, accuracy and the confidence to handle pressure on the real day.",
        "The real value is in the analysis afterwards. Good test series break down your performance by subject, topic and time spent per question, so every attempt tells you exactly what to revise next instead of leaving you guessing.",
      ],
    },
    {
      heading: "Live Classes, Recorded Lessons and Flexible Learning",
      paragraphs: [
        "Different students learn differently. Some thrive in live, interactive classes where they can ask questions in real time; others prefer recorded lessons they can pause, rewind and revisit at their own pace. ProCounsel supports both, so learning fits around school, coaching and life rather than competing with them.",
        "This flexibility also makes quality teaching accessible far beyond big cities — a student anywhere can learn from an educator they'd never otherwise reach.",
      ],
    },
    {
      heading: "Choosing the Right Course for You",
      paragraphs: [
        "With so many options, the goal isn't to enrol in the most courses — it's to choose the right ones. The most useful question a student can ask is not \"Which course is the most popular?\" but \"Which course is right for me, my goals and my current level?\"",
        "That's where guidance matters. Alongside courses, ProCounsel connects students with counsellors who help map a learning path — what to start now, what can wait, and how each course fits the bigger picture of admissions and career goals.",
      ],
    },
  ],
  faqs: [
    {
      question: "What kinds of courses are available on ProCounsel?",
      answer:
        "A wide range — entrance exam preparation (such as JEE, NEET, MHT-CET and CUET), board and Class 11–12 programs, early foundation courses, full mock test series, and skill or career-focused courses like coding, aptitude and communication. The platform isn't limited to one exam; counsellors can publish almost any course that helps students.",
    },
    {
      question: "Who creates the courses?",
      answer:
        "Courses are created by verified counsellors and educators on ProCounsel, each with their own specialisation and teaching style. Students can pick a mentor whose approach suits them, not just a subject.",
    },
    {
      question: "Are the courses online, and can I learn at my own pace?",
      answer:
        "Yes. You'll find live interactive classes as well as recorded lessons you can watch anytime. This lets you learn flexibly around school and coaching, from anywhere in the country.",
    },
    {
      question: "Do you offer mock tests and test series?",
      answer:
        "Yes. Many courses include full-length mock tests and topic-wise test series with detailed analysis, so you can track progress and know exactly which areas to improve before your exam.",
    },
    {
      question: "How do I choose the right course?",
      answer:
        "Start from your goal and current level rather than popularity. If you're unsure, ProCounsel's counsellors can help you map a learning path — what to begin now, what can wait, and how each course fits your admission and career plans.",
    },
  ],
};

export const neetCounsellingContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "NEET UG 2026 Counselling: State-wise Authorities, Dates & Official Registration Links",
  intro:
    "After the NEET UG result, admission to MBBS and BDS seats happens through counselling — not directly through the exam. There are two parallel systems: the All India Quota (15% of government seats) run centrally by the Medical Counselling Committee (MCC), and the State Quota (85%) run by each state's own counselling authority. This page lists the official counselling authority and the direct registration website for the All India Quota and for every state and union territory, so you register on the right portal, on time, and never on a look-alike site.",
  sections: [
    {
      heading: "How NEET UG counselling works",
      paragraphs: [
        "NEET is only the qualifying and ranking exam. Your actual MBBS/BDS seat is decided in counselling, where you register, pay a fee, fill and lock a preference list of colleges, and are then allotted a seat based on your All India Rank, category and quota. Counselling runs in multiple rounds — Round 1, Round 2, a Mop-up round and a Stray Vacancy round for MCC, with parallel rounds in each state.",
        "15% of seats in government colleges (and 100% of seats in central institutions, AIIMS, JIPMER, AFMC, ESIC, BHU, AMU and all deemed universities) are filled by MCC through the All India Quota. The remaining 85% of government seats plus private college seats in each state are filled by that state's counselling authority under the state quota, usually for domicile candidates only.",
      ],
    },
    {
      heading: "All India Quota (MCC) vs State Quota counselling",
      paragraphs: [
        "For the All India Quota you register once on the MCC portal (mcc.nic.in) and can be allotted a government seat anywhere in India. For state quota you register separately with your home state's authority — for example KEA in Karnataka, CETCELL in Maharashtra, or the Directorate of Medical Education in most states — and you generally need a domicile certificate of that state.",
        "Most serious aspirants participate in both AIQ and their state counselling at the same time, because the two run on overlapping schedules and give you two independent chances at a seat. Register on every portal relevant to you before its deadline; each has its own fee, document list and choice-filling window.",
      ],
    },
    {
      heading: "Register only on official portals",
      paragraphs: [
        "Every link on this page points to the official government or university counselling website. Fake counselling and 'agent' sites are common around NEET season and can steal your money and documents. Always confirm you are on a .nic.in, .gov.in or the recognised university domain, never share your NEET roll number or password with an agent, and pay only on the official portal.",
        "Once you know which colleges are realistically in reach and how to order your choice list, talk to someone who has done it — ProCounsel connects you with verified MBBS seniors from these colleges and with counsellors who guide your MCC and state choice-filling step by step.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the difference between All India Quota and state quota counselling?",
      answer:
        "All India Quota (AIQ) covers 15% of government MBBS/BDS seats and is run centrally by MCC on mcc.nic.in — open to candidates from any state. State quota covers the other 85% of government seats plus state private colleges and is run by each state's own authority, usually for domicile candidates. You can and should participate in both.",
    },
    {
      question: "Which authority conducts NEET counselling in my state?",
      answer:
        "Each state has its own counselling body — for example KEA (Karnataka), CETCELL (Maharashtra), BCECEB (Bihar), KNRUHS (Telangana) and the Directorate of Medical Education in many states. Find your state in the table above for its name and the official registration link.",
    },
    {
      question: "Do I have to register separately for MCC and my state counselling?",
      answer:
        "Yes. AIQ (MCC) and state counselling are independent processes with separate registrations, fees and choice-filling windows. Register on each portal that applies to you before its own deadline.",
    },
    {
      question: "How do I avoid fake NEET counselling websites?",
      answer:
        "Use only the official links listed here. Genuine counselling portals are on government (.nic.in / .gov.in) or recognised university domains. Never pay an agent, and never share your NEET credentials outside the official portal.",
    },
    {
      question: "When does NEET UG 2026 counselling start?",
      answer:
        "Counselling begins a few weeks after the NEET UG 2026 result is declared. MCC publishes the AIQ schedule on mcc.nic.in and each state announces its own dates. Bookmark this page — we update the authorities and links as the 2026 schedule is released.",
    },
  ],
};

export const mbbsCollegesContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "MBBS Colleges in India 2026: State-wise List of Medical Colleges, Seats & Fees",
  intro:
    "India has more than 820 recognised MBBS colleges offering over 1.29 lakh seats across 34 states and union territories — government, central (AIIMS/JIPMER/ESIC), state, deemed and private. This directory lets you browse every medical college by state, with its affiliating university, management type, year of establishment and MBBS seat count, so you can research where you can realistically study before you fill your NEET counselling choices. Filter by state and college type, or search any college by name.",
  sections: [
    {
      heading: "Types of MBBS colleges in India",
      paragraphs: [
        "Medical colleges fall into a few broad categories. Central government institutions (AIIMS, JIPMER, ESIC, BHU, AMU, AFMC) are the most sought-after and admit entirely through the All India Quota. State government colleges offer the cheapest fees and fill 85% of their seats through state counselling for domicile candidates and 15% through AIQ.",
        "Private and deemed universities make up a large share of total seats; they have higher fees but also NRI and management quotas, and deemed universities admit fully through MCC. Use the College Type filter above to see only the category you are targeting — all types are shown by default.",
      ],
    },
    {
      heading: "How many MBBS seats are there, and where?",
      paragraphs: [
        "The states with the most MBBS seats include Karnataka, Uttar Pradesh, Tamil Nadu, Maharashtra, Telangana, Gujarat and Rajasthan, each with thousands of seats spread across dozens of colleges. Smaller states and union territories may have just one or two colleges. The per-state seat totals on this page give you a realistic sense of how many seats you're actually competing for in each region.",
        "Remember that a large number of seats does not automatically mean easier admission — it depends on how many candidates from that state are competing and on the AIQ/state-quota split. Pair this directory with the round-wise cutoff analyzer to see the closing ranks for the colleges you're interested in.",
      ],
    },
    {
      heading: "Using this directory to plan your NEET admission",
      paragraphs: [
        "Start by filtering to your home state and to government colleges to see your most affordable options, then widen to All India Quota targets and private colleges as a backup. Note each college's seats and management type, then cross-check its closing rank against your NEET rank before you lock your choice list.",
        "Choosing a college is about more than seats and cutoffs — fees, bond conditions, hostel, clinical exposure and city matter too. ProCounsel connects you with verified seniors studying at these colleges and with counsellors who help you build and order your NEET choice list the right way.",
      ],
    },
  ],
  faqs: [
    {
      question: "How many MBBS colleges and seats are there in India?",
      answer:
        "There are over 820 recognised MBBS colleges offering more than 1.29 lakh (129,000+) seats across 34 states and union territories, spanning central, state government, deemed and private institutions. Browse the state-wise list above for the exact college count and seat total in each state.",
    },
    {
      question: "Which state has the most MBBS seats?",
      answer:
        "Karnataka, Uttar Pradesh, Tamil Nadu and Maharashtra are among the states with the most MBBS seats, each offering well over ten thousand seats across many colleges. See the per-state summary above for exact numbers.",
    },
    {
      question: "What is the difference between government, deemed and private medical colleges?",
      answer:
        "Government colleges (central and state) have the lowest fees and admit through AIQ and state counselling. Deemed universities are private institutions that admit entirely through MCC's AIQ counselling and have higher fees. Private state colleges admit through state counselling with state, management and NRI quotas. Use the College Type filter to view each category.",
    },
    {
      question: "Can I get an MBBS seat with my NEET rank in these colleges?",
      answer:
        "That depends on the college's closing rank for your category and quota. Use this directory to shortlist colleges by state and type, then check their round-wise closing ranks in the NEET Cutoff Analyzer and get a ranked, probability-scored list from the NEET College Predictor.",
    },
    {
      question: "Are these medical colleges recognised by NMC?",
      answer:
        "The colleges listed are drawn from the recognised MBBS intake used for NEET UG counselling. Seat matrices can change year to year as the National Medical Commission (NMC) approves new colleges or revises seats, so always confirm the current seat count on the official counselling portal before choice-filling.",
    },
  ],
};

export const optionFormContent: {
  title: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaqItem[];
} = {
  title: "MHT-CET Option Form Filling: How CAP Choice Filling Actually Decides Your College",
  intro:
    "Your MHT-CET percentile only decides who you compete with. The seat you finally get is decided by the option form you submit in the CAP rounds — an ordered list of college-and-branch choices that the State CET Cell processes strictly in the order you wrote them. Every year students with a good percentile lose a good college because their list was short, badly ordered, or missing the quota that was theirs to take. This page explains how option form filling works, what to get right, and where an expert makes a measurable difference.",
  sections: [
    {
      heading: "What the MHT-CET option form is",
      paragraphs: [
        "Admission to engineering, pharmacy and allied courses in Maharashtra happens through the Centralised Admission Process (CAP) run by the State Common Entrance Test Cell on cetcell.mahacet.org. After registration and document verification, you fill an option form: a preference list where each entry is one college and one branch, written in the order you want them.",
        "The allotment engine works down your list. It checks your first choice, then your second, and stops at the first one where your percentile, category and quota clear that year's cutoff. It never looks at how much you wanted a college — only at where you placed it. That single mechanic is why the order of the list matters more than the length of it.",
        "CAP normally runs in three rounds, with institute-level rounds after them for seats still vacant. Your option form can be edited between rounds, which is the part most students never use — cutoffs move after every allotment, and a list that was right for Round 1 is rarely still right for Round 2.",
      ],
    },
    {
      heading: "Home university quota: the seat most students give away",
      paragraphs: [
        "For Maharashtra State candidates, seats in government and aided engineering colleges are split between Home University and Other Than Home University candidates, with roughly 70% reserved for the home-university side. Which university region you belong to is decided by where you completed your qualifying examination, not by where you live now.",
        "This is the cheapest, least competitive seat you will ever be offered, and it is routinely buried below aspirational out-of-region choices that were never going to open at that percentile. A well-built option form places home-university choices where they can actually be caught, without giving up on the reach choices above them.",
      ],
    },
    {
      heading: "How many choices to fill, and in what order",
      paragraphs: [
        "There is no advantage in a short list. Filling fifteen dream colleges and stopping is the most common mistake in MHT-CET choice filling — one round moves against you and there is nothing underneath to catch you. A complete list runs from genuine reach options at the top, through realistic ones in the middle, down to safe options you would still be content to accept.",
        "The order should follow your admission probability and your own priorities — branch first or college first, fee ceiling, distance from home — not a magazine ranking. Two students with identical percentiles routinely land in very different colleges purely because one list was ordered against last year's closing percentiles and the other was ordered by reputation.",
      ],
      bullets: [
        "Reach choices: colleges that opened slightly above your percentile last year",
        "Realistic choices: colleges whose closing percentile sits around yours across recent rounds",
        "Safe choices: colleges that closed comfortably below your percentile, including home-university seats",
        "Never leave a branch you would accept off the list only because the college is not famous",
      ],
    },
    {
      heading: "Reading last year's cutoffs correctly",
      paragraphs: [
        "Cutoff lists are published per college, per branch, per category and per round — and the same college can close at very different percentiles in Round 1 and Round 3. Comparing your percentile against a single Round 1 figure is what makes a list look safe when it is not.",
        "Category matters as much as the number. An Open closing percentile tells you nothing about the seat available to a candidate in a reserved category, and vice versa. Cutoffs also shift with seat-matrix changes, new colleges and the number of candidates who accept and freeze early in the process.",
      ],
    },
    {
      heading: "What ProCounsel does on your option form",
      paragraphs: [
        "A counsellor speaks with you first — branch priority, budget, how far from home you are willing to go, whether you would repeat a year for a specific branch. Only then is the list built, college by college, with a reason attached to each position, and filled and verified with you before the CAP deadline.",
        "If you have already filled a form yourself, an expert revision reviews it line by line, adds the colleges and branches you have missed, and corrects the order against this year's cutoff movement.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is option form filling in MHT-CET?",
      answer:
        "It is the choice-filling step of the Maharashtra CAP process. After registering and verifying documents on cetcell.mahacet.org, you submit an ordered list of college-and-branch preferences. The allotment engine works down that list in order and gives you the first choice whose cutoff you clear, so the order of the list decides your college.",
    },
    {
      question: "How many options should I fill in the MHT-CET option form?",
      answer:
        "As many as you would genuinely accept. There is no penalty for a long list and no benefit to a short one. Include reach, realistic and safe choices — students who fill only their dream colleges are the ones left without a seat when cutoffs move against them.",
    },
    {
      question: "Can I change my option form after submitting it?",
      answer:
        "Yes. The option form can be edited between CAP rounds, within each round's editing window. Because cutoffs shift after every allotment, reordering your list between rounds is one of the biggest levers you have — and the one students use least.",
    },
    {
      question: "What is the home university quota in MHT-CET?",
      answer:
        "Seats in government and aided colleges are split between Home University and Other Than Home University candidates, with roughly 70% for home-university candidates. Your university region is decided by where you completed your qualifying exam. These are usually the least competitive seats available to you, so they belong on your list in a position where they can actually be allotted.",
    },
    {
      question: "How much does MHT-CET option form filling help cost at ProCounsel?",
      answer:
        "A complete option form built from scratch by a counsellor, and an expert revision of a form you have already filled, are both one-time payments made from your ProCounsel wallet — the current prices are shown on this page. A counsellor contacts you on call or WhatsApp within 4 hours of payment.",
    },
    {
      question: "Do I still need help if I have a very high percentile?",
      answer:
        "A high percentile widens your options but does not order them. Branch-versus-college trade-offs, fee differences between autonomous and aided institutes, and home-university seats all still apply. The higher the percentile, the more a badly ordered list costs you.",
    },
  ],
};
