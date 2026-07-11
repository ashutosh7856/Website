import React, { useState, useMemo } from "react";
import { Search, Info, ChevronDown, ChevronRight } from "lucide-react";

interface FilterProps {
    selectedExperience: string[];
    setSelectedExperience: React.Dispatch<React.SetStateAction<string[]>>;
    selectedLanguages: string[];
    setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
    selectedCities: string[];
    setSelectedCities: React.Dispatch<React.SetStateAction<string[]>>;
    selectedDays: string[];
    setSelectedDays: React.Dispatch<React.SetStateAction<string[]>>;
    minPrice: number | "";
    setMinPrice: React.Dispatch<React.SetStateAction<number | "">>;
    maxPrice: number | "";
    setMaxPrice: React.Dispatch<React.SetStateAction<number | "">>;
    onClearFilters: () => void;
}

const CounsellorListing: React.FC<FilterProps> = ({
    selectedExperience, setSelectedExperience,
    selectedLanguages, setSelectedLanguages,
    selectedCities, setSelectedCities,
    selectedDays, setSelectedDays,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    onClearFilters
}) => {
    const [citySearch, setCitySearch] = useState("");
    const [languageSearch, setLanguageSearch] = useState("");
    const [showPriceTooltip, setShowPriceTooltip] = useState(false);
    const [openSection, setOpenSection] = useState<"experience" | "language" | "city" | "price" | "days" | null>("experience");

    // --- Data Definitions ---
    const experienceLevels = [
        { label: "Entry Level", sub: "0-1 years", value: "entry" },
        { label: "Junior Level", sub: "1-3 years", value: "junior" },
        { label: "Senior Level", sub: "3+ years", value: "senior" },
    ];

    const languages = ["Hindi", "English", "Marathi", "Kannada", "Telugu", "Tamil", "Malayalam", "Gujarati", "Bengali"];
    const allCities = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Noida", "Patna"];
    
    const filteredCities = useMemo(() =>
        allCities.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())),
        [citySearch]
    );

    const filteredLanguages = useMemo(() =>
        languages.filter(language => language.toLowerCase().includes(languageSearch.toLowerCase())),
        [languages, languageSearch]
    );

    const workingDays = [
        { row: ["Mon", "Tue", "Wed", "Thu"] },
        { row: ["Fri", "Sat", "Sun"] }
    ];

    // --- Toggle Logic ---
    const toggleFilter = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };

    const isPriceChanged = minPrice !== 100 || maxPrice !== 10000;
    const activeFilterCount = selectedExperience.length + selectedLanguages.length + selectedCities.length + selectedDays.length + (isPriceChanged ? 1 : 0);

    const toggleSection = (section: "experience" | "language" | "city" | "price" | "days") => {
        setOpenSection((prev) => (prev === section ? null : section));
    };

    return (
        <div className="w-full">
            <div className="hidden lg:flex sticky top-0 z-20 box-border flex-row justify-between items-center px-5 py-4 w-full h-[64px] bg-white border border-[#E6E6E6] rounded-[8px]">
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

            {/* Experience Section */}
            <div className={`box-border flex flex-col items-center mt-0 lg:mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "experience" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
                <button type="button" onClick={() => toggleSection("experience")} className="box-border flex flex-row justify-between items-center px-5 py-5 w-full h-[67px] bg-white border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
                    <span className="font-[Poppins] font-medium text-[16px] lg:text-[18px] text-[#242645]">Experience</span>
                    {openSection === "experience" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
                </button>
                {openSection === "experience" && (
                <div className="flex flex-col gap-[10px] w-full px-5">
                    {experienceLevels.map((lvl) => (
                        <div key={lvl.value} className="flex flex-row items-center gap-[12px] cursor-pointer" onClick={() => toggleFilter(selectedExperience, setSelectedExperience, lvl.value)}>
                            <div className={`box-border w-[18px] h-[18px] flex justify-center items-center ${selectedExperience.includes(lvl.value) ? 'bg-[#0E1629]' : 'bg-white border border-[#CED1D9]'}`}>
                                {selectedExperience.includes(lvl.value) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-[Poppins] text-[14px] leading-[21px] ${selectedExperience.includes(lvl.value) ? 'font-medium' : 'font-normal'} text-[#0E1629]`}>{lvl.label}</span>
                                <span className="font-[Poppins] font-normal text-[12px] leading-[18px] text-[#0E1629]">{lvl.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>

            {/* Language Section */}
            <div className={`flex flex-col items-center w-full bg-white border border-[#E6E6E6] rounded-[8px] mt-[12px] ${openSection === "language" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
                <button type="button" onClick={() => toggleSection("language")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
                    <span className="font-[Poppins] font-medium text-[16px] lg:text-[18px] text-[#242645]">Language</span>
                    {openSection === "language" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
                </button>
                {openSection === "language" && (
                <div className="w-full px-5 flex flex-col gap-[16px]">
                    <div className="relative w-full h-[40px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                        <Search className="w-5 h-5 text-[#343C6A]" />
                        <input type="text" placeholder="Search Languages" value={languageSearch} onChange={(e) => setLanguageSearch(e.target.value)} className="ml-[8px] w-full h-full bg-transparent outline-none font-medium font-[Poppins] text-[14px] text-[#232323] placeholder:text-[#232323]" />
                    </div>
                    <div className="flex flex-col gap-[10px] max-h-[220px] overflow-y-auto scrollbar-hide">
                    {filteredLanguages.map(lang => (
                        <div key={lang} className="flex flex-row items-center gap-[12px] cursor-pointer" onClick={() => toggleFilter(selectedLanguages, setSelectedLanguages, lang)}>
                            <div className={`box-border w-[18px] h-[18px] flex justify-center items-center ${selectedLanguages.includes(lang) ? 'bg-[#0E1629]' : 'bg-white border border-[#CED1D9]'}`}>
                                {selectedLanguages.includes(lang) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <span className={`font-[Poppins] text-[14px] leading-[21px] ${selectedLanguages.includes(lang) ? 'font-medium' : 'font-normal'} text-[#0E1629]`}>{lang}</span>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </div>

            {/* City Section */}
            <div className={`box-border flex flex-col items-center w-full bg-white border border-[#E6E6E6] rounded-[8px] mt-[12px] ${openSection === "city" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
                <button type="button" onClick={() => toggleSection("city")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
                    <span className="font-[Poppins] font-medium text-[16px] lg:text-[18px] text-[#242645]">City</span>
                    {openSection === "city" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
                </button>
                {openSection === "city" && (
                <div className="w-full px-5 flex flex-col gap-[16px]">
                    <div className="relative w-full h-[40px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                        <Search className="w-5 h-5 text-[#343C6A]" />
                        <input type="text" placeholder="Search Cities" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="ml-[8px] w-full h-full bg-transparent outline-none font-medium font-[Poppins] text-[14px] text-[#232323] placeholder:text-[#232323]" />
                    </div>
                    <div className="flex flex-col gap-[10px] max-h-[200px] overflow-y-auto scrollbar-hide">
                        {filteredCities.map(city => (
                            <div key={city} className="flex flex-row items-center gap-[12px] cursor-pointer" onClick={() => toggleFilter(selectedCities, setSelectedCities, city)}>
                                <div className={`box-border w-[18px] h-[18px] flex justify-center items-center ${selectedCities.includes(city) ? 'bg-[#0E1629]' : 'bg-white border border-[#CED1D9]'}`}>
                                    {selectedCities.includes(city) && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                <span className={`font-[Poppins] text-[14px] leading-[21px] ${selectedCities.includes(city) ? 'font-medium' : 'font-normal'} text-[#0E1629]`}>{city}</span>
                            </div>
                        ))}
                    </div>
                </div>
                )}
            </div>
            
            {/* Price Section */}
            <div className={`box-border flex flex-col items-center w-full bg-white border border-[#E6E6E6] rounded-[8px] mt-[12px] ${openSection === "price" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
                <button type="button" onClick={() => toggleSection("price")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
                    <span className="flex items-center gap-2 font-[Poppins] font-medium text-[16px] lg:text-[18px] text-[#242645]">
                        Price
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
                    {openSection === "price" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
                </button>
                {openSection === "price" && (
                <div className="flex flex-row justify-between w-full px-5 gap-4">
                    <div className="flex flex-col gap-[5px] flex-1">
                        <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Min Price</span>
                        <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                            <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-[5px] flex-1">
                        <span className="font-[Poppins] font-medium text-[12px] text-[#232323]">Max Price</span>
                        <div className="box-border w-full h-[36px] bg-white border border-[#EFEFEF] rounded-[12px] flex items-center px-[12px]">
                            <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-full h-full bg-transparent outline-none font-[Poppins] font-semibold text-[14px] text-[#6B7280] ml-1" />
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Working Days Section */}
            <div className={`box-border flex flex-col items-center w-full bg-white border border-[#E6E6E6] rounded-[8px] mt-[12px] ${openSection === "days" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
                <button type="button" onClick={() => toggleSection("days")} className="box-border flex flex-row justify-between items-center px-[20px] py-[20px] w-full border-b border-[#E6E6E6] rounded-t-[8px] cursor-pointer">
                    <span className="font-[Poppins] font-medium text-[16px] lg:text-[18px] text-[#242645]">Working Days</span>
                    {openSection === "days" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
                </button>
                {openSection === "days" && (
                <div className="flex flex-col gap-[10px] w-full px-5">
                    {workingDays.map((group, idx) => (
                        <div key={idx} className="flex flex-row gap-[8px] w-full">
                            {group.row.map((day) => (
                                <div
                                    key={day}
                                    className={`box-border flex-1 flex justify-center items-center py-[8px] rounded-[10px] cursor-pointer transition-colors border ${selectedDays.includes(day) ? 'bg-[#0E1629] border-[#0E1629] text-white' : 'bg-white border-[#EFEFEF] text-[#232323]'}`}
                                    onClick={() => toggleFilter(selectedDays, setSelectedDays, day)}
                                >
                                    <span className="font-[Poppins] font-medium text-[12px] lg:text-[14px] leading-[21px]">{day}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                )}
            </div>

            <div className="hidden lg:block w-full mt-4 mb-[70px]">
                <button
                    onClick={onClearFilters}
                    disabled={activeFilterCount === 0}
                    className={`w-full h-[48px] rounded-[8px] font-[Poppins] font-medium text-[16px] transition-all border outline-none ${
                        activeFilterCount > 0
                            ? 'bg-white border-[#0E1629] text-[#0E1629] hover:bg-[#F8F9FA] cursor-pointer'
                            : 'bg-[#F9F9F9] border-[#E6E6E6] text-[#A0A0A0] cursor-not-allowed'
                    }`}
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default CounsellorListing;