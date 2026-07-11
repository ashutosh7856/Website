import ListingShell from "@/components/Revamp/listing/ListingShell";
import CollegeCard from "@/components/Revamp/probuddies/CollegeCard";
import { probuddiesApi } from "@/api/pro-buddies";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import PageSEO from "@/components/SEO/PageSEO";

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "probuddies-high", label: "ProBuddies: High to Low" },
  { value: "probuddies-low", label: "ProBuddies: Low to High" },
  { value: "name", label: "Name: A to Z" },
];

export default function CollegeListing() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [stateFilter, setStateFilter] = useState("");
  const [openSection, setOpenSection] = useState<"location" | null>("location");

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ["probuddy-colleges-listing"],
    queryFn: () => probuddiesApi.getColleges(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const filteredColleges = useMemo(() => {
    let items = colleges.filter((item) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        item.collegeName.toLowerCase().includes(searchText) ||
        (item.collegeCity ?? "").toLowerCase().includes(searchText) ||
        (item.collegeState ?? "").toLowerCase().includes(searchText);
      const matchesState =
        !stateFilter ||
        (item.collegeState ?? "").toLowerCase().includes(stateFilter.toLowerCase()) ||
        (item.collegeCity ?? "").toLowerCase().includes(stateFilter.toLowerCase());

      return matchesSearch && matchesState;
    });

    if (sortBy === "probuddies-high") {
      items = [...items].sort((a, b) => b.proBuddyCount - a.proBuddyCount);
    } else if (sortBy === "probuddies-low") {
      items = [...items].sort((a, b) => a.proBuddyCount - b.proBuddyCount);
    } else if (sortBy === "name") {
      items = [...items].sort((a, b) => a.collegeName.localeCompare(b.collegeName));
    }

    return items;
  }, [colleges, search, sortBy, stateFilter]);

  const toggleSection = (section: "location") => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const activeFilterCount = stateFilter ? 1 : 0;

  const sidebar = (
    <div className="w-full">
      <h1 className="sr-only">Colleges on ProCounsel — Explore Admissions, Courses &amp; Cutoffs</h1>
      <div className="box-border flex flex-row justify-between items-center px-5 py-4 w-full h-[64px] bg-white border border-[#E6E6E6] rounded-[8px]">
        <div className="flex flex-row justify-center items-center gap-[12px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1629" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
            <circle cx="8" cy="6" r="2" fill="white" />
            <circle cx="16" cy="12" r="2" fill="white" />
            <circle cx="11" cy="18" r="2" fill="white" />
          </svg>
          <span className="font-[Poppins] font-semibold text-[16px] text-[#0E1629]">Filters</span>
        </div>
        {activeFilterCount > 0 && (
          <div className="flex flex-col justify-center items-center px-[10px] py-[6px] w-[28px] h-[28px] bg-[#0E1629] rounded-[4px]">
            <span className="font-[Arial] font-semibold text-[12px] text-white">{activeFilterCount}</span>
          </div>
        )}
      </div>

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "location" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("location")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Location</h3>
          {openSection === "location" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "location" && (
          <div className="w-full px-5 pt-[16px] flex flex-col gap-[10px]">
            <input
              type="text"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              placeholder="City or State"
              className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] text-[14px] font-[Poppins]"
            />
          </div>
        )}
      </div>

      <div className="hidden lg:block w-full mt-4 mb-[70px]">
        <button
          onClick={() => setStateFilter("")}
          disabled={activeFilterCount === 0}
          className={`w-full h-[48px] rounded-[8px] font-[Poppins] font-medium text-[16px] transition-all border outline-none ${
            activeFilterCount > 0
              ? "bg-white border-[#0E1629] text-[#0E1629] hover:bg-[#F8F9FA] cursor-pointer"
              : "bg-[#F9F9F9] border-[#E6E6E6] text-[#A0A0A0] cursor-not-allowed"
          }`}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  const content = isLoading ? (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={`college-skeleton-${idx}`} className="h-66.5 md:h-82.75 rounded-xl bg-white/90 animate-pulse" />
      ))}
    </div>
  ) : (
    <>
      <p className="mb-4 text-sm text-[#6B7280]">{filteredColleges.length} results found</p>
      {filteredColleges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center text-[#6B7280]">
          No colleges match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
          {filteredColleges.map((college) => (
            <div key={college.collegeName} className="w-full flex justify-center">
              <CollegeCard {...college} />
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <PageSEO
        title="College Listing – Browse Colleges with ProBuddies"
        description="Explore colleges and find ProBuddies (senior students) from each institution. Get insider advice on admissions, campus life, courses, and placements from real students."
        canonical="/pro-buddies/college-listing"
        keywords="college listing India, college ProBuddies, engineering colleges, medical colleges, senior student mentors"
      />
    <ListingShell
      title=""
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search colleges"
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortOptions={sortOptions}
      sidebar={sidebar}
      content={content}
    />
    </>
  );
}
