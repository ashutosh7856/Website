import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { academicApi } from "@/api/academic";
import { useAuthStore } from "@/store/AuthStore";
import type { AllCounselor } from "@/types/academic";
import CounsellorListing from "./counsellorListing";
import CounsellorListingCards from "./counsellorListingCards";
import { X, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { addFav } from "@/api/counsellor";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { counsellorsContent } from "@/components/SEO/seoContent";
import EditProfileModal from "@/components/student-dashboard/EditProfileModal";
import { updateUserProfile } from "@/api/user";

function adaptApiDataToCardData(apiCounselor: AllCounselor) {
    const firstName = apiCounselor.firstName || "Unknown";
    const lastName = apiCounselor.lastName || "Counselor";
    const fullName = `${firstName} ${lastName}`;

    const imageUrl =
        apiCounselor.photoUrlSmall ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0E1629&color=ffffff&size=400`;

    const experience = apiCounselor.experience || "0";
    let experienceText = experience === "0" ? "Entry Level" : experience.toLowerCase().includes("year") ? experience : `${experience} Years`;

    return {
        id: apiCounselor.counsellorId || `temp-${Date.now()}`,
        name: fullName,
        imageUrl: imageUrl,
        rating: apiCounselor.rating || 4.0,
        reviews: parseInt(apiCounselor.numberOfRatings || "0"),
        verified: true,
        course: "Counselling",
        experience: experienceText,
        location: apiCounselor.city || "Location not specified",
        plans: {
            plus: apiCounselor.plusAmount || 0,
            pro: apiCounselor.proAmount || 0,
            elite: apiCounselor.eliteAmount || 0,
        },
    };
}

const CounsellorsPage: React.FC = () => {
    const { user, userId, refreshUser } = useAuthStore();

    // --- Filter States ---
    const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [minPriceInput, setMinPriceInput] = useState<number | "">(100);
    const [maxPriceInput, setMaxPriceInput] = useState<number | "">(10000);
    const [selectedSort, setSelectedSort] = useState("experience");
    
    // --- Mobile Drawer State ---
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // --- Search State ---
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Debounced States for API calls
    const [minPrice, setMinPrice] = useState<string>("100");
    const [maxPrice, setMaxPrice] = useState<string>("10000");

    // --- API & Pagination States ---
    const ITEMS_PER_PAGE = 9;

    const observer = useRef<IntersectionObserver | null>(null);

    // --- FAVOURITES & PROFILE STATES ---
    const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Filter count calculation
    const isPriceChanged = minPriceInput !== 100 || maxPriceInput !== 10000;
    const activeFilterCount = selectedExperience.length + selectedLanguages.length + selectedCities.length + selectedDays.length + (isPriceChanged ? 1 : 0);

    useEffect(() => {
        if (user?.favouriteCounsellorIds) {
            setFavouriteIds(new Set(user.favouriteCounsellorIds));
        }
    }, [user]);

    // Debounce inputs (Price & Search)
    useEffect(() => {
        const timer = setTimeout(() => setMinPrice(minPriceInput.toString()), 800);
        return () => clearTimeout(timer);
    }, [minPriceInput]);

    useEffect(() => {
        const timer = setTimeout(() => setMaxPrice(maxPriceInput.toString()), 800);
        return () => clearTimeout(timer);
    }, [maxPriceInput]);

    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput), 800);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Handle Clear Filters
    const handleClearFilters = useCallback(() => {
        setSelectedExperience([]);
        setSelectedLanguages([]);
        setSelectedCities([]);
        setSelectedDays([]);
        setMinPriceInput(100);
        setMaxPriceInput(10000);
    }, []);

    const generateSeniorYears = () => Array.from({ length: 37 }, (_, i) => i + 4).join(",");

    const dayMapping: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    const apiDays = selectedDays.map((d) => dayMapping[d] || d).join(",");

    const apiExperience = useMemo(() => {
        const selectedExp: string[] = [];
        if (selectedExperience.includes("entry")) selectedExp.push("0,1");
        if (selectedExperience.includes("junior")) selectedExp.push("1,2,3");
        if (selectedExperience.includes("senior")) selectedExp.push(generateSeniorYears());
        return selectedExp.join(",");
    }, [selectedExperience]);

    const sortConfig = useMemo(
        () =>
            selectedSort === "price-low"
                ? { sortBy: "price", sortOrder: "asc" as const }
                : selectedSort === "price-high"
                    ? { sortBy: "price", sortOrder: "desc" as const }
                    : { sortBy: "priority", sortOrder: "desc" as const },
        [selectedSort]
    );

    const commonFilters = useMemo(
        () => ({
            city: selectedCities.join(","),
            languagesKnow: selectedLanguages.join(","),
            workingDays: apiDays,
            experience: apiExperience,
            minPrice,
            maxPrice,
            search: searchTerm,
            sortBy: sortConfig.sortBy,
            sortOrder: sortConfig.sortOrder,
        }),
        [selectedCities, selectedLanguages, apiDays, apiExperience, minPrice, maxPrice, searchTerm, sortConfig]
    );

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: [
            "revamp-counsellors",
            userId,
            commonFilters.city,
            commonFilters.languagesKnow,
            commonFilters.workingDays,
            commonFilters.experience,
            commonFilters.minPrice,
            commonFilters.maxPrice,
            commonFilters.search,
            commonFilters.sortBy,
            commonFilters.sortOrder,
        ],
        queryFn: async ({ pageParam = 0 }) => {
            if (userId) {
                return academicApi.searchCounsellors(userId, commonFilters, pageParam, ITEMS_PER_PAGE);
            }
            return academicApi.searchAllLoggedOutCounsellors(commonFilters, pageParam, ITEMS_PER_PAGE);
        },
        getNextPageParam: (lastPage, allPages) => {
            const totalItems = lastPage.total || 0;
            const loadedItems = allPages.reduce((acc, pageData) => acc + (pageData.counsellors?.length || 0), 0);
            if ((lastPage.counsellors?.length || 0) < ITEMS_PER_PAGE || loadedItems >= totalItems) {
                return undefined;
            }
            return allPages.length;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        initialPageParam: 0,
        // Keep showing previous page data while a new query (e.g. userId just loaded) is fetching,
        // preventing the blank flash when navigating from the Admissions page.
        placeholderData: (prev) => prev,
    });

    const counselors = useMemo(() => {
        const merged = (data?.pages ?? []).flatMap((pageData) => pageData.counsellors || []);
        const byId = new Map<string, AllCounselor>();

        merged.forEach((c) => {
            if (c.counsellorId) {
                byId.set(c.counsellorId, c);
            }
        });

        return Array.from(byId.values());
    }, [data]);

    const lastCounselorRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    const handleToggleFavourite = async (counsellorId: string) => {
        const { isAuthenticated, toggleLogin } = useAuthStore.getState();

        const toggleFavAction = async () => {
            const freshUserId = localStorage.getItem('phone');
            if (!freshUserId || !counsellorId) return;

            const newFavouriteIds = new Set(favouriteIds);
            if (newFavouriteIds.has(counsellorId)) newFavouriteIds.delete(counsellorId);
            else newFavouriteIds.add(counsellorId);
            setFavouriteIds(newFavouriteIds);

            try {
                await addFav(freshUserId, counsellorId);
                await refreshUser(true);
                toast.success("Favourite status updated!", { duration: 2000 });
            } catch (err) {
                toast.error("Could not update favourite status.", { duration: 2000 });
                setFavouriteIds(new Set(user?.favouriteCounsellorIds || []));
            }
        };

        if (!isAuthenticated) {
            toggleLogin(toggleFavAction);
            return;
        }

        if (!user?.firstName || !user?.email) {
            setPendingAction(() => toggleFavAction);
            setIsEditProfileModalOpen(true);
            return;
        }

        await toggleFavAction();
    };

    const handleUpdateProfile = async (updatedData: { firstName: string; lastName: string; email: string }) => {
        if (!userId) throw new Error("User not authenticated");
        const token = localStorage.getItem('jwt');
        if (token) await updateUserProfile(userId, updatedData, token);
        await refreshUser(true);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const handleCloseModal = () => {
        setIsEditProfileModalOpen(false);
        setPendingAction(null);
    };

    const sortedCounselors = useMemo(() => {
        const counselorsCopy = [...counselors];

        const getMinPlanPrice = (c: AllCounselor) => {
            const plans = [c.plusAmount || 0, c.proAmount || 0, c.eliteAmount || 0].filter((value) => value > 0);
            return plans.length ? Math.min(...plans) : Number.MAX_SAFE_INTEGER;
        };

        const getExperienceScore = (c: AllCounselor) => {
            const rawExperience = String(c.experience ?? "").trim().toLowerCase();
            const numericMatch = rawExperience.match(/\d+/);

            if (!numericMatch) {
                return 0;
            }

            const years = Number(numericMatch[0]);
            if (Number.isNaN(years)) {
                return 0;
            }

            return rawExperience.includes("+") ? years + 0.5 : years;
        };

        if (selectedSort === "price-low") {
            counselorsCopy.sort((a, b) => getMinPlanPrice(a) - getMinPlanPrice(b));
        } else if (selectedSort === "price-high") {
            counselorsCopy.sort((a, b) => getMinPlanPrice(b) - getMinPlanPrice(a));
        } else if (selectedSort === "experience") {
            counselorsCopy.sort((a, b) => {
                const experienceDiff = getExperienceScore(b) - getExperienceScore(a);

                if (experienceDiff !== 0) {
                    return experienceDiff;
                }

                return (b.rating || 0) - (a.rating || 0);
            });
        } else {
            counselorsCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return counselorsCopy;
    }, [counselors, selectedSort]);

    const cardData = useMemo(() => sortedCounselors.map((c) => ({
        ...adaptApiDataToCardData(c),
        isFavourite: favouriteIds.has(c.counsellorId)
    })), [sortedCounselors, favouriteIds]);

    return (
        <>
          <PageSEO
            title="Best Career Consultant & Certified Career Coach | ProCounsel"
            description="Connect with a professional career coach and personal career counselor at ProCounsel. Get expert career guidance from certified career consultants you can trust."
            canonical="/counsellor-listing"
            keywords="best career consultant, professional career coach, personal career counselor, career consultant, certified career coach, top career coaches"
          />
        <div className="bg-[#C6DDF040] w-full py-6 md:py-8">
            <h1 className="sr-only">Find the Best Career Counsellors &amp; Certified Career Coaches — ProCounsel</h1>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-15">

            <div className="lg:hidden flex flex-row items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-[0px_2px_8px_rgba(0,0,0,0.15)] cursor-pointer" onClick={() => setIsMobileFilterOpen(true)}>
                <div className="flex items-center gap-2 text-[#0E1629] font-medium font-[Poppins] text-[15px]">
                    <SlidersHorizontal size={20} className="text-[#0E1629]" />
                    Filters
                </div>
                {activeFilterCount > 0 && (
                    <div className="bg-[#0E1629] text-white text-[12px] font-semibold px-2 py-0.5 rounded-full font-[Arial]">
                        {activeFilterCount}
                    </div>
                )}
            </div>

            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-100 bg-gray-50 lg:hidden flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                        <h2 className="text-[18px] font-semibold text-[#0E1629] font-[Poppins]">Sort & Filters</h2>
                        <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="h-6 w-6 text-[#242645]" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-28">
                        <CounsellorListing
                            selectedExperience={selectedExperience} setSelectedExperience={setSelectedExperience}
                            selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}
                            selectedCities={selectedCities} setSelectedCities={setSelectedCities}
                            selectedDays={selectedDays} setSelectedDays={setSelectedDays}
                            minPrice={minPriceInput} setMinPrice={setMinPriceInput}
                            maxPrice={maxPriceInput} setMaxPrice={setMaxPriceInput}
                            onClearFilters={handleClearFilters}
                        />
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
                        <button 
                            onClick={handleClearFilters} 
                            disabled={activeFilterCount === 0}
                            className={`flex-1 py-3 rounded-lg font-[Poppins] font-medium transition-colors border ${activeFilterCount > 0 ? 'bg-white border-[#0E1629] text-[#0E1629] cursor-pointer' : 'bg-[#F9F9F9] border-[#E6E6E6] text-[#A0A0A0] cursor-not-allowed'}`}
                        >
                            Clear All
                        </button>
                        <button 
                            onClick={() => setIsMobileFilterOpen(false)} 
                            className="flex-1 py-3 bg-[#0E1629] text-white rounded-lg font-[Poppins] font-medium cursor-pointer"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Layout Container */}
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-16 relative">
                
                <div className="hidden lg:block w-78 shrink-0 sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto overflow-x-hidden scrollbar-hide pb-4">
                    <CounsellorListing
                        selectedExperience={selectedExperience} setSelectedExperience={setSelectedExperience}
                        selectedLanguages={selectedLanguages} setSelectedLanguages={setSelectedLanguages}
                        selectedCities={selectedCities} setSelectedCities={setSelectedCities}
                        selectedDays={selectedDays} setSelectedDays={setSelectedDays}
                        minPrice={minPriceInput} setMinPrice={setMinPriceInput}
                        maxPrice={maxPriceInput} setMaxPrice={setMaxPriceInput}
                        onClearFilters={handleClearFilters}
                    />
                </div>

                {/* Main Grid */}
                <div className="grow w-full lg:min-w-0">
                    <CounsellorListingCards
                        counsellors={cardData}
                        isLoading={isLoading}
                        isFetchingMore={isFetchingNextPage}
                        lastElementRef={lastCounselorRef}
                        hasMore={Boolean(hasNextPage)}
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        onToggleFavourite={handleToggleFavourite}
                        selectedSort={selectedSort}
                        setSelectedSort={setSelectedSort}
                    />
                </div>
            </div>

            {user && (
                <EditProfileModal
                    isOpen={isEditProfileModalOpen}
                    onClose={handleCloseModal}
                    user={user}
                    onUpdate={handleUpdateProfile}
                    onUploadComplete={() => { }}
                />
            )}
            </div>
            <SeoArticle {...counsellorsContent} />
        </div>
        </>
    );
};

export default CounsellorsPage;