import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useBlogDetail, useBlogsList } from "@/hooks/useBlogs";
import { formatPublishedHeading } from "@/api/blogs";
import { getAuthorImageWithFallback, getAuthorProfileByName } from "@/lib/blogAuthors";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

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

function normalizeDescriptionToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (hasHtml) return sanitizeHtml(trimmed);

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
    () => (blog?.description ? normalizeDescriptionToHtml(blog.description) : ""),
    [blog?.description]
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
    const canonicalUrl = `https://www.procounsel.co.in/admissions/blogs/slug/${encodeURIComponent(blog.slug)}`;
    const pageTitle = `${blog.metaTitle || blog.title} | ProCounsel Blog`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title,
      author: { "@type": "Person", name: blog.author || "ProCounsel" },
      datePublished: blog.publishedOnMillis != null ? new Date(blog.publishedOnMillis).toISOString() : undefined,
      dateModified: blog.publishedOnMillis != null ? new Date(blog.publishedOnMillis).toISOString() : undefined,
      image: blog.imageUrl || undefined,
      articleSection: blog.category,
      keywords: blog.keywords,
      description: metaDescription,
      mainEntityOfPage: canonicalUrl,
      publisher: { "@type": "Organization", name: "ProCounsel", logo: "https://www.procounsel.co.in/favicon.png" },
    };
    return { pageTitle, metaDescription, keywords, canonicalUrl, jsonLd };
  }, [blog]);

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
        <Helmet>
          <title>{blogSeo.pageTitle}</title>
          <meta name="description" content={blogSeo.metaDescription} />
          {blogSeo.keywords && <meta name="keywords" content={blogSeo.keywords} />}
          <link rel="canonical" href={blogSeo.canonicalUrl} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={blogSeo.pageTitle} />
          <meta property="og:description" content={blogSeo.metaDescription} />
          <meta property="og:url" content={blogSeo.canonicalUrl} />
          {blog?.imageUrl && <meta property="og:image" content={blog.imageUrl} />}
          <meta name="twitter:card" content={blog?.imageUrl ? "summary_large_image" : "summary"} />
          <meta name="twitter:title" content={blogSeo.pageTitle} />
          <meta name="twitter:description" content={blogSeo.metaDescription} />
          {blog?.imageUrl && <meta name="twitter:image" content={blog.imageUrl} />}
          <script type="application/ld+json">{JSON.stringify(blogSeo.jsonLd)}</script>
        </Helmet>
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
          <button
            type="button"
            onClick={() => navigate("/admissions")}
            className="hover:underline cursor-pointer"
          >
            Admission
          </button>
          <span className="mx-1">{">"}</span>
          <button
            type="button"
            onClick={() => navigate("/admissions/blogs")}
            className="hover:underline cursor-pointer"
          >
            Blogs
          </button>
          <span className="mx-1">{">"}</span>
          <span className="text-(--text-main)">{breadcrumbTitle}</span>
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
          </>
        )}
      </div>
    </div>
    </>
  );
}
