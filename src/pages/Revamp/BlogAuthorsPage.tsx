import { useMemo } from "react";
import PageSEO from "@/components/SEO/PageSEO";
import { useNavigate } from "react-router-dom";
import { useBlogsList } from "@/hooks/useBlogs";
import {
  doesBlogAuthorMatchProfile,
  getAllPremadeAuthorProfiles,
  getAuthorImageWithFallback,
} from "@/lib/blogAuthors";

export default function BlogAuthorsPage() {
  const navigate = useNavigate();
  const { data: blogs = [] } = useBlogsList();

  const authors = useMemo(() => {
    const profiles = getAllPremadeAuthorProfiles();
    return profiles.map((profile) => {
      const authoredBlogs = blogs.filter(
        (blog) => doesBlogAuthorMatchProfile(blog.author, profile)
      );

      const categories = Array.from(
        new Set(authoredBlogs.map((blog) => blog.category).filter(Boolean))
      );

      return {
        ...profile,
        blogCount: authoredBlogs.length,
        categories: categories.length > 0 ? categories : profile.categories,
      };
    });
  }, [blogs]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(0deg, rgba(198, 221, 240, 0.25), rgba(198, 221, 240, 0.25))",
      }}
    >
      <PageSEO title="Blog Authors — Career & Admissions Experts | ProCounsel" description="Meet the career experts and writers behind ProCounsel's admissions and career guidance blog." canonical="/admissions/blog-authors" />
      <div className="w-full border-b border-[#E3E8F4] bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 pt-3 pb-3">
          <p className="text-[0.875rem] text-(--text-muted) font-medium">
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
            <span className="text-(--text-main)">Authors</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 py-8 sm:py-10">
        <h1 className="text-[24px] sm:text-[32px] font-semibold text-[#0E1629] mb-2">
          Blog Authors
        </h1>
        <p className="text-[14px] sm:text-[16px] text-[#6B7280] mb-8">
          Explore our authors and read posts by your preferred expert.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {authors.map((author) => (
            <button
              key={author.id}
              type="button"
              onClick={() => navigate(`/admissions/blog-authors/${encodeURIComponent(author.slug)}`)}
              className="w-full text-left rounded-2xl border border-[#E3E8F4] bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <img loading="lazy" decoding="async"
                  src={getAuthorImageWithFallback(author.imageUrl)}
                  alt={author.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#E3E8F4]"
                  onError={(event) => {
                    event.currentTarget.src = "/round-profile.svg";
                  }}
                />
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-[#0E1629] truncate">{author.name}</p>
                  <p className="text-[12px] text-[#6B7280] truncate">{author.role}</p>
                </div>
              </div>

              <p className="text-[13px] text-[#6B7280] leading-relaxed min-h-[54px]">{author.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {author.categories.map((category) => (
                  <span
                    key={`${author.id}-${category}`}
                    className="px-2.5 py-1 rounded-full bg-[#F3F7FF] text-[11px] font-medium text-[#0E1629]"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-[12px] font-medium text-[#2F43F2]">
                {author.blogCount} blog{author.blogCount === 1 ? "" : "s"}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
