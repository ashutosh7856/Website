import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";
import QuickLeadForm from "@/components/leads/QuickLeadForm";
import { useBlogDetail, useBlogsList } from "@/hooks/useBlogs";
import { formatPublishedHeading } from "@/api/blogs";
import { getAuthorImageWithFallback, getAuthorProfileByName } from "@/lib/blogAuthors";
import { demoteBodyHeadings, dropRedundantLeadingHeading } from "@/lib/blogHtml";
import { relatedBlogs, relatedCounsellingPage } from "@/lib/blogRelated";
import { absoluteUrl } from "@/lib/siteUrl.mjs";
import AdSenseUnit from "@/components/ads/AdSenseUnit";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return demoteBodyHeadings(html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(demoteBodyHeadings(html), "text/html");

  doc.querySelectorAll("script, style, iframe, object, embed").forEach((node) => node.remove());

  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

function normalizeDescriptionToHtml(text: string, title = ""): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (hasHtml) return dropRedundantLeadingHeading(sanitizeHtml(trimmed), title);

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`);

  return paragraphs.join("");
}

function stripHtmlToText(html: string): string {
  if (!html.trim()) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function truncateForMeta(text: string, maxLength = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}


export default function BlogDetailPage() {
  const navigate = useNavigate();
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { data: blogList = [], isLoading: isBlogListLoading } = useBlogsList({
    enabled: Boolean(slug),
  });

  const slugMatch = useMemo(() => {
    if (!slug) return null;
    const normalized = slug.trim().toLowerCase();
    return (
      blogList.find((item) => item.slug.trim().toLowerCase() === normalized) ?? null
    );
  }, [blogList, slug]);

  const resolvedBlogKey = id ?? slugMatch?.id ?? slug;
  const shouldFetchDetail =
    Boolean(id) ||
    Boolean(slugMatch?.id) ||
    (Boolean(slug) && !isBlogListLoading && blogList.length === 0);

  const {
    data: blog,
    isLoading,
    isError,
    error,
    refetch,
  } = useBlogDetail(shouldFetchDetail ? resolvedBlogKey : undefined);
  const [authorImage, setAuthorImage] = useState("/person.svg");

  const authorProfile = useMemo(
    () => getAuthorProfileByName(blog?.author),
    [blog?.author]
  );

  useEffect(() => {
    setAuthorImage(getAuthorImageWithFallback(authorProfile.imageUrl));
  }, [authorProfile.imageUrl]);

  useEffect(() => {
    if (!blog?.slug || !id) return;
    navigate(`/admissions/blogs/slug/${encodeURIComponent(blog.slug)}`, {
      replace: true,
    });
  }, [blog?.slug, id, navigate]);

  const descriptionHtml = useMemo(
    () => (blog?.description ? normalizeDescriptionToHtml(blog.description, blog.title) : ""),
    [blog?.description, blog?.title]
  );

  const blogSeo = useMemo(() => {
    if (!blog) return null;
    const plainText = stripHtmlToText(blog.description ?? "");
    const metaDescription = truncateForMeta(plainText || `Read ${blog.title} on ProCounsel.`);
    const keywordSet = new Set<string>([
      ...blog.keywords,
      ...blog.keyphrase,
      blog.category,
      "college admissions",
      "education counseling",
    ]);
    const keywords = Array.from(keywordSet).map((k) => k.trim()).filter(Boolean).join(", ");
    const canonicalPath = `/admissions/blogs/slug/${encodeURIComponent(blog.slug)}`;
    const canonicalUrl = absoluteUrl(canonicalPath);
    const pageTitle = `${blog.metaTitle || blog.title} | ProCounsel Blog`;
    const published = blog.publishedOnMillis;
    // An edit time only counts if it is real and not before publication — a
    // missing Firestore timestamp can deserialize as epoch 0.
    const modified =
      blog.updatedAtMillis != null && blog.updatedAtMillis > 0 && (published == null || blog.updatedAtMillis >= published)
        ? blog.updatedAtMillis
        : published;
    const blogPosting = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title,
      author: { "@type": "Person", name: blog.author || "ProCounsel" },
      datePublished: published != null ? new Date(published).toISOString() : undefined,
      dateModified: modified != null ? new Date(modified).toISOString() : undefined,
      image: blog.imageUrl || undefined,
      articleSection: blog.category,
      keywords: blog.keywords,
      description: metaDescription,
      url: canonicalUrl,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      publisher: {
        "@type": "Organization",
        name: "ProCounsel",
        url: absoluteUrl("/"),
        logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.png") },
      },
    };
    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blogs", item: absoluteUrl("/admissions/blogs") },
        { "@type": "ListItem", position: 3, name: blog.title, item: canonicalUrl },
      ],
    };
    return { pageTitle, metaDescription, keywords, canonicalPath, jsonLd: [blogPosting, breadcrumbList] };
  }, [blog]);

  // End-of-post links: same-category posts and the counselling page this post
  // most naturally leads to. Both are computed from the build-time snapshot
  // too, so they are real <a href>s in the prerendered HTML.
  const related = useMemo(() => (blog ? relatedBlogs(blog, blogList) : []), [blog, blogList]);
  const counsellingLink = useMemo(() => (blog ? relatedCounsellingPage(blog) : null), [blog]);

  const publishedLabel = blog
    ? blog.publishedOnMillis != null
      ? formatPublishedHeading(blog.publishedOnMillis)
      : blog.publishedOn.replace(/^Published\s*on:\s*/i, "") || "—"
    : "";
  const breadcrumbTitle =
    blog && blog.title.length > 42
      ? `${blog.title.slice(0, 42)}…`
      : blog?.title ?? "Blog";

  const mobileTitle =
    blog && blog.title.length > 28
      ? `${blog.title.slice(0, 28)}…`
      : blog?.title ?? "Blog";

  return (
    <>
      {blogSeo && (
        <PageSEO
          title={blogSeo.pageTitle}
          description={blogSeo.metaDescription}
          canonical={blogSeo.canonicalPath}
          keywords={blogSeo.keywords || undefined}
          image={blog?.imageUrl || undefined}
          type="article"
          jsonLd={blogSeo.jsonLd}
        />
      )}
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(0deg, rgba(198, 221, 240, 0.25), rgba(198, 221, 240, 0.25))",
      }}
    >
      <div className="sm:hidden w-full bg-white border-b border-[#E3E8F4]">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-(--text-main) cursor-pointer text-[16px] font-semibold"
            aria-label="Go back"
          >
            {"<"}
          </button>
          <span className="text-[16px] font-semibold text-(--text-main) truncate">
            {isLoading ? "Loading…" : mobileTitle}
          </span>
        </div>
      </div>

      <div className="hidden sm:block w-full border-b border-[#E3E8F4] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] pt-3 pb-3 text-[0.875rem] text-(--text-muted) font-medium">
          <nav aria-label="Breadcrumb">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            <span className="mx-1" aria-hidden="true">{">"}</span>
            <Link to="/admissions/blogs" className="hover:underline">
              Blogs
            </Link>
            <span className="mx-1" aria-hidden="true">{">"}</span>
            <span className="text-(--text-main)" aria-current="page">{breadcrumbTitle}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-[60px] py-6 sm:py-8">
        {isLoading && (
          <p className="text-(--text-muted) text-[0.875rem]">Loading article…</p>
        )}
        {isError && (
          <div className="space-y-3">
            <p className="text-red-600 text-[0.875rem]">
              {(error as Error)?.message ?? "Could not load this blog."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[0.875rem] font-medium text-[#0E1629] underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
        {!isLoading && !isError && !blog && (
          <p className="text-(--text-muted) text-[0.875rem]">
            This blog could not be found.
          </p>
        )}
        {blog && (
          <>
            <h1 className="text-[24px] sm:text-[40px] font-semibold text-[#0E1629] leading-snug">
              {blog.title}
            </h1>
            <button
              type="button"
              onClick={() =>
                navigate(`/admissions/blog-authors/${encodeURIComponent(authorProfile.slug)}`)
              }
              className="mt-3 sm:mt-4 flex items-center gap-3 cursor-pointer"
            >
              <img loading="lazy" decoding="async"
                src={authorImage}
                alt={authorProfile.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-[#E3E8F4]"
                onError={() => setAuthorImage("/round-profile.svg")}
              />
              <span className="text-[14px] sm:text-[22px] text-[#0E1629] font-medium">
                {authorProfile.name}
              </span>
            </button>
            <p className="mt-1 text-[12px] sm:text-[18px] font-medium text-(--text-muted)">
              Published On: {publishedLabel}
            </p>

            {/* {hasHeroImage && (
              <div className="relative mt-4 sm:mt-6 rounded-[16px] overflow-hidden w-full h-[180px] sm:h-[413px]">
                {isHeroImageLoading && (
                  <div className="absolute inset-0 bg-[#E5ECF7] animate-pulse" />
                )}
                <img loading="lazy" decoding="async"
                  ref={heroImageRef}
                  src={blog.imageUrl}
                  alt={blog.title}
                  onLoadStart={() => setIsHeroImageLoading(true)}
                  onLoad={() => setIsHeroImageLoading(false)}
                  onError={() => setIsHeroImageLoading(false)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isHeroImageLoading ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>
            )} */}

            <div
              className="mt-4 sm:mt-6 text-[12px] sm:text-[18px] font-medium leading-relaxed text-[#6B7280] [&_p]:mb-4 sm:[&_p]:mb-6 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:mb-1 [&_strong]:text-[#0E1629]"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
            <AdSenseUnit className="mt-5 px-0 sm:px-0" />

            <section
              aria-label="Talk to a counsellor"
              className="mt-8 sm:mt-10 grid gap-6 rounded-2xl bg-[#0E1629] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center"
            >
              <div>
                <h2 className="font-[Poppins] text-[20px] sm:text-[26px] font-semibold leading-snug text-white">
                  Need help applying this to your own admission?
                </h2>
                <p className="mt-3 text-[14px] sm:text-[16px] leading-relaxed text-white/70">
                  A ProCounsel counsellor can look at your scores, budget and preferences and tell
                  you which colleges and options actually fit. The first call is free.
                </p>
                {counsellingLink && (
                  <Link
                    to={counsellingLink.to}
                    className="mt-5 inline-flex items-center gap-2 text-[14px] sm:text-[15px] font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Explore {counsellingLink.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <QuickLeadForm
                formId="blog_post"
                intent={`Blog: ${blog.title}`}
                course={counsellingLink?.course}
                exam={counsellingLink?.exam}
              />
            </section>

            {(related.length > 0 || counsellingLink) && (
              <nav aria-label="Related" className="mt-8 sm:mt-10">
                <h2 className="font-[Poppins] text-[18px] sm:text-[22px] font-semibold text-[#0E1629]">
                  Related
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {counsellingLink && (
                    <li>
                      <Link
                        to={counsellingLink.to}
                        className="flex h-full items-center justify-between gap-3 rounded-xl border border-[#2F43F2]/30 bg-white p-4 text-[14px] sm:text-[15px] font-semibold text-[#2F43F2] hover:border-[#2F43F2] transition-colors"
                      >
                        {counsellingLink.name}
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </li>
                  )}
                  {related.map((b) => (
                    <li key={b.id}>
                      <Link
                        to={`/admissions/blogs/slug/${encodeURIComponent(b.slug)}`}
                        className="flex h-full flex-col rounded-xl border border-[#E3E8F4] bg-white p-4 hover:border-[#2F43F2]/40 transition-colors"
                      >
                        <span className="text-[14px] sm:text-[15px] font-semibold leading-snug text-[#0E1629]">
                          {b.title}
                        </span>
                        <span className="mt-1 text-[12px] sm:text-[13px] text-(--text-muted)">{b.readTime}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
