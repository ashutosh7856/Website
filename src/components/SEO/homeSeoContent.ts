import type { SeoSection } from "./SeoArticle";

/**
 * The home page's long-form SEO section, kept apart from the rest.
 *
 * `Admissions` is the one route AppRoutes loads eagerly, so anything it imports
 * lands in the entry chunk that every visitor downloads. It needs 4 KB of this
 * copy; `seoContent.ts` holds 46 KB, because the other eight blocks belong to
 * lazily-loaded pages. Sharing one module put all of it in front of every
 * visitor. Splitting the home block out leaves `seoContent.ts` imported only by
 * lazy pages, so it moves out of the entry chunk with them.
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
