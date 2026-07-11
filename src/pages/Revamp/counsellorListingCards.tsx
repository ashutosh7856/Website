import React, { useState } from 'react';
import { Bookmark, MapPin, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { encodeCounselorId } from '@/lib/utils';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
} from "@/components/ui/select";
import { CounselorCardSkeleton } from '@/components/skeletons/CounselorSkeletons';
import FancyCard from '@/components/Revamp/admissions/counsellor/counsellorCard';

interface CardProps {
    counsellors: any[];
    isLoading: boolean;
    isFetchingMore: boolean;
    lastElementRef: (node: HTMLDivElement | null) => void;
    hasMore: boolean;
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    onToggleFavourite?: (counsellorId: string) => void;
    selectedSort: string;
    setSelectedSort: React.Dispatch<React.SetStateAction<string>>;
}

const MobileCounselorCard = ({
    counsellor,
    onToggleFavourite,
}: {
    counsellor: any;
    onToggleFavourite?: (counsellorId: string) => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    return (
        <div
            className="relative h-40 w-full cursor-pointer group shrink-0 transition-transform duration-300 hover:-translate-y-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/counsellor-details/${encodeCounselorId(counsellor.id)}`)}
            style={{ filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.12))' }}
        >
            <svg
                className="absolute inset-0 h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 316 160"
                preserveAspectRatio="none"
                fill="none"
            >
                <path
                    d="M308.308 0C312.556 0 316 2.54469 316 5.68411V100.44C316 107.06 310.627 112.44 304 112.44L282.064 112.44C276.478 112.44 271.631 118 270.372 124L263.802 152C262.543 158 257.696 160 252.11 160H7.69231C3.44397 160 0 157.455 0 154.316V5.68411C0 2.54469 3.44396 0 7.69231 0H308.308Z"
                    fill="white"
                />
            </svg>

            <div className="absolute inset-0 z-10 box-border flex flex-row gap-2 p-3">
                <div className="relative h-full w-[42%] max-w-35 shrink-0 overflow-hidden rounded-[10px] bg-[#F5F5F7]">
                    {counsellor.imageUrl && (
                        <img loading="lazy" decoding="async" src={counsellor.imageUrl} alt={counsellor.name} className="h-full w-full object-cover" />
                    )}

                    <div className="pointer-events-none absolute left-1.5 top-1.5 flex h-5 min-w-9 items-center justify-center gap-1 rounded-full bg-[#FFFFFF4D] px-1 backdrop-blur-[15px] shadow-sm">
                        <Star className="h-4 w-4 shrink-0 fill-[#0E1629] text-[#0E1629]" />
                        <span className="font-['Poppins'] text-[10px] font-medium leading-none text-[#0E1629]">
                            {counsellor.rating}
                        </span>
                    </div>

                    <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleFavourite?.(counsellor.id);
                        }}
                        aria-label="Save counselor"
                        className="absolute right-1.5 top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFFFFF4D] px-1 backdrop-blur-[15px] shadow-sm transition-colors hover:bg-white/40"
                    >
                        <Bookmark className={`h-3.5 w-3.5 pointer-events-none text-[#0E1629] transition-colors ${counsellor.isFavourite ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                    <div className="min-w-0">
                        {counsellor.verified && (
                            <div className="mb-0.5 flex items-center gap-1">
                                <img loading="lazy" decoding="async" src="/verified.svg" alt="Verified" className="h-3 w-3 shrink-0" />
                                <span className="font-['Poppins'] text-[9px] font-medium leading-none text-[#3AAF3C]">Verified</span>
                            </div>
                        )}
                        <h3 className="m-0 w-full truncate font-['Poppins'] text-[13px] font-medium leading-4.5 text-[#0E1629]">
                            {counsellor.name}
                        </h3>
                        <div className="mt-1 flex flex-col gap-0.5">
                            <div className="flex w-full items-center gap-1">
                                <img loading="lazy" decoding="async" src="/stream.svg" alt="stream" className="h-3 w-3 shrink-0" />
                                <span className="truncate font-['Poppins'] text-[10px] font-normal leading-3.5 text-[#6B7280]">
                                    {counsellor.course} | {counsellor.experience}
                                </span>
                            </div>
                            <div className="flex w-full items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0 text-[#6B7280]" />
                                <span className="truncate font-['Poppins'] text-[10px] font-normal leading-3.5 text-[#6B7280]">
                                    {counsellor.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 pr-[24%]">
                        <div className="flex items-center gap-1.5 text-[#0E1629] font-medium text-[11px] leading-none">
                            <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="h-3.5 w-3.5" />
                            <p>{counsellor.plans?.plus || 0} Plus</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 right-0 z-20 h-12.5 w-13.25 overflow-hidden rounded-br-xl rounded-tl-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 50" preserveAspectRatio="none" fill="none" className="h-full w-full transition-all duration-300">
                    <path
                        d="M4.1 7.05536C4.57855 3.03083 7.99114 0 12.044 0H43.9934C48.4117 0 51.9934 3.58172 51.9934 8V42C51.9934 46.4183 48.4117 50 43.9934 50H8.00107C3.20833 50 -0.508886 45.8146 0.0570345 41.0554L4.1 7.05536Z"
                        fill={isHovered ? 'white' : '#0E1629'}
                        className="transition-colors duration-300"
                    />
                </svg>
                <div className="absolute left-[55%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2">
                    <img loading="lazy" decoding="async" src="/arrow.svg" alt="arrow" className={`absolute inset-0 h-full w-full transition-all duration-500 ${isHovered ? 'translate-x-7.5 opacity-0' : 'translate-x-0 opacity-100'}`} style={{ filter: 'brightness(0) invert(1)' }} />
                    <img loading="lazy" decoding="async" src="/arrow.svg" alt="arrow" className={`absolute inset-0 h-full w-full transition-all duration-500 ${isHovered ? 'translate-x-0 opacity-100' : '-translate-x-7.5 opacity-0'}`} style={{ filter: 'brightness(0)' }} />
                </div>
            </div>
        </div>
    );
};

const CounselorCardItem = ({ counsellor, isLast, lastElementRef, onToggleFavourite }: { counsellor: any, isLast: boolean, lastElementRef: any, onToggleFavourite?: (counsellorId: string) => void }) => {
    return (
        <div ref={isLast ? lastElementRef : null} className="shrink-0 snap-start w-full max-w-85 mx-auto md:max-w-none md:w-61">
            <div className="md:hidden">
                <MobileCounselorCard counsellor={counsellor} onToggleFavourite={onToggleFavourite} />
            </div>
            <div className="hidden md:block">
                <FancyCard
                    counsellorId={counsellor.id}
                    name={counsellor.name}
                    imageUrl={counsellor.imageUrl}
                    rating={counsellor.rating}
                    experience={counsellor.experience}
                    city={counsellor.location}
                    proCoins={counsellor.plans?.plus || 0}
                    showBookmark
                    isBookmarked={Boolean(counsellor.isFavourite)}
                    onBookmarkClick={() => onToggleFavourite?.(counsellor.id)}
                />
            </div>
        </div>
    );
};

const CounsellorListingCards: React.FC<CardProps> = ({ 
    counsellors, isLoading, isFetchingMore, lastElementRef, hasMore, searchInput, setSearchInput, onToggleFavourite, selectedSort, setSelectedSort
}) => {
    const sortTypes = [
        { label: "Experience: High to Low", value: "experience" },
        { label: "Popularity", value: "popularity" },
        { label: "Price: Low-High", value: "price-low" },
        { label: "Price: High-Low", value: "price-high" },
    ];
    return (
        <div className="w-full">
            {/* Top Actions Box */}
            <div className="box-border flex flex-col md:flex-row items-stretch md:items-center p-3 md:p-2 bg-white rounded-lg w-full min-h-16 shadow-[0px_2px_8px_rgba(0,0,0,0.15)] mb-6 gap-3 md:gap-0">
                <div className="flex flex-row justify-between items-center w-full px-2 md:px-4 h-12">
                    <div className="flex flex-row justify-center items-center gap-2.5">
                        <h2 className="font-['Poppins'] font-semibold text-[16px] leading-5 tracking-[-0.01em] text-[#242645] m-0">
                            Counsellors
                        </h2>
                    </div>

                    <div className="hidden md:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 w-full md:w-auto mt-3 md:mt-0 px-1 md:px-0">
                        <div className="box-border flex flex-row items-center px-3 py-1.5 gap-2.5 w-full md:w-71 h-9 border border-[rgba(107,114,128,0.4)] rounded-xl">
                            <Search className="w-5 h-5 text-[#6B7280]" strokeWidth={2} />
                            <input 
                                type="text" 
                                placeholder="Search for counsellors" 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-transparent outline-none font-['Poppins'] font-medium text-[14px] text-[#6B7280] placeholder-[#6B7280]" 
                            />
                        </div>

                        {/* DESKTOP SORT UI */}
                        <div className="flex flex-row justify-between sm:justify-center items-center gap-3">
                            <span className="font-['Poppins'] font-medium text-[14px] text-[#525055]">Sort by:</span>
                            <Select value={selectedSort} onValueChange={setSelectedSort}>
                                <SelectTrigger className="w-40 h-12 bg-white rounded-lg border border-transparent hover:border-gray-200 outline-none focus:ring-0 font-['Poppins'] font-medium text-xs text-[#525055] shadow-none cursor-pointer">
                                    <SelectValue placeholder="Popularity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {sortTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value} className="font-['Poppins'] text-xs cursor-pointer">
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row md:hidden items-stretch sm:items-center gap-3 w-full px-2">
                    <div className="box-border flex flex-row items-center px-3 py-1.5 gap-2.5 w-full h-10 border border-[rgba(107,114,128,0.4)] rounded-xl">
                        <Search className="w-5 h-5 text-[#6B7280]" strokeWidth={2} />
                        <input 
                            type="text" 
                            placeholder="Search for counsellors" 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-transparent outline-none font-['Poppins'] font-medium text-[14px] text-[#6B7280] placeholder-[#6B7280]" 
                        />
                    </div>
                    
                    {/* MOBILE SORT UI */}
                    <div className="flex flex-row justify-between items-center gap-3">
                        <span className="font-['Poppins'] font-medium text-[13px] text-[#525055]">Sort by:</span>
                        <Select value={selectedSort} onValueChange={setSelectedSort}>
                            <SelectTrigger className="w-37.5 h-9 bg-white rounded-lg border border-gray-200 outline-none focus:ring-0 font-['Poppins'] font-medium text-xs text-[#525055] shadow-none cursor-pointer">
                                <SelectValue placeholder="Popularity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {sortTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value} className="font-['Poppins'] text-xs cursor-pointer">
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Loading State / Empty State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pb-10 w-full">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={`c-listing-skeleton-${idx}`} className="w-full flex justify-center">
                            <CounselorCardSkeleton />
                        </div>
                    ))}
                </div>
            ) : counsellors.length === 0 ? (
                <div className="flex justify-center py-20 w-full text-gray-500 font-[Poppins] text-[15px] md:text-[18px]">
                    No Counsellor found matching your criteria.
                </div>
            ) : (
                <>
                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pb-10">
                        {counsellors.map((counsellor, index) => (
                            <CounselorCardItem 
                                key={counsellor.id}
                                counsellor={counsellor}
                                isLast={index === counsellors.length - 1}
                                lastElementRef={lastElementRef}
                                onToggleFavourite={onToggleFavourite}
                            />
                        ))}
                    </div>

                    {/* Loading Spinner for Infinite Scroll */}
                    {isFetchingMore && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 py-6 w-full pb-20">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={`c-listing-more-skeleton-${idx}`} className="w-full flex justify-center">
                                    <CounselorCardSkeleton />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {!hasMore && counsellors.length > 0 && (
                        <div className="text-center py-8 pb-20 text-gray-500 font-medium">
                            You have reached the end of the list.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CounsellorListingCards;