import { useMemo } from "react";
import PageSEO from "@/components/SEO/PageSEO";
import { useNavigate, useParams } from "react-router-dom";
import BlogsPageCard from "@/components/Revamp/admissions/BlogsPageCard";
import { useBlogsList } from "@/hooks/useBlogs";
import {
  doesBlogAuthorMatchProfile,
  getAuthorImageWithFallback,
  getAuthorProfileByIdOrSlug,
} from "@/lib/blogAuthors";

export default function BlogAuthorProfilePage() {
  const navigate = useNavigate();
  const { authorId } = useParams<{ authorId: string }>();
  const { data: blogs = [], isLoading } = useBlogsList();

  const profile = getAuthorProfileByIdOrSlug(authorId);

  const authorBlogs = useMemo(() => {
    if (!profile) return [];
    return blogs.filter((blog) => doesBlogAuthorMatchProfile(blog.author, profile));
  }, [blogs, profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F3F7FF] px-5 py-10">
        <p className="text-[#6B7280]">Author profile not found.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(0deg, rgba(198, 221, 240, 0.25), rgba(198, 221, 240, 0.25))",
      }}
    >
      <PageSEO title={`${profile.name} — Author at ProCounsel`} description={`Read career and admissions articles by ${profile.name} on ProCounsel.`} canonical={`/admissions/blog-authors/${authorId}`} />
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
            <button
              type="button"
              onClick={() => navigate("/admissions/blog-authors")}
              className="hover:underline cursor-pointer"
            >
              Authors
            </button>
            <span className="mx-1">{">"}</span>
            <span className="text-(--text-main)">{profile.name}</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-12 py-8 sm:py-10">
        <div className="bg-white rounded-2xl border border-[#E3E8F4] p-5 sm:p-6 mb-8">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-col sm:flex-row">
            <img loading="lazy" decoding="async"
              src={getAuthorImageWithFallback(profile.imageUrl)}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border border-[#E3E8F4]"
              onError={(event) => {
                event.currentTarget.src = "/round-profile.svg";
              }}
            />
            <div>
              <h1 className="text-[24px] sm:text-[30px] font-semibold text-[#0E1629]">{profile.name}</h1>
              <p className="text-[14px] text-[#6B7280] mt-1">{profile.role}</p>
              <p className="text-[14px] text-[#6B7280] mt-3 max-w-3xl">{profile.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.categories.map((category) => (
                  <span
                    key={`${profile.id}-${category}`}
                    className="px-2.5 py-1 rounded-full bg-[#F3F7FF] text-[11px] font-medium text-[#0E1629]"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#0E1629] mb-5">
          Articles by {profile.firstName}
        </h2>

        {isLoading ? (
          <p className="text-[#6B7280] text-[14px]">Loading articles…</p>
        ) : authorBlogs.length === 0 ? (
          <p className="text-[#6B7280] text-[14px]">No articles published yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(308px,308px))] justify-center gap-5">
            {authorBlogs.map((blog) => (
              <BlogsPageCard
                key={blog.id}
                id={blog.id}
                slug={blog.slug}
                title={blog.title}
                author={blog.author}
                publishedOn={blog.publishedOn}
                tag={blog.tag}
                imageUrl={blog.imageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
