import type { BlogListItem } from "@/api/blogs";
import { getCategoryBySlug } from "@/lib/counsellingCategories";
import { CATEGORY_FOR_EXAM } from "@/lib/counsellingExams";

export interface CounsellingLink {
  to: string;
  name: string;
  /** Course to file a lead from this post under. */
  course: string;
  /** Exam to file a lead under, when the post is about one exam. */
  exam?: string;
}

/**
 * Which counselling page a post most naturally leads to, most specific first.
 *
 * Blog categories are too coarse to route on ("admission", "others"), so this
 * reads the post's own title and keywords. Exam pages beat their category, and
 * anything unmatched goes to career counselling — the general-purpose desk.
 * Patterns that are also ordinary words (CAT, MET) are matched case-sensitively.
 */
const RULES: { slug: string; pattern: RegExp; exam?: string }[] = [
  { slug: "mht-cet-counselling", pattern: /\bmht[\s-]?cet\b/i, exam: "MHT CET" },
  { slug: "comedk-counselling", pattern: /\bcomedk\b/i, exam: "COMEDK UGET" },
  { slug: "wbjee-counselling", pattern: /\bwbjee\b/i, exam: "WBJEE" },
  { slug: "srmjeee-counselling", pattern: /\bsrmjeee?\b/i, exam: "SRMJEEE" },
  { slug: "jee-counselling", pattern: /\bjee\b|\bjosaa\b/i, exam: "JEE Main" },
  { slug: "met-counselling", pattern: /\bMET\b|\bmanipal\b/, exam: "MET" },
  { slug: "xat-counselling", pattern: /\bXAT\b/, exam: "XAT" },
  { slug: "cat-counselling", pattern: /\bCAT\b|\biim\b/i, exam: "CAT" },
  { slug: "medical-counselling", pattern: /\bneet\b|\bmbbs\b|\bbds\b|\bmedical\b|\bdoctor\b/i },
  { slug: "mba-counselling", pattern: /\bmba\b|\bpgdm\b|\bb-?school\b|\bmanagement\b/i },
  { slug: "law-counselling", pattern: /\bclat\b|\bllb\b|\blaw\b|\blawyer\b/i },
  { slug: "engineering-counselling", pattern: /\bengineering\b|\bb\.?\s?tech\b|\bcomputer science\b/i },
];

const FALLBACK_SLUG = "career-counselling";

export function relatedCounsellingPage(blog: Pick<BlogListItem, "title" | "keywords" | "keyphrase" | "metaTitle">): CounsellingLink {
  const haystack = [blog.title, blog.metaTitle, ...blog.keywords, ...blog.keyphrase].join(" • ");
  for (const rule of RULES) {
    if (!rule.pattern.test(haystack)) continue;
    const page = getCategoryBySlug(rule.slug);
    if (!page) continue;
    // Exam pages file the lead under their parent category's course, the way
    // the counselling landing page itself does.
    const parent = getCategoryBySlug(CATEGORY_FOR_EXAM[page.slug]);
    return {
      to: `/${page.slug}`,
      name: page.name,
      course: (parent ?? page).name,
      exam: rule.exam ? (page.exams[0]?.name ?? rule.exam) : undefined,
    };
  }
  const fallback = getCategoryBySlug(FALLBACK_SLUG)!;
  return { to: `/${fallback.slug}`, name: fallback.name, course: fallback.name };
}

/** Same-category posts first (newest first), topped up with other recent posts. */
export function relatedBlogs(current: BlogListItem, all: BlogListItem[], limit = 4): BlogListItem[] {
  const others = all.filter((b) => b.slug !== current.slug && b.id !== current.id);
  const byRecency = (a: BlogListItem, b: BlogListItem) => (b.publishedOnMillis ?? 0) - (a.publishedOnMillis ?? 0);
  const same = others.filter((b) => b.category === current.category).sort(byRecency);
  const rest = others.filter((b) => b.category !== current.category).sort(byRecency);
  return [...same, ...rest].slice(0, limit);
}
