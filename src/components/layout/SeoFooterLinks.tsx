import { Link } from "react-router-dom";

/**
 * Pre-footer SEO internal-links band. Renders site-wide (above <Footer/>) so
 * every page carries a dense set of crawlable, keyword-rich internal links to
 * the programmatic city counselling pages, the free tools and the main
 * sections. This spreads internal link equity to the pages we want to rank
 * (city + tool pages) and gives Google clear, consistent site structure.
 */

const CITY_LINKS: { name: string; slug: string }[] = [
  { name: "Delhi", slug: "delhi" },
  { name: "Mumbai", slug: "mumbai" },
  { name: "Bangalore", slug: "bangalore" },
  { name: "Pune", slug: "pune" },
  { name: "Hyderabad", slug: "hyderabad" },
  { name: "Chennai", slug: "chennai" },
  { name: "Kolkata", slug: "kolkata" },
  { name: "Jaipur", slug: "jaipur" },
  { name: "Lucknow", slug: "lucknow" },
  { name: "Indore", slug: "indore" },
  { name: "Ahmedabad", slug: "ahmedabad" },
  { name: "Bhopal", slug: "bhopal" },
];

const TOOL_LINKS: { name: string; to: string }[] = [
  { name: "NEET Rank Predictor", to: "/neet-rank-predictor" },
  { name: "NEET College Predictor", to: "/neet-college-predictor" },
  { name: "NEET Cutoffs (Round-wise)", to: "/neet-cutoffs" },
  { name: "NEET Counselling", to: "/neet-counselling" },
  { name: "MBBS Colleges in India", to: "/mbbs-colleges" },
  { name: "JEE Rank Predictor", to: "/jee-rank-predictor" },
  { name: "JEE College Predictor", to: "/jee-college-predictor" },
  { name: "MHT-CET College Predictor", to: "/mhtcet-college-predictor" },
  { name: "MHT-CET Option Form Filling", to: "/mhtcet-option-form-filling" },
];

const EXPLORE_LINKS: { name: string; to: string }[] = [
  // Category landing pages — the commercial-intent entry points. Linked from
  // every page so they accumulate internal link equity.
  { name: "Engineering Counselling", to: "/engineering-counselling" },
  { name: "Medical Counselling", to: "/medical-counselling" },
  { name: "MBA Counselling", to: "/mba-counselling" },
  { name: "Law Counselling", to: "/law-counselling" },
  { name: "Career Counselling", to: "/career-counselling" },
  { name: "Study Abroad Consultants", to: "/study-abroad" },
  { name: "Admission Counselling", to: "/admissions" },
  { name: "Browse Colleges", to: "/colleges" },
  { name: "ProBuddies (College Seniors)", to: "/pro-buddies" },
  { name: "Find a Counsellor", to: "/counsellor-listing" },
  { name: "Admission Blogs", to: "/admissions/blogs" },
  { name: "Exam Deadlines", to: "/admissions/deadlines" },
  { name: "All Predictors", to: "/predictors" },
  // This page is in the sitemap but was only ever reached through a
  // navigate() button or a signed-in dashboard, so no crawler could find them.
  { name: "Mettle Career Test", to: "/mettle" },
];

const linkClass =
  "block text-[13px] leading-snug text-gray-600 hover:text-[#2F43F2] transition-colors";
const headingClass =
  "font-poppins font-semibold text-[13px] tracking-[0.06em] uppercase text-[#0E1629] mb-3";

export default function SeoFooterLinks() {
  return (
    <section className="w-full bg-[#F6F8FE] border-t border-gray-100" aria-label="Explore ProCounsel">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
          {/* Cities */}
          <div>
            <h3 className={headingClass}>Admission Counselling by City</h3>
            <ul className="space-y-2.5">
              {CITY_LINKS.map((c) => (
                <li key={c.slug}>
                  <Link to={`/counselling/${c.slug}`} className={linkClass}>
                    Counselling in {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/counselling" className="block text-[13px] font-semibold text-[#2F43F2] hover:underline">
                  View all cities →
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className={headingClass}>Free Student Tools</h3>
            <ul className="space-y-2.5">
              {TOOL_LINKS.map((t) => (
                <li key={t.to}>
                  <Link to={t.to} className={linkClass}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className={headingClass}>Explore ProCounsel</h3>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((e) => (
                <li key={e.to}>
                  <Link to={e.to} className={linkClass}>{e.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Value prop / about */}
          <div>
            <h3 className={headingClass}>Why ProCounsel</h3>
            <p className="text-[13px] leading-relaxed text-gray-600">
              ProCounsel is India's platform for end-to-end college admission counselling —
              verified counsellors, real college seniors (ProBuddies), NEET &amp; JEE rank and
              college predictors, cutoff data and choice-filling help, plus dedicated study
              abroad support for every admission journey.
            </p>
            <Link
              to="/counselling"
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#2F43F2] hover:underline"
            >
              Get admission counselling →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
