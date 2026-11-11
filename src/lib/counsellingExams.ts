import type { CounsellingCategory } from "@/lib/counsellingCategories";

/**
 * Exam-specific counselling landing pages — `/mht-cet-counselling`,
 * `/jee-counselling`, `/cat-counselling`, ...
 *
 * These sit one level below the category pages (`/engineering-counselling`)
 * and serve a narrower, later-stage intent: someone who already has a result
 * in front of them and is asking "what do I do with this rank". A category
 * page answers "should I do engineering"; an exam page answers "how does CAP
 * choice filling work and how should I order my preferences".
 *
 * Why separate pages rather than sections on the category page, which is what
 * `counsellingCategories.ts` argues for: these are not thin keyword splits.
 * Each page below is a full 1,000+ word answer to a distinct process — CAP
 * rounds, JoSAA, COMEDK choice filling and MBA applications genuinely differ —
 * and a student searching "wbjee counselling registration" is not served by a
 * paragraph inside a general engineering page. Thin pages were the original
 * problem; length and specificity are the fix, not fewer URLs.
 *
 * They reuse `CounsellingCategory` wholesale so one page component, one set of
 * schema and one CTA path serve both tiers. `expertise` maps each exam to the
 * counsellor specialisation its CTA should filter by.
 *
 * Editorial rule, same as the category pages: no invented dates, cut-offs,
 * fees, rankings or admission guarantees. Every page tells students to check
 * the current official notification, because that is both true and the only
 * advice that stays correct after this year's cycle.
 */

const ENGINEERING_EXPERTISE = ["Engineering", "Diploma in Engineering", "Polytechnic"];
const MBA_EXPERTISE = ["MBA", "BBA", "Banking and Finance"];

export const COUNSELLING_EXAMS: CounsellingCategory[] = [
  {
    slug: "mht-cet-counselling",
    name: "MHT CET Counselling",
    primaryIntent:
      "Understand the MHT CET CAP process and get help filling the option form and ordering college and branch preferences",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "mht cet engineering admission",
      "mht cet option form",
      "mht cet cap counselling",
      "admission process for engineering through mht cet",
      "mht cet engineering application form",
      "mht cet for b tech",
    ],
    exams: [{ name: "MHT CET", full: "Maharashtra Common Entrance Test" }],
    leadOffer: "Free option form review before you lock your CAP preferences",
    tools: [
      { label: "MHT CET college predictor", to: "/mhtcet-college-predictor" },
      { label: "Option form filling help", to: "/mhtcet-option-form-filling" },
    ],
    cities: ["mumbai", "pune", "nagpur", "nashik"],
    priority: "core",
    title: "MHT CET Counselling 2026 – CAP Process, Dates & Admission Guide | ProCounsel",
    description:
      "Get complete MHT CET Counselling 2026 guidance covering CAP rounds, counselling process, college selection, choice filling, important dates and engineering admissions in Maharashtra.",
    h1: "MHT CET Counselling 2026 – CAP Process, Dates & Admission Guide",
    intro:
      "You have your MHT CET result. Great. But then comes the question almost every student asks: “Now what?” Getting your percentile is only the first part. You still have to figure out which colleges you can apply to, which engineering branches make sense for you, how the CAP process works, and most importantly, how to fill your choices without making a decision you may regret later. You may hear one thing from a friend, something different from a relative, and find another answer online. That is why understanding MHT CET counselling before filling your choices can make the whole process much easier.",
    sections: [
      {
        heading: "What is MHT CET counselling?",
        paragraphs: [
          "MHT CET counselling is the process through which eligible students take part in Maharashtra's Centralised Admission Process, commonly called CAP, for engineering admissions.",
          "During MHT CET CAP counselling, students register, complete the required formalities, check the merit list, fill their preferred colleges and branches, and then wait for seat allotment.",
          "Your allotment is not based only on your MHT CET percentile. Other things can matter too — your category, eligibility, preferences and the seats available when allotment takes place. So do not look at counselling as simply “my percentile is X, so I will definitely get college Y”. It does not work that neatly, and your preference list can make a real difference.",
        ],
      },
      {
        heading: "What happens after the result?",
        paragraphs: [
          "Once the entrance exam result is available, students generally move towards the admission process. The broad journey looks like this: result, CAP registration, document verification, merit list, option or choice filling, seat allotment, seat acceptance and reporting, then further CAP rounds if applicable. That is the basic flow of MHT CET engineering admission.",
          "The exact process, dates, eligibility rules and instructions can change from year to year. For 2026 admissions, always check the latest notification issued by the Maharashtra CET Cell before taking any important step. Do not rely on an old video or a screenshot someone forwarded on WhatsApp.",
        ],
      },
      {
        heading: "The application form is not CAP registration",
        paragraphs: [
          "There is an important difference that often confuses students. Applying for the MHT CET examination is not the same thing as taking part in the admission process after the result.",
          "The MHT CET engineering application form relates to the entrance examination. Later, eligible students have to follow the applicable admission and CAP registration process.",
          "When completing any application or registration, check your details carefully. Your name, academic information and category details where applicable should match the required documents. A small mistake in an application can create unnecessary problems later.",
        ],
      },
      {
        heading: "How the MHT CET option form works",
        paragraphs: [
          "The MHT CET option form is one of the most important parts of counselling. Think of it as telling the system: “if these options are available to me, this is how I would like to be considered”.",
          "Suppose you are interested in Computer Science, IT and AI or Data Science. You may have several combinations of those branches across different engineering colleges. Do not simply copy your friend's list — they may have a different percentile, category, budget or career preference. Maybe your friend wants Computer Science at any cost, while you would happily choose IT at a college closer to home. Neither decision is automatically right or wrong.",
          "Before filling the option form, think about branch, college, fees, location and your career plans together rather than one at a time.",
        ],
      },
      {
        heading: "The admission process for engineering through MHT CET",
        bullets: [
          "Check your eligibility for the course and admission route.",
          "Register for CAP as per the official schedule.",
          "Complete the required document-related formalities.",
          "Check the provisional and final merit lists.",
          "Fill and confirm your college and branch preferences.",
          "Check your seat allotment.",
          "Accept the allotted seat according to the applicable rules.",
          "Report to the institute when required.",
          "Take part in later CAP rounds if you are eligible and want to explore more options.",
        ],
        paragraphs: [
          "The important thing is not to treat every year's process as identical. Dates and rules can change, so follow the official 2026 instructions.",
        ],
      },
      {
        heading: "Choosing colleges and branches for B.Tech",
        paragraphs: [
          "A good percentile is exciting, but do not let it make the decision on its own. Students looking at MHT CET for B Tech should start with what they actually want to study, then look at the colleges offering that branch.",
          "Compare the course and curriculum, college recognition, fees, location and travel, infrastructure, faculty, internship opportunities, placement information, campus environment, industry exposure and your own career interests.",
          "Getting a particular college may sound impressive, but if the branch you really want is not available there, think carefully before placing it above another option. There is no single best engineering college for every student.",
        ],
      },
      {
        heading: "CAP rounds and seat allotment",
        paragraphs: [
          "CAP rounds are the stages through which eligible students are considered for available seats, based on the applicable rules, merit, preferences and seat availability. This is why two students with similar percentiles may not receive the same college and branch.",
          "After an allotment, do not panic and do not assume everything is over. Read the instructions for that particular round and understand what you need to do — whether that means accepting a seat, reporting, or taking part in a later round.",
        ],
      },
      {
        heading: "Common mistakes students make",
        paragraphs: [
          "A few mistakes come up again and again. Students fill choices without properly checking the colleges. Some put only a handful of options. Others copy a friend's preference list without considering their own interests. Another common mistake is looking only at the college name and ignoring the branch.",
          "Do not forget practical things either — fees, travelling distance, hostel requirements and your family's budget all matter. And please do not leave registrations or document work until the last day. Most importantly, do not assume something you heard in a WhatsApp group is automatically correct.",
        ],
      },
      {
        heading: "How to build a preference list",
        paragraphs: [
          "One simple way is to divide your choices into three groups: dream choices you would really like even if they are competitive, realistic choices based on your percentile and category, and safer choices where you have a better chance and would still be comfortable studying.",
          "But “safe” does not mean choosing a college you do not want just because you think you might get it. Ask yourself: if I actually get this seat, will I be happy studying here for four years? That question is surprisingly useful.",
        ],
      },
      {
        heading: "Important dates for 2026",
        paragraphs: [
          "The exact 2026 CAP schedule should be followed from the official Maharashtra CET Cell notification. CAP registration, document verification, the provisional and final merit lists, option form filling, each CAP round and reporting to the institute are all announced there.",
          "Do not use dates from an older admission cycle as though they apply to 2026.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is MHT CET CAP counselling?",
        answer:
          "It is the Centralised Admission Process through which eligible students take part in engineering admissions in Maharashtra according to the applicable admission rules.",
      },
      {
        question: "Is MHT CET required for B.Tech admission in Maharashtra?",
        answer:
          "MHT CET is an important route for engineering admissions in Maharashtra, but eligibility and admission routes can vary. Check the current official rules for your particular case.",
      },
      {
        question: "What is the MHT CET option form?",
        answer:
          "It is used to submit your preferred college and branch choices during the applicable CAP process. The order of your preferences matters.",
      },
      {
        question: "How does MHT CET seat allotment work?",
        answer:
          "Seat allotment depends on the applicable admission rules, merit, your preferences, category, eligibility and the availability of seats.",
      },
      {
        question: "Can I change my preferences during counselling?",
        answer:
          "This depends on the particular CAP round and the rules in force that year. Always check the official instructions before making changes.",
      },
      {
        question: "What happens after seat allotment?",
        answer:
          "You need to follow the instructions for that round, which may include accepting the seat, completing required formalities and reporting to the allotted institute.",
      },
      {
        question: "How do I choose the right engineering college?",
        answer:
          "Do not look only at the college name. Compare the branch, fees, location, academic environment, available facilities, career opportunities and your own preferences.",
      },
    ],
  },

  {
    slug: "comedk-counselling",
    name: "COMEDK Counselling",
    primaryIntent:
      "Understand the COMEDK counselling process and get help choosing colleges and branches after the COMEDK rank",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "comedk counselling",
      "comedk counselling process",
      "comedk counselling registration",
      "comedk online counselling",
      "comedk registration for counselling",
      "comedk exam counselling",
    ],
    exams: [
      {
        name: "COMEDK UGET",
        full: "Consortium of Medical, Engineering and Dental Colleges of Karnataka \u2014 Undergraduate Entrance Test",
      },
    ],
    leadOffer: "Free COMEDK college shortlist based on your rank and preferred branch",
    tools: [],
    cities: ["bangalore", "mysore", "mangalore"],
    priority: "growth",
    title: "COMEDK Counselling 2026 \u2013 College Selection & Admission Guide | ProCounsel",
    description:
      "Get complete COMEDK counselling 2026 guidance for college selection, choice filling, counselling process, fees, cutoffs and engineering admissions through COMEDK.",
    h1: "COMEDK Counselling 2026 \u2013 College Selection & Admission Guide",
    intro:
      "You have your COMEDK rank. Finally, one big part is over. But then the questions start. Which college can I get? Should I choose Computer Science or take another branch at a better college? How many colleges should I put in my list? You may open five different websites and find five different opinions. Your friend may say “put this college first”. Someone may send you last year\u2019s cut-off list and tell you that you have a sure chance. But your COMEDK rank, preferred branch, budget, location and career plans are your own, which is why counselling should not be treated as simply filling a form and waiting for a seat.",
    sections: [
      {
        heading: "Start with the right question",
        paragraphs: [
          "Getting admission into an engineering college is important, but choosing the right option needs more thought than looking at the college name. Suppose you have to choose between Computer Science at one college and Electronics at another. Which one is better? There is no universal answer.",
          "One student may strongly prefer Computer Science and be willing to compromise on location. Another may prefer Electronics because it matches their interests. Someone else may have a fixed budget. Instead of asking only “which college can I get?”, try asking “which of the colleges I can get actually make sense for me?”",
        ],
      },
      {
        heading: "Where education counselling helps",
        paragraphs: [
          "After the exam, students often know their rank but not what to do with it. A counsellor can help you understand the admission process, look at suitable engineering colleges, compare branches and organise your options before you start filling preferences.",
          "This is especially useful if you are hearing different advice from different people. Instead of following a friend\u2019s preference list, you can look at your own rank, eligibility, preferred branch, budget and location. The goal is not to hand every student the same “best college” \u2014 it is to help you understand your own realistic choices.",
        ],
      },
      {
        heading: "The COMEDK counselling process",
        paragraphs: [
          "The exact procedure can change from one admission year to another, so always check the official COMEDK notification for 2026.",
          "Broadly, the process involves the counselling notification, registration, document or candidate verification requirements, choice filling, submission or locking of choices where applicable, seat allotment, seat acceptance or fee payment as applicable, reporting and admission formalities, and further rounds if applicable.",
          "Think of it this way: your rank tells you where you stand, but your choices tell the counselling system what you want. That is why choice filling deserves careful attention.",
        ],
      },
      {
        heading: "Registration and online counselling",
        paragraphs: [
          "COMEDK counselling registration is an important step after the entrance examination. Do not assume that registering for the COMEDK exam automatically means you have completed every step required for counselling \u2014 COMEDK registration for counselling is a separate part of the admission process.",
          "Before registering, keep your relevant academic and admission documents ready and check the information you enter. Avoid rushing simply because your friends have already finished. If you are taking part in COMEDK online counselling, keep an eye on official announcements and deadlines. A missed deadline can create a problem that a little planning would have avoided.",
        ],
      },
      {
        heading: "COMEDK exam counselling: colleges, fees and cut-offs",
        paragraphs: [
          "Students often become very focused on COMEDK cut-offs. That is understandable, but last year\u2019s cut-off is not a promise for this year. Cut-offs can change depending on demand, available seats, branch, counselling round and other factors.",
          "Instead of thinking “last year the cut-off was X, so I will definitely get it”, think “my rank appears to make this worth considering, but I should keep other realistic options too”. Also look at fees before making your preference list, rather than discovering after allotment that a college does not suit your budget.",
        ],
      },
      {
        heading: "Choosing your branch",
        paragraphs: [
          "Choosing an engineering branch because everyone says it has “scope” can be risky. Before putting a branch high on your list, ask whether you understand what you will study, whether you find the subjects interesting, and whether you are choosing it because you want it or because your friends are.",
          "Computer Science, Information Science, Electronics, Electrical, Mechanical and Civil have different subjects and career directions. You do not need your entire career figured out at 17 or 18, but you should understand what you are choosing.",
        ],
      },
      {
        heading: "A step-by-step way to decide",
        bullets: [
          "Understand your rank and confirm which admission options you are eligible for.",
          "Decide which branches genuinely interest you, and rank them.",
          "Consider budget and location, including hostel and travel costs.",
          "Shortlist realistic colleges rather than assuming every popular college is possible.",
          "Compare colleges and branches together, not college names alone.",
          "Arrange your preference list with your most preferred realistic options at the top.",
          "Understand the counselling stages, including registration, choice filling and allotment.",
          "Read the instructions carefully once you receive an allotment.",
        ],
      },
      {
        heading: "Common mistakes",
        paragraphs: [
          "Students sometimes fill choices without researching the colleges, copy a friend\u2019s list, or select only a handful of options because they are worried about getting a lower preference. Another common mistake is ignoring branch preference altogether.",
          "Some students forget to check eligibility, enter information incorrectly or miss an important deadline. And do not assume the first allotment is necessarily the end of the process \u2014 depending on the rules and rounds, there may be further opportunities. The simple rule is to read the instructions for the specific round you are taking part in.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is COMEDK counselling?",
        answer:
          "It is the admission process through which eligible candidates take part in college and branch allotment based on the applicable rules, their preferences, rank and available seats.",
      },
      {
        question: "When does COMEDK counselling registration start?",
        answer:
          "The dates change each year. Check the official COMEDK counselling notification for the 2026 schedule rather than relying on old dates.",
      },
      {
        question: "What does the COMEDK counselling process involve?",
        answer:
          "Generally registration, required verification or documentation, choice filling, seat allotment, acceptance or fee-related steps and admission formalities, depending on that year\u2019s rules.",
      },
      {
        question: "Is COMEDK counselling conducted online?",
        answer:
          "COMEDK uses an online counselling process for the relevant stages. Follow the official instructions carefully for each stage and deadline.",
      },
      {
        question: "How should I choose colleges during COMEDK counselling?",
        answer:
          "Start with your rank and preferred branches, then compare colleges on academics, fees, location, infrastructure, internships, placement trends and your own priorities.",
      },
      {
        question: "Are COMEDK cut-offs the same every year?",
        answer:
          "No. They can change based on demand, available seats, branch, counselling round and the overall admission scenario.",
      },
      {
        question: "Can a counsellor help me choose my college and branch?",
        answer:
          "Yes. A counsellor can help you compare your realistic options and think through college, branch, budget and career preferences. Counselling cannot guarantee a particular college or seat.",
      },
    ],
  },
  {
    slug: "jee-counselling",
    name: "JEE Counselling",
    primaryIntent:
      "Understand JoSAA and state counselling after JEE Main and get help ordering college and branch choices",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "jee admission counselling",
      "jee counselling process",
      "jee mains counselling",
      "state counselling for jee mains",
      "all counselling after jee mains",
      "counseling after jee mains",
    ],
    exams: [
      { name: "JEE Main", full: "Joint Entrance Examination — Main" },
      { name: "JEE Advanced", full: "Joint Entrance Examination — Advanced" },
      { name: "JoSAA", full: "Joint Seat Allocation Authority" },
    ],
    leadOffer: "Free JoSAA choice-list review before you lock your preferences",
    tools: [
      { label: "JEE college predictor", to: "/jee-college-predictor" },
      { label: "JEE rank predictor", to: "/jee-rank-predictor" },
    ],
    cities: ["delhi", "mumbai", "pune", "bangalore", "kota"],
    priority: "core",
    title: "JEE Counselling 2026 – College Selection & Admission Guide | ProCounsel",
    description:
      "Get expert JEE counselling 2026 guidance for college selection, JoSAA counselling, choice filling, cutoffs, branch selection and engineering admissions based on your JEE rank.",
    h1: "JEE Counselling 2026 – College Selection & Admission Guide",
    intro:
      "Your JEE Main result is finally out. You check your percentile, then your rank, and for a little while you feel relieved. Then someone asks: “So, which college are you getting?” And suddenly you are confused again. You know your rank, but not what it actually means for your options. Should you go through JoSAA? Is there state counselling too? Which branch should you choose? If those questions are running around in your head, you are not alone — the period after JEE Main can be almost as confusing as the preparation itself.",
    sections: [
      {
        heading: "Ask one more question than everyone else",
        paragraphs: [
          "Do not start counselling by asking only “which college can I get?” Ask one more: “which of the colleges I can get actually makes sense for me?” Those are different questions.",
          "Suppose two students have almost the same rank. One wants Computer Science and is willing to move to another city. The other wants to stay closer to home and is happy to consider Electronics or Mechanical. They may end up with completely different preference lists, and that is fine.",
          "It is very easy to get influenced by friends, relatives or coaching groups. Someone says “put this college first”. Another says “do not take that branch”. Before you know it, you are filling choices based on everybody else’s opinions. Your preference list should be based on your situation.",
        ],
      },
      {
        heading: "Turning a rank into a college list",
        paragraphs: [
          "After JEE Main, many students know their rank but do not know how to turn it into a practical list. This is where JEE admission counselling becomes useful: a counsellor can help you understand which routes may apply, which colleges and branches to explore, and how to compare them.",
          "Previous cut-off trends can give useful context — if a college closed at a particular rank last year, that tells you something. But it should not be treated as a guarantee that you will get the same college at the same rank this year. The goal is a realistic picture of your options rather than hopes pinned on one college.",
        ],
      },
      {
        heading: "The JEE counselling process",
        paragraphs: [
          "The process can look complicated when you first see the instructions, but the idea is straightforward: JEE Main result, identify eligible counselling routes, registration, choice filling, choice locking or submission, seat allotment, seat acceptance or further action, then reporting and admission.",
          "For eligible candidates, JoSAA counselling is one important route for the participating institutes. But do not assume every JEE Main student follows exactly the same process — depending on your situation you may also need to look at state counselling or other applicable admission routes.",
          "And do not rely completely on last year’s instructions. Dates, eligibility requirements, participating institutes and procedures can change, so check the latest official notification for the relevant admission year.",
        ],
      },
      {
        heading: "Is JoSAA your only option?",
        paragraphs: [
          "When students search for JEE Mains counselling, they usually want to know what happens after getting their rank. The answer depends on where you want to apply.",
          "JoSAA is one major route. Some states run their own admission processes, and other institutions may have separate procedures where applicable. So instead of asking “what is the one counselling process for JEE Main?”, ask “which counselling routes am I eligible for, and which ones include the colleges I am interested in?” That question gives you a far more useful answer.",
        ],
      },
      {
        heading: "State counselling for JEE Main",
        paragraphs: [
          "State counselling for JEE Mains can be relevant if you are looking at engineering colleges through a particular state’s admission system. But do not assume every state follows the same rules.",
          "Eligibility can depend on things such as domicile, academic qualifications, JEE Main performance, category and the participating colleges. Being eligible for a state process does not automatically mean you are eligible for every seat or college within it. Read the current official rules before registering.",
        ],
      },
      {
        heading: "All the counselling routes after JEE Main",
        paragraphs: [
          "If you have searched for all counselling after JEE Mains, you are probably trying to make sure you do not miss an admission opportunity. That is a sensible concern, but there is no universal list that applies to every student.",
          "Depending on your situation you may need to explore JoSAA, state counselling, other relevant central or state routes, and institution-specific admission processes. Start with your own eligibility and target colleges — do not register for a process just because somebody posted a link in a WhatsApp group.",
        ],
      },
      {
        heading: "Choosing a branch, not just a college",
        paragraphs: [
          "You spend months preparing for JEE, and then the discussion suddenly becomes “which college has the highest cut-off?” That is not enough. Computer Science, Information Technology, Electronics and Communication, Electrical, Mechanical, Civil and other specialised branches lead in different directions.",
          "Do not select a branch only because everyone says it has scope. Ask whether you actually like the subjects you will be studying. If you enjoy coding and problem solving, a computing branch may suit you. If you enjoy electronics and circuits, ECE may be worth exploring. You do not need to know what job you will do at 25, but you should have some idea of what you do not mind studying for four years.",
        ],
      },
      {
        heading: "Comparing colleges properly",
        paragraphs: [
          "Do not answer “which college should I put first?” by looking at the name. Check the branch you are likely to get, fees, location, infrastructure, faculty, internship opportunities, placement trends, campus environment and recognition or accreditation where relevant.",
          "Think practically too. If two colleges are similar but one means moving across the country and costs significantly more, is that difference worth it for you? And then there is the classic dilemma: your preferred branch at a slightly different college, or a different branch at a college you like more. There is no formula — it depends on which matters more to you.",
        ],
      },
      {
        heading: "Counseling after JEE Mains: mistakes that are easy to avoid",
        paragraphs: [
          "Students sometimes fill choices without understanding the branches, copy a friend’s preference list, or list only famous colleges without enough realistic options. Some forget to check fees or location until after allotment.",
          "Another common mistake is treating last year’s cut-off as a fixed rule for this year. It is not. And please do not leave registration until the final few hours — rushing while entering important information is the last thing you need. Listen to advice from family, but make sure you understand and agree with the final choice.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is JEE counselling?",
        answer:
          "It is the process through which eligible students use their JEE performance and preferences to take part in engineering admissions through the applicable counselling authorities.",
      },
      {
        question: "What is the JEE counselling process after JEE Main?",
        answer:
          "It generally involves identifying eligible counselling routes, registration, choice filling, seat allotment and completing the required acceptance or admission formalities.",
      },
      {
        question: "Is JoSAA the only counselling option after JEE Main?",
        answer:
          "No. Depending on your eligibility and target colleges, state-level and other applicable admission processes may also be available.",
      },
      {
        question: "What is state counselling for JEE Main?",
        answer:
          "It refers to state-level admission processes that may use JEE Main scores for eligible engineering admissions. The rules vary from one state to another.",
      },
      {
        question: "How should I fill my JEE counselling choices?",
        answer:
          "Do not simply arrange colleges by popularity. Consider your preferred branch, rank, college, fees, location and career interests. A balanced list is usually more sensible than one made entirely of dream options.",
      },
      {
        question: "Can I take part in different counselling processes after JEE Main?",
        answer:
          "You may be able to take part in several applicable processes, but eligibility and rules differ. Check each counselling authority’s current instructions before registering.",
      },
      {
        question: "Are previous-year JEE cut-offs reliable?",
        answer:
          "They are useful for understanding past trends, but they cannot guarantee your current-year allotment.",
      },
      {
        question: "Should I choose college or branch first?",
        answer:
          "It depends on you. If you are very clear about your branch, you may prioritise it. If the college environment matters more, you may prioritise the college. Think about both before making your list.",
      },
    ],
  },
  {
    slug: "wbjee-counselling",
    name: "WBJEE Counselling",
    primaryIntent:
      "Understand the WBJEE counselling process and get help with registration, choice filling and college selection in West Bengal",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "wbjee counselling",
      "wbjee counselling process",
      "counseling for wbjee",
      "registration for counselling of wbjee online",
      "wbjee admission process",
      "wbjee counselling registration",
    ],
    exams: [{ name: "WBJEE", full: "West Bengal Joint Entrance Examination" }],
    leadOffer: "Free WBJEE preference-list review before you lock your choices",
    tools: [],
    cities: ["kolkata"],
    priority: "growth",
    title: "WBJEE Counselling 2026 – College Selection & Admission Guide | ProCounsel",
    description:
      "Get expert WBJEE counselling 2026 guidance for college selection, choice filling, counselling process, cutoffs, seat allotment and engineering admissions in West Bengal.",
    h1: "WBJEE Counselling 2026 – College Selection & Admission Guide",
    intro:
      "Your WBJEE result is out. You have your rank in front of you, maybe you have already checked a few cut-off lists, and now the questions have started. Which college can I get? Should I choose CSE at a different college or my preferred branch at a better-known one? What if I do not get my first choice? Honestly, this is where things can get more confusing than the exam itself. A WBJEE rank is an important milestone, but it is only the starting point — now you have to turn it into actual college and branch choices.",
    sections: [
      {
        heading: "College selection is not a competition",
        paragraphs: [
          "One of the first mistakes students make after getting their rank is treating college selection like a race. Someone says “this is the best college”. A friend says “take CSE, nothing else matters”. Then a relative sends a cut-off list on WhatsApp and that becomes the basis for the whole decision.",
          "But your rank, preferred branch, budget, location, academic interests and career plans all matter. Two students with similar ranks might make completely different choices — one determined to study Computer Science, another interested in Electronics and a particular college environment. Neither is automatically right or wrong.",
        ],
      },
      {
        heading: "Information is not the same as clarity",
        paragraphs: [
          "After WBJEE, students usually have plenty of information but not necessarily clarity. You may have ten different college lists open and still wonder which ones actually make sense for you.",
          "Counselling can help you sort through that — understanding the available routes, comparing engineering colleges, looking at branches, checking applicable eligibility and reviewing previous cut-off trends as a reference rather than a promise. The idea is to build a preference list that is not based on guesswork.",
        ],
      },
      {
        heading: "The WBJEE admission process",
        paragraphs: [
          "The WBJEE admission process generally involves taking part in the applicable counselling procedure, registering within the prescribed window, making college and branch preferences, and responding appropriately to seat allotment.",
          "The exact rules, deadlines, fees, documents and number of rounds can change from year to year. Do not depend completely on what a senior did two years ago — always check the latest official notification for your admission year.",
        ],
      },
      {
        heading: "What the counselling process looks like",
        paragraphs: [
          "The broad journey is easier to understand than the instructions make it look: result and rank, check eligibility, counselling registration, choice filling, choice submission or locking where applicable, seat allotment, seat acceptance, then reporting and admission.",
          "In simple terms, you first become part of the applicable process. Then you tell the system which college and branch combinations you prefer. Based on the applicable rules, merit, your preferences and seat availability, a seat may be allotted. If you do not get your first choice, that does not automatically mean something has gone wrong — depending on the rules of that round, there may be further options.",
        ],
      },
      {
        heading: "Registration, online",
        paragraphs: [
          "WBJEE counselling registration matters because you generally need to complete it before taking part in the later stages. Keep your relevant academic and WBJEE information available, along with the documents and details requested in the official instructions.",
          "Before submitting anything, check your personal information carefully. A small mistake in an important form can create unnecessary trouble later. For registration for counselling of WBJEE online, follow the official counselling portal and the instructions applicable to your admission year, keep your login details safe and keep a record of important submissions.",
          "And please do not wait until the last few hours if you can avoid it. When thousands of students are completing forms at the same time, rushing through an important registration is not worth the stress.",
        ],
      },
      {
        heading: "Choice filling and seat allotment",
        paragraphs: [
          "During counseling for WBJEE, choice filling deserves serious attention. Do not simply arrange colleges by popularity — think about the combination of college, branch, fees, location, rank and career interests.",
          "You may have a dream option at the top, followed by realistic choices and then options you would genuinely be comfortable accepting. Previous-year cut-offs can help you understand trends, but they are not promises for 2026: demand, preferences, seat availability and other factors all affect the outcome.",
        ],
      },
      {
        heading: "The branch is a career decision too",
        paragraphs: [
          "Computer Science, Information Technology, Electronics and Communication, Electrical, Mechanical, Civil and specialised branches lead in different directions. That does not make one automatically better than another.",
          "Before putting a branch at the top of your list, ask whether you enjoy the related subjects, whether you are choosing it because you like it or because everyone says it has scope, and whether you understand what you will study for four years. A high cut-off tells you a branch is in demand. It cannot tell you whether you will enjoy studying it.",
        ],
      },
      {
        heading: "Mistakes that come from rushing",
        paragraphs: [
          "Most counselling mistakes are not complicated — they are rushed decisions. Students copy a friend’s preference list without understanding why those choices were made. Others select only famous colleges, ignore fees or location, or choose a branch because someone said it has more scope.",
          "Some do not check eligibility carefully. Others leave registration until the deadline or enter information without reviewing it. And then there is family pressure: parents naturally want the best for you, but the final decision should be something you understand and are comfortable with.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is WBJEE counselling?",
        answer:
          "It is the admission process through which eligible candidates take part in college and branch allocation based on the applicable rules, their merit and their preferences.",
      },
      {
        question: "What does the WBJEE counselling process involve?",
        answer:
          "Generally checking eligibility, registration, choice filling, choice submission or locking where applicable, seat allotment, seat acceptance and admission formalities.",
      },
      {
        question: "When does WBJEE counselling registration start?",
        answer:
          "The dates change each year. Check the latest official WBJEE counselling notification for the current admission cycle.",
      },
      {
        question: "How does WBJEE choice filling work?",
        answer:
          "You arrange your preferred college and branch combinations in an order that reflects your priorities. Rank, branch, college, fees, location and career goals should all be considered.",
      },
      {
        question: "How does WBJEE seat allotment work?",
        answer:
          "It depends on the applicable counselling rules, merit or rank, your preferences, seat availability and other relevant factors.",
      },
      {
        question: "Can I change my choices during WBJEE counselling?",
        answer:
          "That depends on the rules applicable to the particular stage or round. Always check the current instructions before making changes.",
      },
      {
        question: "Are previous-year WBJEE cut-offs reliable?",
        answer:
          "They are useful for understanding past trends, but they cannot guarantee what will happen in the current admission year.",
      },
      {
        question: "How can I choose the right college and branch through WBJEE?",
        answer:
          "Start with your rank and eligibility, then look at branch preference, college quality, fees, location and career interests. Do not decide on cut-off alone.",
      },
    ],
  },
  {
    slug: "srmjeee-counselling",
    name: "SRMJEEE Counselling",
    primaryIntent:
      "Understand SRMJEEE admission and choice filling and get help choosing an SRM campus and B.Tech branch",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "srmjee counselling",
      "srmjeee choice filling",
      "srmjeee registration",
      "srmjeee",
      "exam service",
    ],
    exams: [
      { name: "SRMJEEE", full: "SRM Joint Engineering Entrance Examination" },
    ],
    leadOffer: "Free SRM campus and branch comparison based on your rank",
    tools: [],
    cities: ["chennai", "delhi"],
    priority: "growth",
    title: "SRMJEEE Counselling 2026 – SRM Admission & College Guide | ProCounsel",
    description:
      "Get expert SRMJEEE counselling 2026 guidance for SRM BTech admission, rank-based course selection, counselling process, choice filling and admission guidance.",
    h1: "SRMJEEE Counselling 2026 – SRM Admission & College Guide",
    intro:
      "You finally have your SRMJEEE result. Maybe you are happy with it, maybe you are still working out what the rank means, or maybe you are already comparing SRM campuses and B.Tech courses on your phone. Then the questions start. Which campus should I choose? Which branch makes sense for me? What should I put first? This is where many students realise that writing the exam was the easier part — the difficult part is deciding what to do with the result.",
    sections: [
      {
        heading: "Rank matters, but it is not the whole decision",
        paragraphs: [
          "When students discuss admission, the conversation often starts and ends with rank. Rank certainly matters, but it is not everything.",
          "Suppose two students have a similar SRMJEEE performance. One has always enjoyed programming and wants to explore software careers. The other is more interested in electronics, devices and how hardware works. Their campus and course preferences may look completely different, and that is fine.",
          "A sensible decision considers your performance, preferred branch, campus, fees, location, academic environment, internship opportunities and placement trends together. Be careful about copying someone else’s preference list — your friend’s best choice may not be yours.",
        ],
      },
      {
        heading: "Too much information, not enough clarity",
        paragraphs: [
          "After SRMJEEE there is no shortage of information — websites, videos, cut-off discussions, social posts and plenty of opinions. The problem is working out which of it applies to you.",
          "Counselling can help by looking at your individual situation: comparing courses and campuses, understanding the available choices, checking applicable requirements, reviewing previous trends and building a practical preference list. The purpose is not to tell every student to choose the same course — it is to help you understand your options before you commit.",
        ],
      },
      {
        heading: "The admission journey",
        paragraphs: [
          "Once your result is available, the focus shifts from preparing for an exam to making an admission decision. This is where SRMJEE counselling matters: registration, course or campus preferences, choice filling, allotment or offer-related steps, fee considerations and admission formalities all need attention.",
          "The broad journey looks like this: SRMJEEE, result or rank, check eligibility, admission or counselling steps, course and campus preferences, choice filling or selection, allotment or offer, fee or confirmation, then admission formalities.",
          "The process can change from one admission year to another. If you find an old video explaining last year’s procedure, do not assume the same steps apply in 2026 — check the latest official SRM instructions before submitting anything.",
        ],
      },
      {
        heading: "Choosing a B.Tech branch",
        paragraphs: [
          "Choosing a branch is a bigger decision than picking the course with the highest demand. You might be considering Computer Science or a related specialisation, Electronics and Communication, Electrical and Electronics, Mechanical, Civil or another field.",
          "Before deciding, ask a few honest questions. Do I actually enjoy the subjects involved? Am I choosing this because I like it, or because everyone keeps telling me it has scope? What kind of work could it lead towards? Would I be comfortable studying these subjects for four years? There is no single best B.Tech course for everyone.",
        ],
      },
      {
        heading: "Comparing campuses",
        paragraphs: [
          "Choosing an SRM option is not just about recognising the name of a campus. Look at the things that will actually affect your experience: the course, curriculum, faculty, infrastructure, student environment, internship opportunities, placement trends, facilities, location and overall cost.",
          "One question students struggle with is whether to choose their preferred branch or a different branch at a campus they like more. If you are very clear about the kind of engineering work you want to explore, the branch may carry more weight. If you are still exploring and strongly prefer a particular campus, your priorities may differ. Talk it through with your parents, but do not let the loudest opinion in the room decide.",
        ],
      },
      {
        heading: "Registration and application",
        paragraphs: [
          "SRMJEEE registration is an important part of the examination journey, but remember that the entrance exam application and later admission or counselling activities are not necessarily the same thing.",
          "When completing your application, enter your personal and academic information carefully, keep relevant details accessible, save important application information and pay attention to the official schedule. Do not leave everything until the last evening — even a small mistake in important information can create unnecessary stress later.",
          "If you are looking for an exam service or other examination-related support, make sure you understand exactly what it covers, and always rely on official SRM instructions for the actual application and admission requirements.",
        ],
      },
      {
        heading: "Choice filling done properly",
        paragraphs: [
          "This is one stage where spending a little extra time saves a lot of confusion later. SRMJEEE choice filling should reflect what you want, not what your friend wants.",
          "Imagine Computer Science is your first preference, but you also like Electronics and Communication and would be comfortable considering it. Instead of keeping only one option and having no backup, think about how your preferences should be arranged based on your interests, campus preference and practical considerations.",
          "Before submitting, ask which course you would genuinely prefer, which campus you prefer, what alternatives you would actually be happy with, whether the overall cost works for your family, and whether the course fits your career interests.",
        ],
      },
      {
        heading: "Common mistakes",
        paragraphs: [
          "Most admission mistakes are not complicated — they usually happen because students rush. Some choose a branch because everyone is taking it. Others copy a friend’s list without considering their own interests. Some focus only on the most popular campus and ignore course fit, fees or location.",
          "Another common mistake is assuming last year’s process will be identical in 2026. And then there is family pressure — take advice from people you trust, but make sure you understand and are comfortable with the final choice.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is SRMJEEE counselling?",
        answer:
          "It refers to the admission and selection process through which eligible students move from their SRMJEEE result towards selecting available courses or campus options and completing the required admission steps.",
      },
      {
        question: "What happens after SRMJEEE?",
        answer:
          "You need to understand your applicable admission steps, review course and campus options, make your preferences where required, and complete the necessary admission formalities.",
      },
      {
        question: "How does SRMJEEE choice filling work?",
        answer:
          "Choice filling means arranging your preferred course or campus options in the applicable admission system. Your choices should reflect your actual interests and priorities rather than someone else’s list.",
      },
      {
        question: "When should I complete SRMJEEE registration?",
        answer:
          "Follow the current official SRM schedule and register within the specified period. Avoid waiting until the last day wherever possible.",
      },
      {
        question: "How should I choose my B.Tech branch?",
        answer:
          "Look beyond popularity. Consider the subjects you enjoy, your strengths, the curriculum, possible career directions and whether you can genuinely see yourself studying the branch for four years.",
      },
      {
        question: "Can I change my choices during the admission process?",
        answer:
          "That depends on the current admission rules and the stage of the process. Check the official instructions before assuming a change is possible.",
      },
      {
        question: "Should I choose a course only because of placement opportunities?",
        answer:
          "No. Placement trends can be one factor, but course interest, curriculum, skills, career direction, campus and cost also matter.",
      },
    ],
  },
  {
    slug: "met-counselling",
    name: "MET Counselling",
    primaryIntent:
      "Understand Manipal MET admission and choice filling and get help choosing a campus and B.Tech branch",
    expertise: ENGINEERING_EXPERTISE,
    supportKeywords: [
      "met counselling",
      "manipal met counselling",
      "met counselling process",
      "manipal btech admission",
      "manipal university eligibility criteria for b tech",
      "manipal b tech entrance exam",
      "manipal btech application",
      "manipal edu counselling",
    ],
    exams: [{ name: "MET", full: "Manipal Entrance Test" }],
    leadOffer: "Free Manipal campus and branch comparison based on your MET result",
    tools: [],
    cities: ["bangalore", "mangalore"],
    priority: "growth",
    title: "MET Counselling 2026 – Manipal Admission & Choice Filling Guide | ProCounsel",
    description:
      "Get expert MET Counselling 2026 guidance for Manipal admission, rank-based course selection, counselling process, choice filling and BTech admission guidance.",
    h1: "MET Counselling 2026 – Manipal Admission & Choice Filling Guide",
    intro:
      "You have finished MET, your result or rank is in front of you, and now comes the part many students find surprisingly confusing. “Okay, I got my rank. What do I do now?” That question usually turns into ten more: which B.Tech course should I choose, which campus should I prefer, how does counselling work, what happens during choice filling, and if my first preference is not available, what then? The goal here is not simply to find a seat. It is to understand your options and make a sensible decision about your course, campus and admission.",
    sections: [
      {
        heading: "A Manipal decision is not based on rank alone",
        paragraphs: [
          "Your MET performance is important, but so are your interests, preferred branch, campus, budget, location and future plans. Think about the academic environment, internship opportunities and placement trends rather than looking at one factor in isolation.",
          "Imagine two students with similar MET performance. One is genuinely interested in computer-related subjects and wants a software career. The other enjoys electronics and is more interested in hardware and communication systems. There is no reason their preference lists should look identical.",
          "This is why blindly copying a friend’s choices — or choosing something because a relative says it is the best — can create problems later.",
        ],
      },
      {
        heading: "What counselling actually helps with",
        paragraphs: [
          "This is where Manipal MET counselling guidance can be useful. A counsellor can help you understand the admission journey, compare BTech courses and campuses, look at the options realistically, understand applicable eligibility requirements and review previous information without treating it as a guarantee.",
          "It can also help answer practical questions: should I keep my preferred branch even if another course seems more popular, which alternatives should I keep, and am I choosing this course because I actually like it or because everyone around me recommends it? Good Manipal edu counselling is not about making the decision for you \u2014 it is about helping you see it clearly.",
        ],
      },
      {
        heading: "The MET counselling process",
        paragraphs: [
          "The broad journey is easier to follow than the instructions suggest: MET, result or rank, eligibility, counselling or admission participation, course and campus preferences, choice filling or selection, allotment or offer, fee confirmation, then admission formalities.",
          "The exact stages, dates, choice rules and allotment procedures can vary, so do not assume that something followed in an earlier admission year will be identical in 2026. Always refer to the latest official Manipal instructions for your programme.",
        ],
      },
      {
        heading: "Manipal B.Tech admission and eligibility",
        paragraphs: [
          "The Manipal BTech admission journey involves several connected decisions — from meeting the applicable entrance and academic requirements to completing the application, understanding your result, selecting a course and taking part in the relevant admission process. Your eligibility affects your options, your options affect your preference list, and your preference list should reflect the course and college experience you actually want.",
          "Students frequently search for the Manipal University eligibility criteria for B Tech because they want to know whether they qualify for a particular programme. The answer can depend on the qualifying examination, required subjects, academic performance, entrance examination requirements and programme-specific conditions.",
          "Rather than relying on an old blog or a forwarded message, check the current 2026 eligibility requirements for the specific B.Tech programme you are considering. Requirements change, and not every programme has identical conditions.",
        ],
      },
      {
        heading: "The entrance exam is one stage, not the whole journey",
        paragraphs: [
          "The Manipal B Tech entrance exam is one part of a larger journey. Students often focus heavily on preparing for it and then feel lost once the result arrives. Think of it as a sequence: entrance exam, result or rank, eligibility, admission or counselling, course selection.",
          "When completing a Manipal BTech application, do not rush. Enter your personal and academic information carefully, check the programme requirements, review everything before submission and save important application details. Keep an eye on the official schedule — missing a deadline because you assumed there would be another opportunity creates unnecessary stress.",
        ],
      },
      {
        heading: "Comparing courses and campuses",
        paragraphs: [
          "Do not stop at the name of the campus or programme. Look at the campus environment, curriculum, faculty, infrastructure, internship opportunities, placement trends, fees, location, facilities and the kind of academic experience you want.",
          "The most common dilemma is whether to choose your preferred branch at one campus or a different branch at another. There is no universal answer. If you are very clear about the field you want to study, the branch may carry more weight. If the overall campus experience matters more, your priorities may differ. Your budget and long-term career plans matter too.",
        ],
      },
      {
        heading: "A step-by-step way to decide",
        bullets: [
          "Understand your MET performance and applicable eligibility.",
          "Identify the engineering branches you are genuinely interested in.",
          "Discuss campus preferences, including location and environment.",
          "Consider your budget — fees and other education expenses are practical realities.",
          "Shortlist suitable courses and campuses, keeping sensible alternatives.",
          "Compare course and campus combinations rather than either one alone.",
          "Plan your preferences carefully instead of copying someone else’s list.",
          "Review the confirmation, payment and admission requirements before moving ahead.",
        ],
      },
      {
        heading: "Common mistakes during MET counselling",
        paragraphs: [
          "Students sometimes choose a course because everyone else is choosing it, ignore campus preferences, copy another student’s list or fail to understand the actual curriculum. Others overlook fees, do not check eligibility or enter incorrect information during the application.",
          "Then there are the avoidable ones: missing deadlines, not reading official instructions and assuming last year’s process will be the same in 2026. Family pressure can make all of this harder — listen to your parents, but make sure you understand the choice you finally make.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is MET counselling?",
        answer:
          "It refers to the applicable admission and selection process through which eligible students move from their MET performance towards course and campus selection and admission.",
      },
      {
        question: "What happens after the MET result?",
        answer:
          "You generally need to understand your eligibility, take part in the applicable admission or counselling process, consider course and campus preferences and complete the required admission steps.",
      },
      {
        question: "How does the MET counselling process work?",
        answer:
          "It can involve result or rank, eligibility, admission or counselling participation, preferences, choice filling or selection, allotment or offer, fee confirmation and admission formalities. Exact procedures vary.",
      },
      {
        question: "How should I choose my B.Tech course?",
        answer:
          "Look beyond popularity. Consider the curriculum, the subjects you enjoy, your strengths, career interests and the options actually available to you.",
      },
      {
        question: "What is the eligibility criteria for Manipal B.Tech?",
        answer:
          "Eligibility can vary by programme. Check the latest official requirements for the specific B.Tech course you are interested in rather than relying on older information.",
      },
      {
        question: "How should I fill my course or campus choices?",
        answer:
          "Start with your genuine preferences, then include realistic alternatives. Consider course, campus, fees, location and career goals together.",
      },
      {
        question: "Is the MET entrance exam required for B.Tech admission?",
        answer:
          "Requirements depend on the applicable programme and admission route. Check the current official Manipal admission information for the programme you want.",
      },
    ],
  },
  {
    slug: "cat-counselling",
    name: "CAT Counselling",
    primaryIntent:
      "Understand what to do after the CAT result and get help shortlisting IIMs and other MBA colleges for your profile",
    expertise: MBA_EXPERTISE,
    supportKeywords: [
      "cat counselling",
      "cat exam counselling",
      "cmat counselling",
      "cat entrance exam",
      "cat entrance exam for mba",
      "cat exam apply",
    ],
    exams: [
      { name: "CAT", full: "Common Admission Test" },
      { name: "CMAT", full: "Common Management Admission Test" },
    ],
    leadOffer: "Free MBA college shortlist based on your percentile and profile",
    tools: [
      { label: "CAT College Predictor", to: "/cat-college-predictor" },
      { label: "MBA Admission Guide 2027", to: "/mba-admission-2027" },
      { label: "IIM CAT Cut-offs", to: "/mba-colleges/iim-cutoffs" },
    ],
    cities: ["mumbai", "delhi", "bangalore", "pune"],
    priority: "core",
    title: "CAT Counselling 2026 – MBA College & IIM Admission Guidance | ProCounsel",
    description:
      "Get expert CAT counselling 2026 guidance for MBA and IIM college selection, percentile-based college shortlisting, admission process and career guidance.",
    h1: "CAT Counselling 2026 – MBA College & IIM Admission Guidance",
    intro:
      "You finally checked your CAT result. Maybe you are happy with your percentile. Maybe you were expecting a little more. Or maybe you are sitting with your parents, looking at your score and thinking, “okay… what do I do now?” That confusion is completely normal. CAT is a major milestone, but getting your percentile is not the end of the MBA admission journey. In many ways this is where the decision-making starts — which IIMs and B-schools make sense for your profile, where you should apply, and how to compare the options you may eventually receive.",
    sections: [
      {
        heading: "Percentile matters, but it is not the whole story",
        paragraphs: [
          "When students talk about MBA admission, the conversation usually starts with one number. It matters, of course. But your academic background, eligibility, work experience where applicable, category-related criteria, institute-specific requirements, interview performance and other selection factors can also matter depending on the B-school.",
          "Then there is the question that is often ignored: what do you actually want from your MBA? Two students with similar percentiles may make completely different choices. One may want to stay close to home and keep costs manageable. Another may be willing to relocate because a particular programme fits their career plans better. Neither is automatically right or wrong.",
        ],
      },
      {
        heading: "Too many options, not too few",
        paragraphs: [
          "After CAT, students can suddenly have too many options rather than too few. IIMs, private B-schools, university programmes and other MBA routes can make the shortlist confusing.",
          "Counselling can help you step back and ask the right questions: which colleges are realistic for my profile, which applications should I consider, what does each programme actually offer, which specialisations fit my interests, and what should I compare before applying? It also helps you avoid a common mistake — creating a college list based entirely on what someone else thinks is best.",
        ],
      },
      {
        heading: "There is no single counselling process for every B-school",
        paragraphs: [
          "Once the result is available, the focus usually shifts from preparation to applications and selection. This is where CAT exam counselling helps: shortlisting colleges, checking institute-specific requirements, completing applications, tracking selection stages and preparing for interviews or other components where applicable.",
          "One important point is worth remembering: there is not one central counselling process that works the same way for every IIM and MBA college. Different institutes can have their own application forms, eligibility requirements and selection procedures. Do not assume that one rule or a previous year’s process automatically applies everywhere in 2026.",
        ],
      },
      {
        heading: "Which MBA direction makes sense for you?",
        paragraphs: [
          "Before choosing a programme, think beyond admission. Maybe you enjoy numbers and financial markets, so finance could interest you. Maybe you enjoy understanding customers, communication and brands, and marketing feels more appealing. Someone else may be interested in people management, operations, analytics, consulting or entrepreneurship.",
          "The point is not to pick a specialisation because it is popular this year. Ask what kind of work you enjoy, what you are naturally good at, what skills you want to build and what career you can see yourself pursuing afterwards. There is no single best MBA specialisation for every student.",
        ],
      },
      {
        heading: "Choosing a college is more than a ranking",
        paragraphs: [
          "You might hear “just choose the highest-ranked college you get”. It sounds simple, but real decisions rarely are.",
          "When comparing IIMs and other B-schools, look at the programme structure, admission criteria, fees, location, faculty, alumni network, internship opportunities, industry exposure, campus environment and career outcomes. Placement trends are useful but should be only one part of the picture.",
          "Suppose you have two offers. One has a stronger overall reputation, but the other has a programme and specialisation that fit your career plans much better. There is no universal answer — your finances, career direction and priorities all matter.",
        ],
      },
      {
        heading: "A practical way to plan your applications",
        bullets: [
          "Understand your CAT percentile, academics and eligibility.",
          "Discuss your career interests and preferred MBA areas.",
          "Consider work experience and other relevant profile factors.",
          "Identify realistic IIMs and B-schools rather than only aspirational ones.",
          "Compare programmes, fees, location and career opportunities.",
          "Build an application strategy based on your priorities.",
          "Understand the selection and admission requirements of individual institutes.",
          "Compare the final options before making your decision.",
        ],
      },
      {
        heading: "The CAT entrance exam and the wider journey",
        paragraphs: [
          "The CAT entrance exam is an important part of the MBA admission journey, but only one stage. Think of it broadly as preparation, the exam, result and percentile, college shortlisting, applications, institute-specific selection, then final admission.",
          "The CAT entrance exam for MBA can open the door to several management programmes, but every institute may have its own rules and selection approach. After receiving your score, do not stop at searching for an expected cut-off — look at the complete admission picture.",
          "If you are planning to appear for CAT, the CAT exam apply stage deserves attention too. Check your personal and academic information, the applicable eligibility requirements and category-related information where relevant, and keep your application details safe. For dates, fees and eligibility, always check the latest official CAT notification rather than an old screenshot or social media post.",
        ],
      },
      {
        heading: "What about CMAT?",
        paragraphs: [
          "CAT is not the only route students consider for MBA admission. If you are exploring alternatives, you may also come across CMAT counselling and other entrance-based admission processes. These are separate from CAT-based admissions, and the participating colleges and rules can differ.",
          "If you are considering another entrance exam, check its official rules and the specific colleges accepting that score before making assumptions.",
        ],
      },
      {
        heading: "Mistakes students make after CAT",
        bullets: [
          "Looking only at IIMs and ignoring other suitable programmes.",
          "Choosing a college purely because of its ranking.",
          "Assuming a percentile guarantees admission.",
          "Ignoring institute-specific selection criteria.",
          "Applying at the last minute, or missing application deadlines.",
          "Ignoring fees and the overall financial commitment.",
          "Choosing a specialisation without understanding it.",
          "Copying another student’s college list.",
          "Treating previous-year cut-offs as guaranteed.",
          "Letting family or peer pressure make the decision.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is CAT counselling?",
        answer:
          "It generally refers to the post-CAT process of understanding college options, shortlisting B-schools, applying and working through their individual admission procedures. There is no single process covering every IIM and B-school.",
      },
      {
        question: "Is there one common counselling process for all IIMs?",
        answer:
          "No. Individual IIMs and other B-schools can have their own eligibility, application and selection procedures. Always check the institute’s current admission information.",
      },
      {
        question: "What happens after the CAT result?",
        answer:
          "Students generally move from percentile evaluation to college shortlisting, applications and institute-specific selection stages such as interviews, followed by final admission decisions.",
      },
      {
        question: "What CAT percentile do I need for an IIM?",
        answer:
          "There is no single percentile that guarantees admission to every IIM. Requirements and selection criteria differ between institutes and candidate profiles.",
      },
      {
        question: "How should I choose MBA colleges after CAT?",
        answer:
          "Look beyond percentile and reputation. Consider programme fit, eligibility, fees, location, specialisation, career goals, placement trends, faculty, alumni network and your overall profile.",
      },
      {
        question: "Is CAT the only MBA entrance exam?",
        answer:
          "No. You may consider other entrance exams depending on your eligibility and the colleges you want to apply to. Each route has its own rules.",
      },
      {
        question: "What is CMAT counselling?",
        answer:
          "It refers to the admission and counselling processes associated with CMAT-based MBA admissions. It is separate from CAT-based admissions, so check the rules of individual participating colleges.",
      },
      {
        question: "Should I choose an IIM simply because it is an IIM?",
        answer:
          "Not necessarily. The label matters, but your decision should also consider the programme, career fit, cost, location, specialisation and your long-term goals.",
      },
    ],
  },
  {
    slug: "xat-counselling",
    name: "XAT Counselling",
    primaryIntent:
      "Understand what to do after the XAT result and get help shortlisting MBA colleges for your score and profile",
    expertise: MBA_EXPERTISE,
    supportKeywords: [
      "xat counselling",
      "XAT admission counselling",
      "XAT score college predictor",
      "MBA admission through XAT",
      "XAT score counselling",
    ],
    exams: [{ name: "XAT", full: "Xavier Aptitude Test" }],
    leadOffer: "Free XAT-based MBA college shortlist built around your profile",
    tools: [
      { label: "CAT College Predictor", to: "/cat-college-predictor" },
      { label: "MBA Admission Guide 2027", to: "/mba-admission-2027" },
      { label: "IIM CAT Cut-offs", to: "/mba-colleges/iim-cutoffs" },
    ],
    cities: ["mumbai", "delhi", "bangalore", "pune"],
    priority: "growth",
    title: "XAT Counselling 2026 – MBA College & Admission Guidance | ProCounsel",
    description:
      "Get expert XAT counselling 2026 guidance for MBA college selection, percentile-based shortlisting, XLRI admissions and the XAT admission process.",
    h1: "XAT Counselling 2026 – MBA College & Admission Guidance",
    intro:
      "You spent months preparing. The exam is done, the result is out, and instead of feeling relieved you are staring at your score thinking: “so… which colleges should I apply to now?” Within an hour you have a dozen tabs open — cut-off lists, rankings, a YouTube video, a forum thread. One says one thing, another says the opposite. A friend tells you to apply somewhere. A parent asks about XLRI. This page is for that moment. Not to explain what XAT is, but to help you work out what to do with the score you have.",
    sections: [
      {
        heading: "Choosing a college is three decisions at once",
        paragraphs: [
          "It is an education decision, a career decision and a financial decision, and students often only make the first one consciously.",
          "You may have a strong score but prefer a college close to home. Someone else may be willing to move anywhere for a particular specialisation. A third student may have a firm budget that rules some options out. And if you already have work experience, your priorities probably look nothing like a fresher’s.",
          "This is why there is no one perfect college list. When people search for xat counselling, they are usually not asking for a ranking — they are asking someone to help them make sense of the options in front of them.",
        ],
      },
      {
        heading: "When you do not know where to begin",
        paragraphs: [
          "The first useful thing counselling does is narrow the field. Instead of comparing forty B-schools, you start with your own profile — your score, academics, eligibility and what you want out of the two years.",
          "From there it becomes possible to shortlist realistically, compare programmes rather than names, understand which specialisations suit you and check eligibility before you spend an application fee. That is far more useful than another list of top colleges.",
        ],
      },
      {
        heading: "What XAT admission counselling covers",
        paragraphs: [
          "After the result the practical work begins: applications, eligibility, admission criteria, deadlines, selection stages and comparing whatever opportunities you receive.",
          "Here is the important part. There is not one counselling process that works identically for every institute accepting XAT. Each college can have its own application, its own criteria and its own selection rounds. So XAT admission counselling is less about a single process and more about understanding the specific colleges you are interested in, one at a time, before their deadlines pass.",
        ],
      },
      {
        heading: "Before choosing a college, choose a direction",
        paragraphs: [
          "Have you thought about what you actually want to do after your MBA? It sounds like a question for later, but it quietly shapes every choice you are about to make.",
          "Finance, marketing, HR, operations, business analytics, consulting, product management, entrepreneurship — these are genuinely different kinds of work, not just different electives. None of them is the best. If you enjoy working with numbers and markets, one direction opens up. If you enjoy communication, brands and customer behaviour, another does. If you like solving messy business problems with people, that is a third.",
          "You do not need certainty. But a rough sense of direction makes a college list much easier to build.",
        ],
      },
      {
        heading: "Ask a better question than “which is the best college?”",
        paragraphs: [
          "A more useful question is: which college makes the most sense for my profile and my career goals?",
          "Compare admission criteria, the programme itself, fees, location, faculty, internship opportunities, placement trends, alumni network, specialisations, industry exposure and the careers the programme actually leads to.",
          "XLRI comes up in almost every XAT conversation, and understandably so. But do not build your entire plan around one institute. Nobody can promise you an admission there, and a list with a single name on it is not a plan. Use your score to build a balanced set of applications instead.",
        ],
      },
      {
        heading: "The programme matters as much as the name",
        paragraphs: [
          "An MBA is not just a college. It is two years of specific subjects, projects and people.",
          "So ask yourself the practical things. Are you comfortable with numbers? Do you enjoy communication and branding? Do you like working with data? Would you rather manage people or build products? What kind of job would you genuinely like at the end of it?",
          "Choosing a specialisation because someone told you it pays well is how students end up two years into something they do not enjoy.",
        ],
      },
      {
        heading: "What a personalised process actually looks like",
        bullets: [
          "Start with your XAT score and your overall profile, not with a college list.",
          "Look at your academic background, eligibility and any other relevant factors.",
          "Work out what you want from an MBA — role, sector, location, timeline.",
          "Build a practical list of colleges worth exploring, ambitious and realistic.",
          "Compare programmes, fees, location and career opportunities side by side.",
          "Understand each institute’s own selection process and deadlines.",
          "Make the decision yourself, with the options properly understood.",
        ],
        paragraphs: [
          "Counselling is not someone choosing for you. It is someone making sure you can see what you are choosing between.",
        ],
      },
      {
        heading: "About the XAT score college predictor",
        paragraphs: [
          "Almost everyone looks for an XAT score college predictor within a day of the result, and the reason is obvious — you want a quick answer to “where can I get in?”",
          "A predictor can be a reasonable starting point. It helps you see which colleges are worth exploring and gives you a first shortlist to work from.",
          "What it cannot do is promise you a seat. Admission decisions can involve your academic record, work experience where applicable, institute-specific criteria, interview performance and other profile factors. Previous-year trends give context, not certainty. Treat a predictor as the beginning of your research, not the end of it.",
        ],
      },
      {
        heading: "How MBA admission through XAT works",
        paragraphs: [
          "The journey is simpler than it looks: XAT, result, score and percentile, college shortlisting, applications, institute-specific selection, admission.",
          "MBA admission through XAT can open doors at a number of management institutes, but each one can set its own rules. Before you apply anywhere, check that institute’s current official information rather than assuming last year’s process still holds.",
        ],
      },
      {
        heading: "What XAT score counselling really answers",
        paragraphs: [
          "When students search for XAT score counselling, they are usually asking one thing: what can I realistically do with this score?",
          "The honest answer involves building an ambitious set of options and a realistic one, comparing colleges properly, factoring in fees and thinking about where you want to work afterwards. Your score is one input into that. It is not the entire picture, and it certainly is not a single cut-off number that decides everything.",
        ],
      },
      {
        heading: "Mistakes worth avoiding",
        bullets: [
          "“I will apply only to XLRI.” — a list of one is not a plan.",
          "“This website says my score guarantees this college.” — no site can guarantee that.",
          "“My friend’s college is good, so I will apply there too.” — their profile is not yours.",
          "“This college is ranked higher, so it must be better for me.” — better for whom, at what cost?",
          "“I will worry about the course after admission.” — the course is what you will actually study.",
          "“I will check the application deadline later.” — deadlines are the one thing that cannot be renegotiated.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is XAT counselling?",
        answer:
          "It is the guidance students look for after the XAT result — understanding their options, shortlisting MBA colleges that suit their profile, and working out how to apply and compare offers.",
      },
      {
        question: "Is there a common counselling process for all XAT colleges?",
        answer:
          "No. Institutes accepting XAT can each have their own application, eligibility and selection procedure. Check the current admission information for every college you are interested in.",
      },
      {
        question: "What should I do after my XAT result?",
        answer:
          "Look at your score alongside your academics, eligibility and career goals, build a balanced shortlist, then check each institute’s requirements and deadlines before applying.",
      },
      {
        question: "Can my XAT score alone guarantee XLRI admission?",
        answer:
          "No. Admission decisions can involve several factors depending on the institute, including academics, work experience where applicable, selection rounds and interview performance.",
      },
      {
        question: "How does an XAT score college predictor work?",
        answer:
          "It generally compares your score against previous-year trends to suggest colleges worth exploring. It is a starting point for research, not a prediction of admission.",
      },
      {
        question: "What is MBA admission through XAT?",
        answer:
          "It is the route from your XAT score to an MBA seat: shortlisting colleges, applying to each one, going through their selection process and completing admission formalities.",
      },
      {
        question: "How should I shortlist MBA colleges after XAT?",
        answer:
          "Consider programme fit, specialisation, eligibility, fees, location, career outcomes and your own goals — not reputation alone. Keep both ambitious and realistic options.",
      },
      {
        question: "Can XAT score counselling help me choose the right MBA college?",
        answer:
          "It can help you compare your realistic options and think through programme, cost and career fit. The final decision, and the responsibility for it, stays with you.",
      },
    ],
  },
];

export const COUNSELLING_EXAM_SLUGS = COUNSELLING_EXAMS.map((e) => e.slug);

export function getExamBySlug(slug?: string): CounsellingCategory | undefined {
  if (!slug) return undefined;
  const s = slug.toLowerCase();
  return COUNSELLING_EXAMS.find((e) => e.slug === s);
}

/**
 * Which exam pages belong under which category page.
 *
 * Two jobs. It is the internal-linking map — every exam page has to be
 * reachable from a real `<a href>` or the build's crawlability gate fails it —
 * and it is the information architecture: a student on
 * `/engineering-counselling` who has already sat MHT CET should be one click
 * from the page about their own CAP process.
 */
export const EXAMS_BY_CATEGORY: Record<string, string[]> = {
  "engineering-counselling": [
    "jee-counselling",
    "mht-cet-counselling",
    "comedk-counselling",
    "wbjee-counselling",
    "srmjeee-counselling",
    "met-counselling",
  ],
  "mba-counselling": ["cat-counselling", "xat-counselling"],
};

/** The category an exam page sits under, for the link back up. */
export const CATEGORY_FOR_EXAM: Record<string, string> = Object.entries(
  EXAMS_BY_CATEGORY,
).reduce<Record<string, string>>((acc, [category, exams]) => {
  for (const exam of exams) acc[exam] = category;
  return acc;
}, {});

/** Sibling and parent links to render on a category or exam page. */
export function relatedPages(slug: string): { name: string; to: string }[] {
  const children = EXAMS_BY_CATEGORY[slug];
  if (children) {
    return children
      .map((s) => COUNSELLING_EXAMS.find((e) => e.slug === s))
      .filter((e): e is CounsellingCategory => Boolean(e))
      .map((e) => ({ name: e.name, to: `/${e.slug}` }));
  }

  const parent = CATEGORY_FOR_EXAM[slug];
  if (!parent) return [];

  // On an exam page: its siblings, minus itself.
  return (EXAMS_BY_CATEGORY[parent] ?? [])
    .filter((s) => s !== slug)
    .map((s) => COUNSELLING_EXAMS.find((e) => e.slug === s))
    .filter((e): e is CounsellingCategory => Boolean(e))
    .map((e) => ({ name: e.name, to: `/${e.slug}` }));
}
