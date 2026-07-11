import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import FancyCard from "./counsellorCard";
import { SeeAllButton } from "../../components/LeftRightButton";
import { academicApi } from "@/api/academic";
import type { AllCounselor } from "@/types/academic";
import { useQuery } from "@tanstack/react-query";
import { addFav } from "@/api/counsellor";
import { useAuthStore } from "@/store/AuthStore";
import toast from "react-hot-toast";

export default function CounsellorSection() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all programme");
    const hasAnimated = useRef(false);
    const { user, refreshUser } = useAuthStore();
    const [favouriteIds, setFavouriteIds] = useState<Set<string>>(
        () => new Set(user?.favouriteCounsellorIds ?? [])
    );

    const handleToggleFavourite = async (counsellorId: string) => {
        const { isAuthenticated, toggleLogin } = useAuthStore.getState();

        const doToggle = async () => {
            const freshUserId = localStorage.getItem('phone');
            if (!freshUserId) return;
            setFavouriteIds(prev => {
                const next = new Set(prev);
                if (next.has(counsellorId)) next.delete(counsellorId);
                else next.add(counsellorId);
                return next;
            });
            try {
                await addFav(freshUserId, counsellorId);
                await refreshUser(true);
            } catch {
                toast.error("Could not update favourite status.");
                setFavouriteIds(new Set(user?.favouriteCounsellorIds ?? []));
            }
        };

        if (!isAuthenticated) {
            toggleLogin(doToggle);
            return;
        }
        await doToggle();
    };

    const filters = [
        "all programme",
        "Mental",
        "Psychometric",
        "Admission",
        "Upskilling"
    ];

    const { data: counsellors = [], isLoading, isError, isFetching } = useQuery({
        queryKey: ['revamp-counsellors'],
        queryFn: () => academicApi.getLoggedOutCounsellors(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const isFromCache = !isLoading && !isFetching && counsellors.length > 0;
    if (isFromCache && !hasAnimated.current) {
        hasAnimated.current = true;
    }
    const shouldAnimate = !hasAnimated.current;

    const filteredCounsellors = activeFilter === "all programme"
        ? counsellors
        : counsellors.filter((c: AllCounselor) =>
            c.expertise?.some(e => e.toLowerCase().includes(activeFilter.toLowerCase()))
        );

    const displayCounsellors = filteredCounsellors.slice(0, 5);

    const getExperienceText = (experience?: string | null) => {
        if (!experience || experience === "0") return "Entry Level";
        if (experience.toLowerCase().includes("year")) return experience;
        return `${experience}+ years of experience`;
    };

    const getImageUrl = (c: AllCounselor) => {
        return c.photoUrlSmall ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(`${c.firstName} ${c.lastName}`)}&background=6B7280&color=ffffff&size=400`;
    };

    const containerVariants = shouldAnimate ? {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.05 }
        },
    } : {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
    };

    const cardVariants = shouldAnimate ? {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
    } : {
        hidden: { opacity: 1, y: 0, scale: 1 },
        visible: { opacity: 1, y: 0, scale: 1 },
    };

    return (
        <div className="bg-[#C6DDF040] w-full py-6 md:py-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Heading Layout */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-10 gap-[12px] md:gap-0">
                    <div className="flex items-center justify-center gap-[8px] md:gap-2 bg-white px-[12px] md:px-3 py-[4px] md:py-1 rounded-[4px] md:rounded-md w-[125px] md:w-auto h-[26px] md:h-auto shrink-0">
                        <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] md:w-4 md:h-4 bg-[#0E1629] shrink-0" />
                        <p className="font-[Poppins] font-semibold text-[12px] md:text-[14px] text-[#0E1629] uppercase tracking-[0.07em] md:tracking-wider leading-none md:leading-normal">
                            COUNSELLORS
                        </p>
                    </div>
                    <p className="font-[Poppins] font-medium text-[12px] md:text-[24px] text-[#0E1629] max-w-[350px] md:max-w-[682px] h-[54px] md:h-auto leading-none md:leading-normal">
                        Speak with experienced admission counsellors for profile building, college shortlisting, application strategy, and interview guidance.
                    </p>
                </div>

                {/* Tabs Layout */}
                <div className="flex gap-[12px] md:gap-[60px] mb-6 md:mb-10 px-0 md:px-7 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filters.map((filter) => (
                        <motion.button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className={`shrink-0 flex items-center justify-center gap-[10px] md:gap-0 px-[12px] md:px-5 py-[4px] md:py-2.5 rounded-[5px] h-[26px] md:h-auto min-w-[115px] md:w-[200px] hover:cursor-pointer font-[Poppins] font-medium text-[12px] md:text-[14px] leading-none md:leading-normal capitalize transition-all duration-300 ${activeFilter === filter
                                    ? "bg-[#0E1629] text-white"
                                    : "border border-[rgba(14,22,41,0.25)] text-[#0E1629] hover:border-[#0E1629]"
                                }`}
                        >
                            {filter}
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-3 md:gap-[25px] justify-start mb-6 min-h-[275px] md:min-h-[367px] items-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 snap-x snap-mandatory"
                        >
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div
                                    key={`counsellor-skeleton-${idx}`}
                                    className="shrink-0 snap-start w-[200px] md:w-[244px] h-[275px] md:h-[367px] rounded-[15px] bg-white/80 animate-pulse"
                                />
                            ))}
                        </motion.div>
                    ) : isError ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center mb-6 min-h-[275px] md:min-h-[367px] items-center"
                        >
                            <p className="font-[Poppins] text-[14px] text-red-500">Failed to load counsellors</p>
                        </motion.div>
                    ) : displayCounsellors.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-center mb-6 min-h-[275px] md:min-h-[367px] items-center"
                        >
                            <p className="font-[Poppins] text-[14px] text-[#6B7280]">No counsellors found for this category</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeFilter}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex gap-3 md:gap-[25px] justify-start mb-6 min-h-[275px] md:min-h-[367px] items-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 snap-x snap-mandatory"
                        >
                            {displayCounsellors.map((c: AllCounselor, idx: number) => (
                                <motion.div
                                    key={c.counsellorId}
                                    variants={cardVariants}
                                    className="shrink-0 snap-start w-[200px] md:w-[244px]"
                                >
                                    <FancyCard
                                        counsellorId={c.counsellorId}
                                        priority={idx === 0}
                                        name={`${c.firstName} ${c.lastName}`}
                                        imageUrl={getImageUrl(c)}
                                        rating={c.rating || 4.0}
                                        experience={getExperienceText(c.experience)}
                                        city={c.city || "Not specified"}
                                        proCoins={c.plusAmount}
                                        isBookmarked={favouriteIds.has(c.counsellorId)}
                                        onBookmarkClick={() => handleToggleFavourite(c.counsellorId)}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-end mt-4 md:mt-0 pb-4 md:pb-0 w-full">
                    <div className="scale-[0.85] md:scale-100 origin-center md:origin-right">
                        <SeeAllButton
                            text="See all"
                            onClick={() => navigate('/counsellor-listing')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}