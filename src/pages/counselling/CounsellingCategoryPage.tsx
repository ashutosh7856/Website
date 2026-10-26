import { useMemo } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, GraduationCap, MapPin, Star } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { useAuthStore } from "@/store/AuthStore";
import { encodeCounselorId } from "@/lib/utils";
import { COUNSELLORS_SNAPSHOT_LIST } from "@/hooks/useCounselors";
import { persistCounsellingIntent } from "@/lib/counsellingIntent";
import {
  COUNSELLING_CATEGORIES,
  categoryListingUrl,
  getCategoryBySlug,
  type CounsellingCategory,
} from "@/lib/counsellingCategories";
import { getCityBySlug } from "@/lib/counsellingCities";
import { CATEGORY_FOR_EXAM, relatedPages } from "@/lib/counsellingExams";
import AdSenseUnit from "@/components/ads/AdSenseUnit";

const ACCENT = "#2F43F2";
const SITE = "https://procounsel.co.in";

/**
 * Category counselling landing page — /engineering-counselling, /mba-counselling, ...
 *
 * One page, one commercial search intent. The related keywords for that intent
 * (exam terms, "admission guidance", "college selection") are covered inside
 * this page rather than split across thin per-keyword pages.
 *
 * The primary CTA is the whole point of the page: it records what the visitor
 * asked for, asks them to sign in, and hands them a counsellor list already
 * filtered to that specialisation. The intent is persisted before the login
 * gate so the lead captured on sign-in carries the category and the page it
 * came from (see src/lib/counsellingIntent.ts).
 */
/**
 * Head keyword first, then the support keywords, with case-insensitive
 * duplicates dropped — several categories name themselves in their own keyword
 * list ("Law Counselling" / "law counselling") and repeating it reads as
 * keyword stuffing.
 */
function categoryKeywords(category: CounsellingCategory): string {
  const seen = new Set<string>();
  return [category.name, ...category.supportKeywords]
    .filter((k) => {
      const key = k.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

export default function CounsellingCategoryPage({ slug: slugProp }: { slug?: string } = {}) {
  // The route is registered per known slug (see AppRoutes) rather than as a
  // catch-all `/:category`, so an unknown top-level path still falls through to
  // a real 404 instead of being swallowed by this page.
  const { category: slugParam } = useParams<{ category: string }>();
  const slug = slugProp ?? slugParam;
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleLogin = useAuthStore((s) => s.toggleLogin);
  const category = getCategoryBySlug(slug);

  // Exam pages linked from this one, and the category an exam page sits under.
  const related = useMemo(() => (category ? relatedPages(category.slug) : []), [category]);
  const parentCategory = useMemo(() => {
    const parentSlug = category ? CATEGORY_FOR_EXAM[category.slug] : undefined;
    return parentSlug ? getCategoryBySlug(parentSlug) : undefined;
  }, [category]);

  // Counsellors who actually list this specialisation. Rendered from the
  // build-time snapshot so the cards — and their links — are in the
  // prerendered HTML, and so the page never claims counsellors it does not have.
  const matched = useMemo(() => {
    if (!category) return [];
    const wanted = new Set(category.expertise.map((e) => e.toLowerCase()));
    return COUNSELLORS_SNAPSHOT_LIST.filter((c) =>
      (c.expertise || []).some((e) => wanted.has((e || "").toLowerCase())),
    )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [category]);

  if (!slug) return <Navigate to="/counselling" replace />;
  if (!category) return <Navigate to="/counselling" replace />;

  const url = `${SITE}/${category.slug}`;
  const listingUrl = categoryListingUrl(category);

  /**
   * Opening a counsellor from a category page is a strong buying signal, so it
   * goes through the same login gate as the main CTA — a visitor who gets that
   * far is worth being able to call back.
   *
   * These stay real <a href> links rather than becoming click handlers: the
   * markup remains crawlable, shareable and middle-clickable, and the gate is
   * applied by intercepting the click only while signed out.
   */
  const handleCounsellorClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    counsellorName: string,
    counsellorId: string,
  ) => {
    if (!category) return;
    persistCounsellingIntent({
      slug: category.slug,
      name: category.name,
      expertise: category.expertise,
      fromPath: `/${category.slug}`,
      counsellorName,
      counsellorId,
    });
    if (isAuthenticated) return; // let the link navigate normally
    event.preventDefault();
    toggleLogin(() => navigate(href));
  };

  const handleGetCounselling = () => {
    // Persist BEFORE the login gate: the lead capture that runs on successful
    // sign-in reads this to record what they asked for and where from.
    persistCounsellingIntent({
      slug: category.slug,
      name: category.name,
      expertise: category.expertise,
      fromPath: `/${category.slug}`,
    });
    if (isAuthenticated) {
      navigate(listingUrl);
      return;
    }
    toggleLogin(() => navigate(listingUrl));
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: category.name,
      provider: { "@type": "Organization", name: "ProCounsel", url: SITE },
      areaServed: { "@type": "Country", name: "India" },
      description: category.description,
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: category.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Counselling", item: `${SITE}/counselling` },
        { "@type": "ListItem", position: 3, name: category.name, item: url },
      ],
    },
  ];

  return (
    <>
      <PageSEO
        title={category.title}
        description={category.description}
        canonical={`/${category.slug}`}
        keywords={categoryKeywords(category)}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#F6F8FE] pb-4">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pt-4">
          <p className="text-[13px] text-gray-500">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-1.5">›</span>
            <Link to="/counselling" className="hover:underline">Counselling</Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-800">{category.name}</span>
          </p>
        </div>

        {/* Hero + primary CTA */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pt-6 pb-10">
          <h1 className="font-[Poppins] text-[26px] md:text-[38px] font-semibold text-[#0E1629] leading-tight max-w-4xl">
            {category.h1}
          </h1>
          <p className="mt-4 text-[15px] md:text-[16px] text-gray-600 leading-relaxed max-w-3xl">
            {category.intro}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={handleGetCounselling}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: ACCENT }}
            >
              Get {category.name}
              <ArrowRight className="h-4 w-4" />
            </button>
            <span className="inline-flex items-center gap-2 text-[13px] text-gray-600">
              <CheckCircle2 className="h-4 w-4" style={{ color: ACCENT }} />
              {category.leadOffer}
            </span>
          </div>
        </section>

        {/* Exams covered — the related keywords, on this page rather than split
            across thin per-exam pages. */}
        {category.exams.length > 0 && (
          <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pb-10">
            <h2 className="font-[Poppins] text-[20px] font-semibold text-[#0E1629] mb-4">
              Entrance exams we counsel for
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.exams.map((e) => (
                <div key={e.name} className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="font-semibold text-[15px] text-gray-800">{e.name}</p>
                  <p className="mt-1 text-[13px] text-gray-500 leading-snug">{e.full}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Free tools — internal links to the pages that already serve this intent */}
        {category.tools.length > 0 && (
          <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pb-10">
            <h2 className="font-[Poppins] text-[20px] font-semibold text-[#0E1629] mb-4">
              Free tools for {category.name.replace(" Counselling", "")} applicants
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {category.tools.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-gray-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2] transition-colors"
                >
                  {t.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Counsellors who list this specialisation. Real people, real links —
            this is what supports the category page's claim to expertise. */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pb-10">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="font-[Poppins] text-[20px] font-semibold text-[#0E1629]">
              Counsellors who specialise in this
            </h2>
            <button
              type="button"
              onClick={handleGetCounselling}
              className="text-[13px] font-semibold hover:underline cursor-pointer"
              style={{ color: ACCENT }}
            >
              See all →
            </button>
          </div>

          {matched.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matched.map((c) => {
                const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Counsellor";
                const exp = c.experience ? `${c.experience} yrs experience` : null;
                const encodedId = encodeCounselorId(c.counsellorId);
                const href = `/counsellor-details/${encodedId}`;
                const photo =
                  c.photoUrlSmall ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2F43F2&color=fff&size=200`;
                return (
                  <Link
                    key={c.counsellorId}
                    to={href}
                    onClick={(e) => handleCounsellorClick(e, href, name, encodedId)}
                    className="block rounded-xl border border-gray-100 bg-white p-4 hover:border-[#2F43F2]/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={photo}
                        alt={name}
                        className="h-14 w-14 shrink-0 rounded-full object-cover border border-gray-100"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 leading-snug truncate">{name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {c.city || "India"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      {(c.rating || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {(c.rating || 0).toFixed(1)}
                        </span>
                      )}
                      {exp && (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {exp}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              We are onboarding counsellors for this specialisation.{" "}
              <button
                type="button"
                onClick={handleGetCounselling}
                className="font-semibold hover:underline cursor-pointer"
                style={{ color: ACCENT }}
              >
                Talk to a general admission counsellor
              </button>{" "}
              in the meantime.
            </p>
          )}
        </section>

        <SeoArticle
          title={`About ${category.name}`}
          intro={category.intro}
          sections={category.sections}
          faqs={category.faqs}
          accent={ACCENT}
          eyebrow={category.name}
        />

        <AdSenseUnit />

        {/* Internal links: sibling categories and the city pages for this one. */}
        <nav
          aria-label="Related counselling"
          className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 py-10 border-t border-gray-100"
        >
          {/*
           * Exam pages, up and down.
           *
           * On a category page these are its exams; on an exam page they are its
           * siblings plus a link back to the parent. Beyond the information
           * architecture this is load-bearing for the build: every URL in the
           * sitemap has to be reachable from a real anchor, and these are the
           * only anchors the exam pages get.
           */}
          {related.length > 0 && (
            <>
              <h2 className="font-[Poppins] text-[16px] font-semibold text-[#0E1629] mb-3">
                {parentCategory
                  ? `Other exam counselling`
                  : `${category.name} by entrance exam`}
              </h2>
              <div className="flex flex-wrap gap-2.5 mb-8">
                {parentCategory && (
                  <Link
                    to={`/${parentCategory.slug}`}
                    className="rounded-lg border border-[#2F43F2]/30 bg-[#2F43F2]/5 px-3.5 py-2 text-[13px] font-medium text-[#2F43F2] hover:border-[#2F43F2] transition-colors"
                  >
                    All {parentCategory.name}
                  </Link>
                )}
                {related.map((r) => (
                  <Link
                    key={r.to}
                    to={r.to}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-gray-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2] transition-colors"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          <h2 className="font-[Poppins] text-[16px] font-semibold text-[#0E1629] mb-3">
            Other counselling we offer
          </h2>
          <div className="flex flex-wrap gap-2.5 mb-8">
            {COUNSELLING_CATEGORIES.filter((c) => c.slug !== category.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-gray-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2] transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {category.cities.length > 0 && (
            <>
              <h2 className="font-[Poppins] text-[16px] font-semibold text-[#0E1629] mb-3">
                {category.name} by city
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {category.cities.map((s) => {
                  const c = getCityBySlug(s);
                  if (!c) return null;
                  return (
                    <Link
                      key={s}
                      to={`/counselling/${s}`}
                      className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] text-gray-700 hover:border-[#2F43F2]/40 hover:text-[#2F43F2] transition-colors"
                    >
                      Counselling in {c.city}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
