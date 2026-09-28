import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import ListingShell from "@/components/Revamp/listing/ListingShell";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import ErrorState from "@/components/common/ErrorState";
import { academicApi } from "@/api/academic";
import { COLLEGES_SNAPSHOT } from "@/data/contentSnapshot";
import type { CollegeApiResponse } from "@/types/academic";

// Same build-time seed the home page section uses. The API is blocked during
// prerender, so without it this page would ship as filter chrome with no
// colleges — and, worse, with no <a> to any /college-details/:id.
const SNAPSHOT = COLLEGES_SNAPSHOT as unknown as CollegeApiResponse[];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "name", label: "Name: A to Z" },
  { value: "established-new", label: "Established: Newest" },
  { value: "established-old", label: "Established: Oldest" },
];

const collegesGuide = {
  title: "How to Find the Right College in India",
  intro:
    "A college shortlist should balance academic fit, admission eligibility, location, fees and the experience you want from campus life. Use this directory to discover colleges, then open each verified profile for the details that matter to your decision.",
  sections: [
    {
      heading: "Compare More Than a College Name",
      paragraphs: [
        "Start with the course and branch you want, then compare college type, location, accreditation, facilities and admission requirements. A famous name is useful only when the program and learning environment match your goals.",
      ],
      bullets: [
        "Check the exact program and specialisation offered",
        "Compare city, campus setting and college type",
        "Review accreditation, establishment year and available facilities",
      ],
    },
    {
      heading: "Build a Balanced Admission Shortlist",
      paragraphs: [
        "Keep a mix of ambitious, realistic and safer options. Entrance-exam rank, category, domicile rules and counselling rounds can all affect your chances, so avoid depending on a single college or cutoff from one year.",
      ],
      bullets: [
        "Group colleges by expected admission probability",
        "Check official eligibility and counselling requirements",
        "Keep backup choices that still meet your academic goals",
      ],
    },
    {
      heading: "Use Verified Profiles and Student Insight",
      paragraphs: [
        "ProCounsel brings college information, admission guidance and first-hand student insight into one journey. After shortlisting a college, connect with a ProBuddy to understand campus life, hostels, teaching and placements beyond the brochure.",
      ],
    },
    {
      heading: "Plan the Next Admission Step",
      paragraphs: [
        "Once your shortlist is ready, track deadlines, prepare documents and arrange choices in the correct order. A counsellor can help you interpret cutoffs and avoid mistakes during registration, counselling and choice filling.",
      ],
    },
  ],
  faqs: [
    {
      question: "How do I search for colleges on ProCounsel?",
      answer:
        "Use the search box to find a college by name, city or state. You can also filter by location and college type, then sort the results alphabetically, by popularity or by establishment year.",
    },
    {
      question: "What should I compare before choosing a college?",
      answer:
        "Compare the course and branch, eligibility, likely cutoff, fees, accreditation, location, facilities, placements and campus environment. Give each factor a weight based on your own priorities.",
    },
    {
      question: "Can ProCounsel help after I shortlist colleges?",
      answer:
        "Yes. You can speak with admission counsellors for strategy and connect with ProBuddies for first-hand insight into a specific college and its campus experience.",
    },
    {
      question: "Is the college directory free to browse?",
      answer:
        "Yes. You can search, filter and open the available college profiles without paying to browse the directory.",
    },
  ],
};

const fallbackLogo = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F3F4F6&color=374151&size=400`;

function CollegeGridCard({ college }: { college: CollegeApiResponse }) {
  const location = [college.collegesLocationCity, college.collegesLocationState]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[#E6E6E6] bg-white p-4 transition-all duration-200 hover:border-[#0E1629] hover:shadow-[0_6px_24px_rgba(14,22,41,0.08)] md:p-5">
      <div className="flex items-start gap-3 md:gap-4">
        <img
          loading="lazy"
          decoding="async"
          src={college.logoUrl || fallbackLogo(college.collegeName)}
          alt=""
          className="h-14 w-14 shrink-0 rounded-xl object-cover md:h-16 md:w-16"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-[Poppins] text-[14px] leading-snug font-medium text-[#0E1629] md:text-[16px]">
            {/* A real href — the crawl path to every college detail page runs
                through this listing now, not through the home page reveal. */}
            <Link
              to={`/college-details/${college.collegeId}`}
              className="line-clamp-2 after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {college.collegeName}
            </Link>
          </h2>
          {location && (
            <p className="mt-1.5 flex items-center gap-1 font-[Poppins] text-[12px] text-[#6B7280] md:text-[13px]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </p>
          )}
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-[#D1D5DB] transition-colors group-hover:text-[#0E1629]" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {college.collegeType && (
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 font-[Poppins] text-[11px] font-medium text-[#0E1629] md:text-[12px]">
            {college.collegeType}
          </span>
        )}
        {college.establishedYear && (
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 font-[Poppins] text-[11px] font-medium text-[#6B7280] md:text-[12px]">
            Est. {college.establishedYear}
          </span>
        )}
        {college.accreditation && (
          <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 font-[Poppins] text-[11px] font-medium text-[#6B7280] md:text-[12px]">
            {college.accreditation}
          </span>
        )}
      </div>
    </article>
  );
}

export default function CollegesPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [stateFilter, setStateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openSection, setOpenSection] = useState<"location" | "type" | null>("location");

  const { data: colleges = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["colleges-listing"],
    queryFn: () => academicApi.getColleges(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: SNAPSHOT.length ? SNAPSHOT : undefined,
    initialDataUpdatedAt: 0,
    placeholderData: (previous) => previous,
  });

  const collegeTypes = useMemo(
    () =>
      Array.from(
        new Set(colleges.map((c) => (c.collegeType || "").trim()).filter(Boolean)),
      ).sort(),
    [colleges],
  );

  const filteredColleges = useMemo(() => {
    const query = search.trim().toLowerCase();
    const place = stateFilter.trim().toLowerCase();

    let items = colleges.filter((college) => {
      const matchesSearch =
        !query ||
        college.collegeName.toLowerCase().includes(query) ||
        (college.collegesLocationCity ?? "").toLowerCase().includes(query) ||
        (college.collegesLocationState ?? "").toLowerCase().includes(query);
      const matchesPlace =
        !place ||
        (college.collegesLocationCity ?? "").toLowerCase().includes(place) ||
        (college.collegesLocationState ?? "").toLowerCase().includes(place);
      const matchesType = !typeFilter || college.collegeType === typeFilter;
      return matchesSearch && matchesPlace && matchesType;
    });

    const year = (c: CollegeApiResponse) => Number(c.establishedYear) || 0;
    if (sortBy === "name") {
      items = [...items].sort((a, b) => a.collegeName.localeCompare(b.collegeName));
    } else if (sortBy === "established-new") {
      items = [...items].sort((a, b) => year(b) - year(a));
    } else if (sortBy === "established-old") {
      items = [...items].sort((a, b) => year(a) - year(b));
    } else {
      items = [...items].sort(
        (a, b) => (b.popularityCount ?? 0) - (a.popularityCount ?? 0),
      );
    }

    return items;
  }, [colleges, search, stateFilter, typeFilter, sortBy]);

  const activeFilterCount = (stateFilter ? 1 : 0) + (typeFilter ? 1 : 0);
  const toggleSection = (section: "location" | "type") =>
    setOpenSection((prev) => (prev === section ? null : section));

  const sidebar = (
    <div className="w-full">
      <div className="box-border flex h-[64px] w-full flex-row items-center justify-between rounded-[8px] border border-[#E6E6E6] bg-white px-5 py-4">
        <span className="font-[Poppins] text-[16px] font-semibold text-[#0E1629]">Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[4px] bg-[#0E1629] text-[12px] font-semibold text-white">
            {activeFilterCount}
          </span>
        )}
      </div>

      <div className="mt-[12px] w-full rounded-[8px] border border-[#E6E6E6] bg-white">
        <button
          type="button"
          onClick={() => toggleSection("location")}
          className="flex w-full cursor-pointer flex-row items-center justify-between border-b border-[#E6E6E6] px-5 py-5"
        >
          <h3 className="font-[Poppins] text-[16px] font-medium text-[#242645]">Location</h3>
          {openSection === "location" ? (
            <ChevronDown className="h-5 w-5 text-[#242645]" />
          ) : (
            <ChevronRight className="h-5 w-5 text-[#242645]" />
          )}
        </button>
        {openSection === "location" && (
          <div className="w-full px-5 py-4">
            <input
              type="text"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              placeholder="City or State"
              className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] font-[Poppins] text-[14px] outline-none focus:border-[#0E1629]"
            />
          </div>
        )}
      </div>

      {collegeTypes.length > 0 && (
        <div className="mt-[12px] w-full rounded-[8px] border border-[#E6E6E6] bg-white">
          <button
            type="button"
            onClick={() => toggleSection("type")}
            className="flex w-full cursor-pointer flex-row items-center justify-between border-b border-[#E6E6E6] px-5 py-5"
          >
            <h3 className="font-[Poppins] text-[16px] font-medium text-[#242645]">College type</h3>
            {openSection === "type" ? (
              <ChevronDown className="h-5 w-5 text-[#242645]" />
            ) : (
              <ChevronRight className="h-5 w-5 text-[#242645]" />
            )}
          </button>
          {openSection === "type" && (
            <div className="flex w-full flex-wrap gap-2 px-5 py-4">
              {collegeTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter((prev) => (prev === type ? "" : type))}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 font-[Poppins] text-[12px] transition-colors ${
                    typeFilter === type
                      ? "border-[#0E1629] bg-[#0E1629] text-white"
                      : "border-[#E6E6E6] bg-white text-[#242645] hover:border-[#0E1629]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 mb-[70px] hidden w-full lg:block">
        <button
          type="button"
          onClick={() => {
            setStateFilter("");
            setTypeFilter("");
          }}
          disabled={activeFilterCount === 0}
          className={`h-[48px] w-full rounded-[8px] border font-[Poppins] text-[16px] font-medium transition-all outline-none ${
            activeFilterCount > 0
              ? "cursor-pointer border-[#0E1629] bg-white text-[#0E1629] hover:bg-[#F8F9FA]"
              : "cursor-not-allowed border-[#E6E6E6] bg-[#F9F9F9] text-[#A0A0A0]"
          }`}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  const body =
    isError && colleges.length === 0 ? (
      <ErrorState
        variant="inline"
        title="Couldn't load colleges"
        message="We couldn't reach the college directory. Please try again in a moment."
        onRetry={() => refetch()}
        showBack={false}
      />
    ) : isLoading ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div
            key={`college-skeleton-${idx}`}
            className="h-[160px] animate-pulse rounded-2xl bg-white/90"
          />
        ))}
      </div>
    ) : (
      <>
        <p className="mb-4 text-sm text-[#6B7280]">
          {filteredColleges.length} {filteredColleges.length === 1 ? "college" : "colleges"} found
        </p>

        {filteredColleges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center text-[#6B7280]">
            No colleges match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {filteredColleges.map((college) => (
              <CollegeGridCard key={college.collegeId} college={college} />
            ))}
          </div>
        )}
      </>
    );

  return (
    <>
      <PageSEO
        title="Colleges in India — Verified Profiles & Admissions | ProCounsel"
        description="Browse verified college profiles on ProCounsel. Compare location, college type, courses offered and admission details to shortlist the right institute."
        canonical="/colleges"
      />
      <section className="relative overflow-hidden bg-[#0E1629] text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2F43F2]/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-[#FA660F]/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-360 px-4 py-12 md:px-15 md:py-16">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 font-[Poppins] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
            College Directory
          </span>
          <h1 className="mt-4 max-w-4xl font-[Poppins] text-[30px] font-bold leading-[1.18] md:text-[46px]">
            Find the Right College for Your Next Chapter
          </h1>
          <p className="mt-4 max-w-3xl font-[Poppins] text-[14px] leading-7 text-white/75 md:text-[17px]">
            Explore {colleges.length > 0 ? `${colleges.length} ` : ""}college profiles, compare locations and institute types, and build a smarter admission shortlist with ProCounsel.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {["Verified profiles", "Location filters", "Direct college details"].map((item) => (
              <span key={item} className="rounded-lg bg-white/10 px-3 py-2 font-[Poppins] text-[12px] text-white/90 ring-1 ring-white/15">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <ListingShell
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search colleges, city or state"
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        sidebar={sidebar}
        content={body}
      />
      <SeoArticle
        {...collegesGuide}
        eyebrow="College Selection Guide"
        accent="#2F43F2"
      />
    </>
  );
}
