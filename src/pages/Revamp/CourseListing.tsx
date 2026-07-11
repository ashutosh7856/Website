import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import MobileCourseBottomNav from "@/components/Revamp/courses/MobileCourseBottomNav";
import CourseCard from "@/components/Revamp/courses/CourseCard";
import ListingShell from "@/components/Revamp/listing/ListingShell";
import {
  getAllCounsellorCoursesForGuest,
  getAllCounsellorCoursesForUser,
} from "@/api/course";
import type { CourseType } from "@/types/course";

type CourseListItem = {
  course: CourseType;
  soldCount: number;
  purchased: boolean;
};

const normalizeCourses = (response: any): CourseListItem[] => {
  const list = Array.isArray(response?.data) ? response.data : [];
  return list.map((item: any, index: number) => ({
    course: {
      id: String(item?.courseId ?? `course-${index}`),
      name: String(item?.courseName ?? "Course"),
      image: String(item?.courseThumbnailUrl ?? "/course/2.webp"),
      subject: String(item?.category ?? "General"),
      price: `₹${Number(item?.coursePriceAfterDiscount ?? item?.coursePrice ?? 0).toLocaleString("en-IN")}`,
      rating: String(Number(item?.rating ?? 0).toFixed(1)),
      courseTimeHours: Number(item?.courseTimeHours ?? 0),
      courseTimeMinutes: Number(item?.courseTimeMinutes ?? 0),
    },
    soldCount: Number(item?.soldCount ?? 0),
    purchased: Boolean(item?.purchasedByMe ?? false),
  }));
};

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating: High to Low" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const PAGE_SIZE = 6;

export default function CourseListing() {
  const userId = localStorage.getItem("phone") || "";
  const token = localStorage.getItem("jwt") || "";
  const isUserLoggedIn = Boolean(userId && token);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openSection, setOpenSection] = useState<"category" | "price" | "rating" | null>("category");
  const [categorySearch, setCategorySearch] = useState("");
  const [showPriceTooltip, setShowPriceTooltip] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["course-listing", isUserLoggedIn ? userId : "guest"],
    queryFn: () =>
      isUserLoggedIn
        ? getAllCounsellorCoursesForUser(userId)
        : getAllCounsellorCoursesForGuest(),
    enabled: !isUserLoggedIn || Boolean(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const courses = useMemo(() => normalizeCourses(data), [data]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(courses.map((item) => item.course.subject))).sort(),
    [courses]
  );

  const filteredCategoryOptions = useMemo(
    () => categoryOptions.filter((option) => option.toLowerCase().includes(categorySearch.toLowerCase())),
    [categoryOptions, categorySearch]
  );

  const filteredCourses = useMemo(() => {
    let items = courses.filter((course) => {
      const numericPrice = Number(String(course.course.price).replace(/[^0-9.]/g, "") || 0);
      const numericRating = Number(course.course.rating ?? 0);

      const matchesSearch = course.course.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(course.course.subject);
      const matchesPrice = numericPrice >= priceRange[0] && numericPrice <= priceRange[1];
      const matchesRating = numericRating >= minRating;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });

    if (sortBy === "rating") {
      items = [...items].sort((a, b) => Number(b.course.rating ?? 0) - Number(a.course.rating ?? 0));
    } else if (sortBy === "price-low") {
      items = [...items].sort(
        (a, b) =>
          Number(String(a.course.price).replace(/[^0-9.]/g, "") || 0) -
          Number(String(b.course.price).replace(/[^0-9.]/g, "") || 0)
      );
    } else if (sortBy === "price-high") {
      items = [...items].sort(
        (a, b) =>
          Number(String(b.course.price).replace(/[^0-9.]/g, "") || 0) -
          Number(String(a.course.price).replace(/[^0-9.]/g, "") || 0)
      );
    } else {
      items = [...items].sort((a, b) => b.soldCount - a.soldCount);
    }

    return items;
  }, [courses, minRating, priceRange, search, selectedCategories, sortBy]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, sortBy, selectedCategories, priceRange, minRating]);

  const visibleCourses = useMemo(
    () => filteredCourses.slice(0, visibleCount),
    [filteredCourses, visibleCount]
  );
  const hasMoreCourses = visibleCount < filteredCourses.length;

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const toggleSection = (section: "category" | "price" | "rating") => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const isPriceChanged = priceRange[0] > 0 || priceRange[1] < 100000;
  const activeFilterCount = selectedCategories.length + (isPriceChanged ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const sidebar = (
    <div className="w-full">
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

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "category" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("category")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Category</h3>
          {openSection === "category" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "category" && <div className="w-full px-5 pt-[16px] flex flex-col gap-[16px]">
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search category"
            className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] text-[14px] font-[Poppins]"
          />
          <div className="flex flex-col gap-[10px] max-h-[220px] overflow-y-auto scrollbar-hide">
          {filteredCategoryOptions.map((option) => (
            <div key={option} className="flex flex-row items-center gap-[12px] cursor-pointer" onClick={() => toggleCategory(option)}>
              <div className={`box-border w-[18px] h-[18px] flex justify-center items-center ${selectedCategories.includes(option) ? "bg-[#0E1629]" : "bg-white border border-[#CED1D9]"}`}>
                {selectedCategories.includes(option) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className={`font-[Poppins] text-[14px] leading-[21px] ${selectedCategories.includes(option) ? "font-medium text-[#0E1629]" : "font-normal text-[#6B7280]"}`}>{option}</span>
            </div>
          ))}
          </div>
        </div>}
      </div>

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "price" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
        <button type="button" onClick={() => toggleSection("price")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <span className="flex items-center gap-2 font-[Poppins] font-medium text-[16px] text-[#242645]">
            Price Range
            <span className="relative group inline-flex">
              <Info
                className="w-4 h-4 text-[#9CA3AF] cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPriceTooltip((prev) => !prev);
                }}
              />
              <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 ${showPriceTooltip ? "flex" : "hidden"} lg:group-hover:flex items-center justify-center min-w-[84px] gap-1.5 bg-[#0E1629] text-white text-[12px] leading-none rounded px-2.5 py-1.5 whitespace-nowrap z-20 shadow-[0_6px_18px_rgba(0,0,0,0.25)]`}>
                <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3 h-3" />
                <span className="font-semibold">1 = ₹1</span>
              </span>
            </span>
          </span>
          {openSection === "price" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "price" && <div className="w-full px-5 pt-[16px] flex flex-col gap-[12px]">
        <div className="flex flex-row justify-between w-full gap-4">
          <div className="flex flex-col gap-[5px] flex-1">
            <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Min Price</span>
            <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value || 0), priceRange[1]])}
                className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1"
              />
            </div>
          </div>
          <div className="flex flex-col gap-[5px] flex-1">
            <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Max Price</span>
            <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value || 0)])}
                className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <input
            type="range"
            min={0}
            max={100000}
            step={500}
            value={priceRange[1]}
            onChange={(e) => {
              const nextMax = Number(e.target.value);
              setPriceRange([priceRange[0], Math.max(nextMax, priceRange[0])]);
            }}
            className="w-full accent-(--text-main)"
          />
          <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Min: ₹{priceRange[0].toLocaleString("en-IN")}</span>
            <span>Max: ₹{priceRange[1].toLocaleString("en-IN")}</span>
          </div>
        </div>
        </div>}
      </div>

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "rating" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("rating")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Minimum Rating</h3>
          {openSection === "rating" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "rating" && <div className="w-full px-5 pt-[16px]"><select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] text-[14px] font-[Poppins]"
        >
          <option value={0}>Any</option>
          <option value={3}>3.0+</option>
          <option value={4}>4.0+</option>
          <option value={4.5}>4.5+</option>
        </select></div>}
      </div>

      <div className="hidden lg:block w-full mt-4 mb-[70px]">
        <button
          onClick={() => {
            setSelectedCategories([]);
            setPriceRange([0, 100000]);
            setMinRating(0);
          }}
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
    <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={`course-skeleton-${idx}`} className="w-full md:w-auto">
          <CourseCard
            isBaught={false}
            isLoading={true}
            useListingMobileCard={true}
          />
        </div>
      ))}
    </div>
  ) : (
    <>
      <p className="mb-4 text-sm text-[#6B7280]">{filteredCourses.length} results found</p>
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center text-[#6B7280]">
          No courses match the selected filters.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
          {visibleCourses.map((item) => (
            <div key={item.course.id} className="w-full md:w-auto">
              <CourseCard
                course={item.course}
                isBaught={item.purchased}
                isLoading={false}
                useListingMobileCard={true}
              />
            </div>
          ))}
        </div>
      )}
      {filteredCourses.length > 0 && hasMoreCourses && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="text-(--text-main) text-sm font-medium hover:underline"
          >
            See more
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <ListingShell
        title="Course Listing"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search courses"
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        sidebar={sidebar}
        content={content}
      />
      <MobileCourseBottomNav />
    </>
  );
}
