import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

import { probuddiesApi } from "@/api/pro-buddies";
import ListingShell from "@/components/Revamp/listing/ListingShell";
import ProBuddyCard, { ProbuddyPhoneListinCard } from "@/components/Revamp/probuddies/ProBuddyCard";
import { formatAcademicYearLabel } from "@/lib/utils";
import { useAuthStore } from "@/store/AuthStore";
import type { ListingProBudddy } from "@/types/probuddies";
import PageSEO from "@/components/SEO/PageSEO";

// Renders only the correct card type per viewport — avoids triple-DOM-tree problem
// where both ProbuddyPhoneListinCard + ProBuddyCard (x2 internally) all mount at once.
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Rating: High to Low" },
  { value: "coins-low", label: "ProCoins: Low to High" },
  { value: "coins-high", label: "ProCoins: High to Low" },
];

const getCoins = (item: ListingProBudddy): number => Number(item.ratePerMinute ?? 0);

type OpenSection = "colleges" | "states" | "cities" | "language" | "coins" | "rating" | null;

export default function ProBuddyListing() {
  const isMobile = useIsMobile();
  const { userId } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);
  const [allBuddies, setAllBuddies] = useState<ListingProBudddy[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [selectedColleges, setSelectedColleges] = useState<string[]>(() => {
    const initial = searchParams.get("collegeName");
    return initial ? initial.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  const [languageFilter, setLanguageFilter] = useState("");
  const [workingDayFilter, setWorkingDayFilter] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [_maxRating, setMaxRating] = useState(5);
  const [coinsRange, setCoinsRange] = useState<[number, number]>([0, 500]);
  const [showCoinsTooltip, setShowCoinsTooltip] = useState(false);
  const [openSection, setOpenSection] = useState<OpenSection>("colleges");

  const sortMapping = useMemo(() => {
    if (sortBy === "coins-low") {
      return { sortBy: "ratePerMinute", sortOrder: "asc" as const };
    }
    if (sortBy === "coins-high") {
      return { sortBy: "ratePerMinute", sortOrder: "desc" as const };
    }
    return { sortBy: "rating", sortOrder: "desc" as const };
  }, [sortBy]);

  const filterKey = useMemo(() =>
    [
      userId ?? "guest",
      selectedColleges.join(","),
      selectedStates.join(","),
      selectedCities.join(","),
      languageFilter,
      workingDayFilter,
      minRating,
      coinsRange.join(","),
      sortMapping.sortBy,
      sortMapping.sortOrder,
    ].join("|"),
    [userId, selectedColleges, selectedStates, selectedCities, languageFilter, workingDayFilter, minRating, coinsRange, sortMapping]
  );

  useEffect(() => {
    setPage(0);
    setAllBuddies([]);
    setHasMore(true);
  }, [filterKey]);

  // fetch proBuddy colleges/options for filters and cache in sessionStorage
  const { data: proBuddyColleges = [] } = useQuery({
    queryKey: ["probuddy-colleges-options"],
    queryFn: () => probuddiesApi.getColleges(),
    staleTime: 60 * 60 * 1000,
  });

  const collegeOptions = useMemo(() => {
    return Array.from(new Set((proBuddyColleges as any[]).map((c) => (c.collegeName ?? c.college_name ?? "")).filter(Boolean))).sort();
  }, [proBuddyColleges]);

  const stateOptions = useMemo(() => {
    return Array.from(new Set((proBuddyColleges as any[]).map((c) => (c.collegeState ?? c.state ?? "")).filter(Boolean))).sort();
  }, [proBuddyColleges]);

  const cityOptionsFromApi = useMemo(() => {
    return Array.from(new Set((proBuddyColleges as any[]).map((c) => (c.collegeCity ?? c.city ?? "")).filter(Boolean))).sort();
  }, [proBuddyColleges]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && proBuddyColleges && proBuddyColleges.length > 0) {
        sessionStorage.setItem(
          "probuddy_filter_options",
          JSON.stringify({ colleges: collegeOptions, states: stateOptions, cities: cityOptionsFromApi })
        );
      }
    } catch {
      // ignore
    }
  }, [collegeOptions, stateOptions, cityOptionsFromApi, proBuddyColleges]);

  // UI state for expandable pickers
  const [showCollegePicker, setShowCollegePicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ["pro-buddies-listing", filterKey, page],
    queryFn: () =>
      probuddiesApi.listing(userId ?? null, {
        collegeName: selectedColleges.length ? selectedColleges.join(",") : undefined,
        state: selectedStates.length ? selectedStates.join(",") : undefined,
        city: selectedCities.length ? selectedCities.join(",") : undefined,
        languagesKnow: languageFilter,
        workingDays: workingDayFilter,
        minRatePerMinute: coinsRange[0],
        maxRatePerMinute: coinsRange[1],
        minRating,
        maxRating: 5,
        sortBy: sortMapping.sortBy,
        sortOrder: sortMapping.sortOrder,
        page,
        pageSize: PAGE_SIZE,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!pageData) return;
    if (page === 0) {
      setAllBuddies(pageData);
    } else {
      setAllBuddies((prev) => [...prev, ...pageData]);
    }
    setHasMore(pageData.length >= PAGE_SIZE);
  }, [pageData, page]);

  const filteredBuddies = useMemo(() => {
    let items = allBuddies.filter((item) => {
      const name = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim().toLowerCase();
      const searchText = search.toLowerCase();
      const city = (item.city ?? "Not specified").toLowerCase();
      const coins = getCoins(item);

      const matchesSearch =
        name.includes(searchText) ||
        (item.collegeName ?? "").toLowerCase().includes(searchText) ||
        (item.course ?? "").toLowerCase().includes(searchText) ||
        city.includes(searchText);

      const matchesCoins = coins >= coinsRange[0] && coins <= coinsRange[1];

      const matchesCollege =
        selectedColleges.length === 0 ||
        selectedColleges.some((sel) => (item.collegeName ?? "").toLowerCase().includes(sel.toLowerCase()));

      const matchesState =
        selectedStates.length === 0 ||
        selectedStates.some((sel) => (item.state ?? item.city ?? "").toLowerCase().includes(sel.toLowerCase()) || (item.city ?? "").toLowerCase().includes(sel.toLowerCase()));

      const matchesCity =
        selectedCities.length === 0 ||
        selectedCities.some((sel) => (item.city ?? "").toLowerCase().includes(sel.toLowerCase()));

      return matchesSearch && matchesCoins && matchesCollege && matchesState && matchesCity;
    });

    if (sortBy === "rating") {
      items = [...items].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    } else if (sortBy === "coins-low") {
      items = [...items].sort((a, b) => getCoins(a) - getCoins(b));
    } else if (sortBy === "coins-high") {
      items = [...items].sort((a, b) => getCoins(b) - getCoins(a));
    }

    return items;
  }, [coinsRange, allBuddies, search, sortBy]);

  const isCoinsChanged = coinsRange[0] > 0 || coinsRange[1] < 500;
  const activeFilterCount =
    (selectedColleges.length ? 1 : 0) +
    (selectedStates.length ? 1 : 0) +
    (selectedCities.length ? 1 : 0) +
    (languageFilter ? 1 : 0) +
    (workingDayFilter ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (isCoinsChanged ? 1 : 0);

  const toggleSection = (section: Exclude<OpenSection, null>) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const resetFilters = () => {
    setSelectedColleges([]);
    setSelectedStates([]);
    setSelectedCities([]);
    setLanguageFilter("");
    setWorkingDayFilter("");
    setMinRating(0);
    setMaxRating(5);
    setCoinsRange([0, 500]);
  };

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

      {/* Colleges section */}
      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "colleges" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("colleges")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Colleges</h3>
          {openSection === "colleges" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "colleges" && (
          <div className="w-full px-5 pt-[16px] flex flex-col gap-[10px]">
            <div>
              <div className="flex flex-row gap-2 flex-wrap">
                {collegeOptions.slice(0, 4).map((name) => (
                  <label key={name} className="flex items-center gap-2 px-2 py-1 bg-[#F8F9FA] rounded-md text-sm">
                    <input
                      type="checkbox"
                      className="accent-(--text-main)"
                      checked={selectedColleges.includes(name)}
                      onChange={() => {
                        setSelectedColleges((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));
                      }}
                    />
                    <span className="truncate max-w-[160px]">{name.length > 28 ? `${name.slice(0, 25)}...` : name}</span>
                  </label>
                ))}
                {collegeOptions.length > 4 && (
                  <button onClick={() => setShowCollegePicker((s) => !s)} className="px-3 py-2 bg-white border rounded-md text-sm">
                    +{collegeOptions.length - 4} more
                  </button>
                )}
              </div>
              {showCollegePicker && (
                <div className="mt-2 p-2 border border-[#E6E6E6] rounded-md bg-white">
                  <input
                    type="text"
                    value={collegeSearch}
                    onChange={(e) => setCollegeSearch(e.target.value)}
                    placeholder="Search colleges"
                    className="w-full h-10 px-3 rounded-md border border-[#EFEFEF]"
                  />
                  <div className="max-h-40 overflow-auto mt-2 grid gap-1">
                    {collegeOptions
                      .filter((n) => n.toLowerCase().includes(collegeSearch.toLowerCase()))
                      .map((n) => (
                        <label key={n} className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="accent-(--text-main)"
                            checked={selectedColleges.includes(n)}
                            onChange={() => {
                              setSelectedColleges((prev) => (prev.includes(n) ? prev.filter((p) => p !== n) : [...prev, n]));
                            }}
                          />
                          <span>{n}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* States section */}
      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "states" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("states")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">States</h3>
          {openSection === "states" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "states" && (
          <div className="w-full px-5 pt-[16px] flex flex-col gap-[10px]">
            <div>
              <div className="flex flex-row gap-2 flex-wrap">
                {stateOptions.slice(0, 4).map((s) => (
                  <label key={s} className="flex items-center gap-2 px-2 py-1 bg-[#F8F9FA] rounded-md text-sm">
                    <input
                      type="checkbox"
                      className="accent-(--text-main)"
                      checked={selectedStates.includes(s)}
                      onChange={() => setSelectedStates((prev) => (prev.includes(s) ? prev.filter((p) => p !== s) : [...prev, s]))}
                    />
                    <span className="truncate max-w-[160px]">{s.length > 28 ? `${s.slice(0, 25)}...` : s}</span>
                  </label>
                ))}
                {stateOptions.length > 4 && (
                  <button onClick={() => setShowStatePicker((s) => !s)} className="px-3 py-2 bg-white border rounded-md text-sm">
                    +{stateOptions.length - 4} more
                  </button>
                )}
              </div>
              {showStatePicker && (
                <div className="mt-2 p-2 border border-[#E6E6E6] rounded-md bg-white">
                  <input type="text" value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} placeholder="Search states" className="w-full h-10 px-3 rounded-md border border-[#EFEFEF]" />
                  <div className="max-h-40 overflow-auto mt-2 grid gap-1">
                    {stateOptions.filter((n) => n.toLowerCase().includes(stateSearch.toLowerCase())).map((n) => (
                      <label key={n} className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                        <input type="checkbox" className="accent-(--text-main)" checked={selectedStates.includes(n)} onChange={() => setSelectedStates((prev) => (prev.includes(n) ? prev.filter((p) => p !== n) : [...prev, n]))} />
                        <span>{n}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cities section */}
      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "cities" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("cities")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Cities</h3>
          {openSection === "cities" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "cities" && (
          <div className="w-full px-5 pt-[16px] flex flex-col gap-[10px]">
            <div>
              <div className="flex flex-row gap-2 flex-wrap">
                {cityOptionsFromApi.slice(0, 4).map((c) => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1 bg-[#F8F9FA] rounded-md text-sm">
                    <input
                      type="checkbox"
                      className="accent-(--text-main)"
                      checked={selectedCities.includes(c)}
                      onChange={() => setSelectedCities((prev) => (prev.includes(c) ? prev.filter((p) => p !== c) : [...prev, c]))}
                    />
                    <span className="truncate max-w-[160px]">{c.length > 28 ? `${c.slice(0, 25)}...` : c}</span>
                  </label>
                ))}
                {cityOptionsFromApi.length > 4 && (
                  <button onClick={() => setShowCityPicker((s) => !s)} className="px-3 py-2 bg-white border rounded-md text-sm">
                    +{cityOptionsFromApi.length - 4} more
                  </button>
                )}
              </div>
              {showCityPicker && (
                <div className="mt-2 p-2 border border-[#E6E6E6] rounded-md bg-white">
                  <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search cities" className="w-full h-10 px-3 rounded-md border border-[#EFEFEF]" />
                  <div className="max-h-40 overflow-auto mt-2 grid gap-1">
                    {cityOptionsFromApi.filter((n) => n.toLowerCase().includes(citySearch.toLowerCase())).map((n) => (
                      <label key={n} className="px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2">
                        <input type="checkbox" className="accent-(--text-main)" checked={selectedCities.includes(n)} onChange={() => setSelectedCities((prev) => (prev.includes(n) ? prev.filter((p) => p !== n) : [...prev, n]))} />
                        <span>{n}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "language" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("language")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Language & Day</h3>
          {openSection === "language" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "language" && (
          <div className="w-full px-5 pt-[16px] flex flex-col gap-[10px]">
            <input
              type="text"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              placeholder="Language"
              className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] text-[14px] font-[Poppins]"
            />
            <select
              value={workingDayFilter}
              onChange={(e) => setWorkingDayFilter(e.target.value)}
              className="h-[40px] w-full rounded-[12px] border border-[#EFEFEF] bg-white px-[12px] text-[14px] font-[Poppins]"
            >
              <option value="">Any day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
        )}
      </div>

      <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "coins" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
        <button type="button" onClick={() => toggleSection("coins")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
          <span className="flex items-center gap-2 font-[Poppins] font-medium text-[16px] text-[#242645]">
            ProCoins
            <span className="relative group inline-flex">
              <Info
                className="w-4 h-4 text-[#9CA3AF] cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCoinsTooltip((prev) => !prev);
                }}
              />
              <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 ${showCoinsTooltip ? "flex" : "hidden"} lg:group-hover:flex items-center justify-center min-w-[84px] gap-1.5 bg-[#0E1629] text-white text-[12px] leading-none rounded px-2.5 py-1.5 whitespace-nowrap z-20 shadow-[0_6px_18px_rgba(0,0,0,0.25)]`}>
                <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3 h-3" />
                <span className="font-semibold">1 = ₹1</span>
              </span>
            </span>
          </span>
          {openSection === "coins" ? <ChevronDown className="h-5 w-5 text-[#242645]" /> : <ChevronRight className="h-5 w-5 text-[#242645]" />}
        </button>
        {openSection === "coins" && (
          <div className="w-full px-5 pt-[16px] flex flex-row justify-between gap-4">
            <div className="flex flex-col gap-[5px] flex-1">
              <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Min Coins</span>
              <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <input
                  type="number"
                  value={coinsRange[0]}
                  onChange={(e) => setCoinsRange([Number(e.target.value || 0), coinsRange[1]])}
                  className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-[5px] flex-1">
              <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Max Coins</span>
              <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <input
                  type="number"
                  value={coinsRange[1]}
                  onChange={(e) => setCoinsRange([coinsRange[0], Number(e.target.value || 0)])}
                  className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] pb-[16px]">
        <div className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px]">
          <h3 className="font-[Poppins] font-medium text-[16px] text-[#242645]">Rating</h3>
          <div className="font-[Poppins] font-medium text-[14px] text-[#0E1629]">{minRating}+</div>
        </div>
        <div className="w-full px-5 pt-[16px]">
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full accent-(--text-main)"
          />
          <p className="mt-2 text-xs text-[#6B7280]">Show ProBuddies with rating &ge; selected value</p>
        </div>
      </div>

      <div className="hidden lg:block w-full mt-4 mb-[70px]">
        <button
          onClick={resetFilters}
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

  const content = isLoading && page === 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={`probuddy-skeleton-${idx}`} className="h-66.5 rounded-xl bg-white/90 animate-pulse md:h-91.75" />
      ))}
    </div>
  ) : (
    <>
      <p className="mb-4 text-sm text-[#6B7280]">{filteredBuddies.length} results found</p>

      {filteredBuddies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center text-[#6B7280]">
          No ProBuddies match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
          {filteredBuddies.map((buddy, idx) => {
            const name = `${buddy.firstName ?? ""} ${buddy.lastName ?? ""}`.trim();
            const identifier = buddy.proBuddyId || String(idx);
            const cardProps = {
              id: buddy.proBuddyId ?? String(idx),
              name,
              imageUrl: buddy.photoUrl ?? "",
              rating: Number(buddy.rating ?? 0),
              yearLabel: formatAcademicYearLabel(buddy.currentYear, "1st year"),
              city: buddy.city ?? "",
              proCoins: getCoins(buddy),
            };
            return (
              <div key={identifier} className="w-full">
                {isMobile ? (
                  <ProbuddyPhoneListinCard {...cardProps} />
                ) : (
                  <ProBuddyCard {...cardProps} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !isLoading && filteredBuddies.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="px-8 py-3 rounded-[8px] border border-[#0E1629] text-[#0E1629] font-[Poppins] font-medium text-[15px] bg-white hover:bg-[#F8F9FA] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? "Loading..." : "See More"}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <PageSEO
        title="Find ProBuddies – College Senior Mentors Near You"
        description="Browse verified ProBuddies — college seniors ready to guide you on admissions, campus life, hostel, and course selection. Filter by college, branch, and availability."
        canonical="/pro-buddies/listing"
        keywords="ProBuddy listing, college senior mentors, peer mentors India, college admission guidance, student mentor"
      />
    <ListingShell
      title=""
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search ProBuddies"
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortOptions={sortOptions}
      sidebar={sidebar}
      content={content}
    />
    </>
  );
}
