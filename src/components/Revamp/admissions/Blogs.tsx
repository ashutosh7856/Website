import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SeeAllButton } from "../components/LeftRightButton";
import BlogCard from "./BlogCard";
import BlogsPageCard from "./BlogsPageCard";
import { useBlogsList } from "@/hooks/useBlogs";

type BlogsVariant = "section" | "full";
type FixedBlogCategory = "All" | "Admissions" | "Scholarships" | "Exams" | "Others";

const FIXED_CATEGORIES: FixedBlogCategory[] = [
  "All",
  "Admissions",
  "Scholarships",
  "Exams",
  "Others",
];

function normalizeBlogCategory(rawCategory?: string): Exclude<FixedBlogCategory, "All"> {
  const value = (rawCategory ?? "").trim().toLowerCase();

  if (!value) return "Others";
  if (value.includes("admission")) return "Admissions";
  if (value.includes("scholar")) return "Scholarships";
  if (
    value.includes("exam") ||
    value.includes("jee") ||
    value.includes("neet") ||
    value.includes("cet") ||
    value.includes("test")
  ) {
    return "Exams";
  }

  return "Others";
}

interface BlogsProps {
  variant?: BlogsVariant;
}

export default function Blogs({ variant = "section" }: BlogsProps) {
  const navigate = useNavigate();
  const { data: blogItems = [], isLoading, isError, error, refetch } =
    useBlogsList();

  // useBlogsList seeds this query from the build-time snapshot, so `blogItems`
  // is already populated when the live refetch fails — which it always does
  // during the prerender, where the API is deliberately blocked. Gating the
  // list on `isError` meant Googlebot was served "Failed to fetch" and zero
  // blog links, leaving every post an orphan URL. Only show the error when
  // there is genuinely nothing to render.
  const showError = isError && blogItems.length === 0;

  const categories = FIXED_CATEGORIES;

  const [activeCategory, setActiveCategory] = useState<FixedBlogCategory>("All");
  const safeCategory =
    categories.includes(activeCategory) ? activeCategory : "All";

  const filteredBlogs = useMemo(() => {
    const list = blogItems;
    if (safeCategory === "All") return list;
    return list.filter((b) => normalizeBlogCategory(b.category) === safeCategory);
  }, [blogItems, safeCategory]);

  const sectionBlogs = useMemo(() => blogItems.slice(0, 2), [blogItems]);
  const showSectionSeeAll = sectionBlogs.length > 0;

  // On the home page, no blogs means no section — an empty "No blogs yet"
  // band is thin content in the crawlable HTML. The full /admissions/blogs
  // page keeps its empty state, since that page is *about* the blog list.
  if (variant === "section" && !isLoading && sectionBlogs.length === 0) return null;

  if (variant === "full") {
    return (
      <div className="bg-[#F3F7FF] w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 sm:py-10">
          <div className="flex gap-3 sm:gap-6 md:gap-6 justify-start sm:justify-evenly mb-6 sm:mb-8 overflow-x-auto pb-1">
            {categories.map((category) => {
              const isActive = safeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-[5px] min-w-[160px] text-[0.875rem] font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-[#0E1629] text-white"
                      : "bg-white text-(--text-main) border border-[rgba(14,22,41,0.25)] hover:border-[#0E1629]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(308px,308px))] justify-center gap-5 animate-pulse">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`blog-full-skeleton-${idx}`}
                  className="w-77 h-65 rounded-2xl bg-white/80"
                />
              ))}
            </div>
          )}
          {showError && (
            <div className="text-center py-12 space-y-3">
              <p className="text-red-600 text-[0.875rem]">
                {(error as Error)?.message ?? "Could not load blogs."}
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
          {!isLoading && !showError && filteredBlogs.length === 0 && (
            <p className="text-center text-(--text-muted) py-12 text-[0.875rem]">
              No blogs in this category yet.
            </p>
          )}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(308px,308px))] justify-center gap-5">
            {!isLoading &&
              !showError &&
              filteredBlogs.map((blog) => (
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#C6DDF040] w-full h-full">
      <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-[45%_auto] md:gap-6 mx-auto px-4 md:px-8 py-6 md:py-10 gap-y-6 md:gap-y-8">
        <div>
          <div className="flex items-center justify-start gap-[8px] md:gap-2 bg-white px-[12px] md:px-3 py-[4px] md:py-1 rounded-[4px] md:rounded-[6px] w-[125px] md:w-fit shrink-0">
            <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] md:w-4 md:h-4 bg-[#0E1629] shrink-0" />
            <p className="font-[Poppins] font-semibold text-[12px] md:text-[0.875rem] text-[#0E1629] md:text-(--text-main) uppercase md:capitalize tracking-[0.07em] md:tracking-normal leading-none md:leading-normal">
              BLOGS
            </p>
          </div>

          <h2 className="mt-3 md:mt-5 max-w-[350px] md:max-w-[554px] font-[Poppins] font-medium text-[12px] md:text-[1.25rem] text-[#0E1629] md:text-(--text-muted) leading-[1.4] md:leading-normal">
            Get practical guidance on admissions, exam strategy, and timelines
            from our latest student-focused articles.
          </h2>
        </div>

        <div className="flex min-w-0 flex-col gap-6 md:gap-10.5">
          {/* Scrolls sideways until xl: two cards do not fit the lg column. */}
          <div className="flex gap-[12px] md:gap-6 overflow-x-auto xl:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 md:pb-0">
            
            {/* API States (From Current) */}
            {isLoading && (
              <div className="flex gap-[12px] md:gap-9 w-full animate-pulse">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={`blog-section-skeleton-${idx}`} className="shrink-0 w-[250px] md:w-[300px] h-[180px] rounded-2xl bg-white/80" />
                ))}
              </div>
            )}
            
            {showError && (
              <p className="text-red-600 text-[0.875rem] w-full">
                {(error as Error)?.message ?? "Could not load blogs."}
              </p>
            )}

            {/* Dynamic Map (From Current) + Layout Wrapper (From Incoming) */}
            {!isLoading &&
              !showError &&
              sectionBlogs.map((blog) => (
                <div key={blog.id} className="shrink-0">
                  <BlogCard
                    id={blog.id}
                    slug={blog.slug}
                    title={blog.title}
                    author={blog.author}
                    readTime={blog.readTime}
                    imageUrl={blog.imageUrl}
                  />
                </div>
              ))}

            {/* Empty State (From Current) */}
            {!isLoading && !showError && sectionBlogs.length === 0 && (
              <p className="text-(--text-muted) text-[0.875rem]">
                No blogs yet.
              </p>
            )}
          </div>

          {/* See All Button Section */}
          {showSectionSeeAll && (
            <div className="flex items-center justify-end mt-2 md:mt-0 w-full">
              <div className="scale-[0.85] md:scale-100 origin-center md:origin-right">
                <SeeAllButton onClick={() => navigate("/admissions/blogs")} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}