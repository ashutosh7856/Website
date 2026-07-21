import type { SeoSection, SeoFaqItem } from "./SeoArticle";

/**
 * Long-form, keyword-rich page content sourced from the ProCounsel SEO brief.
 * Rendered via <SeoArticle /> to give each page real content depth for SEO
 * and ad-network review.
 */

export const homeContent: { title: string; intro: string; sections: SeoSection[] } = {
  title: "Every Student's Journey Is Different. Their Guidance Should Be Too.",
  intro:
    "A few years ago, students complained that they couldn't find enough information. Today, the complaint is completely different — there's too much information. A student looking for engineering admission can spend hours watching videos, reading articles, comparing colleges, checking cut-offs and scrolling through social media, and end up more confused than when they started.",
  sections: [
    {
      paragraphs: [
        "We've seen this happen repeatedly at ProCounsel. Students come to us after speaking with friends, relatives, teachers, coaching institutes, and sometimes even strangers on the internet. Everyone has advice. Everyone has an opinion. The difficult part is figuring out which advice actually applies to them.",
        "One student may be interested in engineering but unsure about the branch. Another may be considering management, design, law, healthcare, or studying abroad. Some know exactly what they want. Others are still trying to understand where they fit. That's one reason career guidance for students matters more today than it did a decade ago. The challenge isn't finding information — it's filtering it.",
        "Information creates awareness. Conversations create clarity. That's where career counselling services become valuable. Not because counsellors have all the answers, but because they help students think differently about the questions they're asking. Students are also increasingly comfortable with career counselling online, connecting with experienced mentors and counsellors regardless of where they live.",
      ],
    },
    {
      heading: "What We Notice Every Admission Season",
      paragraphs: [
        "Every admission season starts the same way. Students are optimistic, parents are excited, and everyone feels prepared. Then the deadlines, counselling rounds, cut-offs and application processes begin — and that's usually when the confusion starts.",
        "B Tech registration dates, counselling rounds, seat allotments, document verification, college comparisons, entrance exam results — it's a lot to manage at the same time. This is where university admission support becomes valuable. Not because students can't fill forms themselves, but because understanding the bigger picture is the real challenge.",
        "We've worked with students exploring BTech admission opportunities across India. Some were targeting top engineering colleges; others were looking for alternatives after entrance exam results didn't go as planned. The common factor was rarely marks — it was uncertainty about whether they were making the right choice.",
      ],
    },
    {
      heading: "Not Every Student Wants The Same Future",
      paragraphs: [
        "One of the biggest mistakes people make is assuming every student should follow a similar path. Reality looks very different. We've spoken with students who wanted to build technology startups, become psychologists, pursue research, or work in business, healthcare, design and public policy.",
        "The challenge isn't that students lack ambition. It's figuring out which path genuinely aligns with who they are. That's where career coaching services become valuable — not because anyone can predict the future, but because they help students understand their strengths, interests and motivations. The best career coaching services don't start with recommendations. They start with conversations.",
      ],
    },
    {
      heading: "Opportunities Today Go Beyond Borders",
      paragraphs: [
        "A decade ago, most students focused only on local colleges. Today, students have access to opportunities around the world — international degrees, research opportunities, specialised programs and global exposure. Studying abroad is a decision that deserves careful planning.",
        "A good study abroad consultant in India doesn't begin by recommending countries. They begin by understanding the student: What are their goals? What is their budget? What kind of experience are they looking for? For families searching for the best study abroad consultants in India, the real value is finding someone who asks the right questions before recommending a destination. The right opportunity isn't always the most popular one — it's the one that's right for you.",
      ],
    },
  ],
};

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
